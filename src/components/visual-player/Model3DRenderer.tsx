'use client';

/**
 * three.js renderer for MODEL_3D visuals (decision D2). Loaded only through
 * next/dynamic from VisualPlayerShell, so no other page carries three.js.
 *
 * It does what the shell asks (layers, highlights, camera) and reports what
 * happened (loaded, failed, context lost, part picked). It keeps no lesson
 * state of its own.
 */
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { VisualAssetManifest } from '@/lib/cee-visual/schemas';

type Vec3 = [number, number, number];
export interface CameraPose {
  position: Vec3;
  target: Vec3;
}

export interface Model3DRendererProps {
  url: string;
  manifest: VisualAssetManifest;
  visibleLayers: ReadonlySet<string>;
  highlight: readonly string[];
  selectedHotspotId: string | null;
  camera: CameraPose | null;
  /** Change to re-apply `camera` even if it is the same pose. */
  cameraNonce: number;
  reducedMotion: boolean;
  onLoaded(): void;
  onProgress(fraction: number | null): void;
  onError(code: string): void;
  onSelectHotspot(id: string): void;
  onContextLost(): void;
  onContextRestored(): void;
  onInteract(): void;
  /** Lab only: lets the test page simulate a lost WebGL context. */
  onDebugReady?(api: { loseContext(): void }): void;
}

// Bytes are kept per URL for the page's lifetime, so recovering from a lost
// context doesn't download the model again (and works after the URL expires).
const byteCache = new Map<string, ArrayBuffer>();

async function fetchModel(url: string, onProgress: (f: number | null) => void, signal: AbortSignal): Promise<ArrayBuffer> {
  const cached = byteCache.get(url);
  if (cached) return cached;
  const res = await fetch(url, { signal, credentials: 'omit', cache: 'no-store' });
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { code: `HTTP_${res.status}` });
  const total = Number(res.headers.get('content-length')) || 0;
  if (!res.body || !total) {
    onProgress(null);
    const buf = await res.arrayBuffer();
    byteCache.set(url, buf);
    return buf;
  }
  const reader = res.body.getReader();
  const out = new Uint8Array(total);
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (received + value.length > total) throw Object.assign(new Error('size mismatch'), { code: 'SIZE_MISMATCH' });
    out.set(value, received);
    received += value.length;
    onProgress(received / total);
  }
  if (received !== total) throw Object.assign(new Error('truncated'), { code: 'TRUNCATED' });
  byteCache.set(url, out.buffer);
  return out.buffer;
}

interface LoadedModel {
  scene: THREE.Group;
  /** node name → meshes under it */
  meshesByNode: Map<string, THREE.Mesh[]>;
  objectsByNode: Map<string, THREE.Object3D>;
  bounds: THREE.Sphere;
}

function prepare(scene: THREE.Group): LoadedModel {
  const meshesByNode = new Map<string, THREE.Mesh[]>();
  const objectsByNode = new Map<string, THREE.Object3D>();
  scene.traverse((o) => {
    if (o.name && !objectsByNode.has(o.name)) objectsByNode.set(o.name, o);
    if ((o as THREE.Mesh).isMesh) {
      const mesh = o as THREE.Mesh;
      // Own copy of each material, so highlighting one part never tints another that shares it.
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => m.clone()) : mesh.material.clone();
    }
  });
  for (const [name, obj] of objectsByNode) {
    const meshes: THREE.Mesh[] = [];
    obj.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });
    meshesByNode.set(name, meshes);
  }
  const bounds = new THREE.Box3().setFromObject(scene).getBoundingSphere(new THREE.Sphere());
  return { scene, meshesByNode, objectsByNode, bounds };
}

function dispose(scene: THREE.Object3D) {
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
      m.dispose();
    }
  });
}

// Warm amber: stands out against both the reds and blues typical of anatomy models.
const HIGHLIGHT = new THREE.Color('#FFB020');

function applyVisibility(model: LoadedModel, manifest: VisualAssetManifest, visible: ReadonlySet<string>) {
  const layers = manifest.model?.layers ?? [];
  const inLayer = new Map<string, boolean>();
  for (const l of layers) for (const n of l.nodeNames) inLayer.set(n, (inLayer.get(n) ?? false) || visible.has(l.key));
  for (const [name, show] of inLayer) {
    const obj = model.objectsByNode.get(name);
    if (obj) obj.visible = show;
  }
}

function applyHighlight(model: LoadedModel, names: ReadonlySet<string>) {
  for (const [name, meshes] of model.meshesByNode) {
    const on = names.has(name);
    for (const mesh of meshes) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        const std = m as THREE.MeshStandardMaterial;
        if (!std.emissive) continue;
        if (std.userData.baseEmissive === undefined) {
          std.userData.baseEmissive = std.emissive.getHex();
          std.userData.baseIntensity = std.emissiveIntensity;
        }
        if (on) {
          std.emissive.copy(HIGHLIGHT);
          std.emissiveIntensity = 0.6;
        } else {
          std.emissive.setHex(std.userData.baseEmissive as number);
          std.emissiveIntensity = std.userData.baseIntensity as number;
        }
      }
    }
  }
}

function CameraRig({
  pose,
  nonce,
  reducedMotion,
  defaultTarget,
}: {
  pose: CameraPose | null;
  nonce: number;
  reducedMotion: boolean;
  defaultTarget: THREE.Vector3;
}) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; update(): void } | null;
  const invalidate = useThree((s) => s.invalidate);
  const anim = useRef<{ fromPos: THREE.Vector3; fromTarget: THREE.Vector3; toPos: THREE.Vector3; toTarget: THREE.Vector3; t: number } | null>(null);
  const applied = useRef(false);

  useEffect(() => {
    if (!controls) return;
    if (!pose) {
      if (!applied.current) {
        controls.target.copy(defaultTarget);
        controls.update();
        applied.current = true;
        invalidate();
      }
      return;
    }
    const toPos = new THREE.Vector3(...pose.position);
    const toTarget = new THREE.Vector3(...pose.target);
    // The first pose is applied instantly; later ones animate unless motion is reduced.
    if (reducedMotion || !applied.current) {
      applied.current = true;
      camera.position.copy(toPos);
      controls.target.copy(toTarget);
      controls.update();
      anim.current = null;
      invalidate();
      return;
    }
    anim.current = { fromPos: camera.position.clone(), fromTarget: controls.target.clone(), toPos, toTarget, t: 0 };
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, controls]);

  useFrame((_, delta) => {
    const a = anim.current;
    if (!a || !controls) return;
    a.t = Math.min(1, a.t + delta / 0.9);
    const e = a.t < 0.5 ? 4 * a.t ** 3 : 1 - (-2 * a.t + 2) ** 3 / 2; // ease in-out
    camera.position.lerpVectors(a.fromPos, a.toPos, e);
    controls.target.lerpVectors(a.fromTarget, a.toTarget, e);
    controls.update();
    if (a.t >= 1) anim.current = null;
    else invalidate();
  });
  return null;
}

function Scene(props: Model3DRendererProps & { model: LoadedModel }) {
  const { model, manifest, visibleLayers, highlight, selectedHotspotId, onSelectHotspot, onInteract } = props;
  const invalidate = useThree((s) => s.invalidate);

  const hotspotByNode = useMemo(() => {
    const m = new Map<string, string>();
    for (const h of manifest.hotspots) if (h.targetNode && !m.has(h.targetNode)) m.set(h.targetNode, h.id);
    return m;
  }, [manifest.hotspots]);

  const selected = manifest.hotspots.find((h) => h.id === selectedHotspotId) ?? null;
  const highlightSet = useMemo(() => {
    const s = new Set(highlight);
    if (selected?.targetNode) s.add(selected.targetNode);
    return s;
  }, [highlight, selected]);

  useEffect(() => {
    applyVisibility(model, manifest, visibleLayers);
    invalidate();
  }, [model, manifest, visibleLayers, invalidate]);

  useEffect(() => {
    applyHighlight(model, highlightSet);
    invalidate();
  }, [model, highlightSet, invalidate]);

  const labelPosition = useMemo((): Vec3 | null => {
    if (!selected) return null;
    if (selected.position) return selected.position;
    const obj = selected.targetNode ? model.objectsByNode.get(selected.targetNode) : undefined;
    if (!obj) return null;
    const box = new THREE.Box3().setFromObject(obj);
    const c = box.getCenter(new THREE.Vector3());
    return [c.x, box.max.y + 0.15, c.z];
  }, [selected, model]);

  const pick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return; // a drag, not a click
    e.stopPropagation();
    let o: THREE.Object3D | null = e.object;
    while (o) {
      const id = hotspotByNode.get(o.name);
      if (id) {
        onSelectHotspot(id);
        return;
      }
      o = o.parent;
    }
  };

  return (
    <>
      <hemisphereLight args={['#ffffff', '#8a8f9c', 1.1]} />
      <directionalLight position={[4, 6, 5]} intensity={1.7} />
      <directionalLight position={[-5, 2, -4]} intensity={0.5} />
      <primitive object={model.scene} onClick={pick} />
      {manifest.hotspots
        .filter((h) => !h.targetNode && h.position)
        .map((h) => (
          <mesh key={h.id} position={h.position} onClick={(e) => (e.stopPropagation(), onSelectHotspot(h.id))}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color={h.id === selectedHotspotId ? '#00BFA5' : '#5243E0'} />
          </mesh>
        ))}
      {selected && labelPosition && (
        <Html position={labelPosition} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <span className="whitespace-nowrap rounded-md bg-[rgba(9,13,26,0.88)] px-2 py-1 text-xs font-semibold text-white shadow">
            {selected.label}
          </span>
        </Html>
      )}
      <CameraRig pose={props.camera} nonce={props.cameraNonce} reducedMotion={props.reducedMotion} defaultTarget={model.bounds.center} />
      <OrbitControls
        makeDefault
        enableDamping={!props.reducedMotion}
        minDistance={model.bounds.radius * 0.4}
        maxDistance={model.bounds.radius * 6}
        onStart={onInteract}
      />
    </>
  );
}

export default function Model3DRenderer(props: Model3DRendererProps) {
  const { url, onLoaded, onError, onProgress, onContextLost, onContextRestored, onDebugReady } = props;
  const [model, setModel] = useState<LoadedModel | null>(null);
  const callbacks = useRef({ onLoaded, onError, onProgress, onContextLost, onContextRestored });
  callbacks.current = { onLoaded, onError, onProgress, onContextLost, onContextRestored };
  // React Three Fiber forces the old context to be lost ~500 ms after unmount.
  // That is cleanup, not a crash, so a retired renderer reports nothing.
  const retired = useRef(false);
  useEffect(() => {
    retired.current = false;
    return () => {
      retired.current = true;
    };
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    let loaded: LoadedModel | null = null;
    (async () => {
      try {
        const bytes = await fetchModel(url, (f) => callbacks.current.onProgress(f), ctrl.signal);
        const gltf = await new GLTFLoader().parseAsync(bytes, '');
        if (ctrl.signal.aborted) return dispose(gltf.scene);
        loaded = prepare(gltf.scene);
        setModel(loaded);
      } catch (e) {
        if (ctrl.signal.aborted) return;
        const code = (e as { code?: string }).code ?? 'PARSE_FAILED';
        callbacks.current.onError(code);
      }
    })();
    return () => {
      ctrl.abort();
      if (loaded) dispose(loaded.scene);
    };
  }, [url]);

  const initial = props.manifest.model?.initialCamera;
  const fitPosition = useMemo((): Vec3 => {
    if (initial) return initial.position;
    if (!model) return [0, 0, 6];
    const r = model.bounds.radius || 1;
    const c = model.bounds.center;
    return [c.x, c.y + r * 0.4, c.z + r * 2.6];
  }, [initial, model]);

  if (!model) return null;

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
      camera={{ fov: 40, near: 0.05, far: Math.max(100, model.bounds.radius * 20), position: fitPosition }}
      onCreated={({ gl }) => {
        const canvas = gl.domElement;
        canvas.addEventListener('webglcontextlost', (e) => {
          e.preventDefault(); // allows the browser to restore the context
          if (!retired.current) callbacks.current.onContextLost();
        });
        canvas.addEventListener('webglcontextrestored', () => {
          if (!retired.current) callbacks.current.onContextRestored();
        });
        onDebugReady?.({
          loseContext: () => {
            const ext = gl.getContext().getExtension('WEBGL_lose_context');
            ext?.loseContext();
            window.setTimeout(() => ext?.restoreContext(), 1200);
          },
        });
        onLoaded();
      }}
    >
      <Scene {...props} model={model} />
    </Canvas>
  );
}
