# Universal Visual Player and Mobile Bridge

## Components
`VisualLessonScreen`, `VisualPlayerShell`, `ManifestValidator`, `AssetLoader`, `RendererRegistry`, `Model3DRenderer`, `Diagram2DRenderer`, `Animation2DRenderer`, `SimulationRenderer`, `VideoRenderer`, `SceneController`, `CameraController`, `LayerController`, `HotspotController`, `AnnotationOverlay`, `AnimationTimeline`, `GuidedTourController`, `AccessibilityController`, `PlayerEventBus`, `FallbackController`, `MobileBridgeAdapter`, `LessonNotesPanel`, `VisualQuizPanel`.

## Manifest (versioned)
```ts
type AssetKind='MODEL_3D'|'DIAGRAM_2D'|'ANIMATION_2D'|'VIDEO'|'SIMULATION';
interface VisualAssetManifest {
 schemaVersion:'1.0'; assetId:string; assetVersionId:string;
 kind:AssetKind; title:string; sourceUrl:string; fallbackUrl?:string;
 checksumSha256:string;
 model?: {format:'glb'; initialCamera?:{position:[number,number,number];target:[number,number,number]}; layers:string[]; animations:string[]};
 hotspots:{id:string;label:string;targetNode?:string;position?:[number,number,number];explanation?:string}[];
 accessibility:{description:string;reducedMotionSupported:boolean;captionsUrl?:string};
}
```
All URLs allowlisted; schema validated before rendering; GLB external references restricted. Treat SVG and external files as untrusted.

## Interaction contract
Explore (orbit/zoom/pan, toggle layers, isolate structures, clipping/cross-section where supported), Learn (guided camera/timeline, captions, narration), Test (structure identification, quiz UI). Reuse renderer; separate assessment scoring.

## Player states
`IDLE → LOADING → READY → INTERACTING → COMPLETED`; failures: `LOADING → ERROR → FALLBACK`, `READY → CONTEXT_LOST → RECOVERING → READY|FALLBACK`.

## Mobile bridge
Versioned JSON message `{protocolVersion:1,messageId,type,payload}`. Types `PLAYER_READY`, `STRUCTURE_SELECTED`, `SEQUENCE_COMPLETED`, `PLAYER_ERROR`; validate origin, lesson context, payload size and type in Flutter and web. No arbitrary JS, file access, navigation or privileged commands. Queue/deduplicate messages, handle app pause/resume and network loss. Use Flutter WebView + Three.js initially only if compatible with existing stack and target devices.

## Performance targets (provisional, measure)
30 FPS on reference midrange Android; first meaningful render ~3s on defined network/device; typical optimized GLB ~5MB where scientific detail permits; 100% fallback for published 3D lessons; UI control response <100ms. Test rather than assert these are achieved.

## Accessibility
Keyboard equivalents, focus order, touch target sizes, text equivalents, captions, reduced-motion mode, diagram fallback, contrast, screen-reader lesson notes, no knowledge gated exclusively behind 3D interaction.
