---
name: threejs-3d-web-graphics
description: >-
  Architectural patterns, shaders, and performance techniques for 3D web applications,
  WebGL, Three.js, React Three Fiber, and high-performance interactive Canvas scenes.
  Use when building interactive 3D hero backgrounds, floating geometric models,
  particle network constellations, DNA/biomolecular visualizations, or custom WebGL shaders
  in React and Next.js.
---

# Three.js & 3D Web Graphics: High-Performance WebGL Engineering

This skill equips the agent to architect and deliver silky-smooth 60fps 3D web experiences, interactive particle networks, and WebGL visualizations without memory leaks or battery drainage.

---

## 1. Core Architecture: Canvas vs. Three.js vs. R3F

Choose the right 3D graphics layer based on scene complexity:

| Tech Layer | When to Use | Memory Footprint | Bundle Cost |
| :--- | :--- | :--- | :--- |
| **Interactive HTML5 2D/3D Canvas** | Particle constellations, glowing nebulae, neural networks | Minimal (~2 KB) | 0 KB (Native browser API) |
| **Vanilla Three.js (`three`)** | Custom shaders, particle waves, floating 3D geometry | Moderate (~140 KB gzip) | Direct bundle import |
| **React Three Fiber (`@react-three/fiber`)** | Declarative 3D scenes, complex 3D GLTF models, lighting | Moderate (~180 KB gzip) | Declarative React trees |

---

## 2. The 5 Cardinal Rules of WebGL Performance

### 1. Clamp Device Pixel Ratio
High-DPI retina screens (3x–4x) will melt mobile GPUs if rendered at native pixel density. Always clamp:
```typescript
const dpr = Math.min(window.devicePixelRatio, 2);
renderer.setPixelRatio(dpr);
```

### 2. Strict Memory Disposal
Three.js does NOT automatically garbage collect GPU buffers when React unmounts a component. Every mesh, geometry, material, and texture must be explicitly disposed:
```typescript
useEffect(() => {
  return () => {
    geometry.dispose();
    material.dispose();
    if (material.map) material.map.dispose();
    renderer.dispose();
  };
}, []);
```

### 3. Pause Animation Loop When Off-Screen
Never run requestAnimationFrame loops when the 3D element is scrolled out of view. Use `IntersectionObserver`:
```typescript
useEffect(() => {
  let isVisible = true;
  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) animate();
  });
  if (canvasRef.current) observer.observe(canvasRef.current);
  return () => observer.disconnect();
}, []);
```

### 4. Frustum Culling & Instanced Meshes
For repetitive particles or shapes (e.g. 1,000 floating dots or DNA base pairs), never create 1,000 separate `new THREE.Mesh()`. Always use `THREE.InstancedMesh` with a single draw call.

### 5. Graceful Fallback
If WebGL context creation fails (e.g., in headless browsers, battery-saver modes, or restricted VMs), gracefully degrade to a luxurious CSS aurora gradient without throwing uncaught runtime exceptions.

---

## 3. Production Recipe: Zero-Dependency Interactive 3D Particle Constellation

This lightweight, high-performance canvas engine delivers high visual depth with 0 external dependencies:

```typescript
'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export function InteractiveParticleConstellation({
  particleCount = 50,
  maxDistance = 120,
  color = '82, 67, 224', // Samyak Royal Indigo RGB
}: {
  particleCount?: number;
  maxDistance?: number;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2 + 1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, 0.6)`;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${color}, ${1 - dist / maxDistance * 0.8})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [particleCount, maxDistance, color]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />;
}
```
