"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * The Menu's ground as a bas-relief of facet planes in charcoal, lit by a
 * chartreuse-white light that follows the pointer and drifts on its own when
 * nobody moves. A procedural stand-in for the house's modelled geometry: the
 * GLB from the 3D artist slots in here later with the same light rig.
 */

const pointer = { x: 0.2, y: 0.1, idle: 0 };

function Facets() {
  const { viewport } = useThree();
  const mesh = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const w = viewport.width * 1.35;
    const h = viewport.height * 1.35;
    const cols = Math.round(w * 1.9);
    const rows = Math.round(h * 1.9);
    const g = new THREE.PlaneGeometry(w, h, cols, rows);
    const pos = g.attributes.position as THREE.BufferAttribute;
    // Layered, deterministic relief: broad swells, finer ridges, and a jitter
    // so no two facets share a plane.
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const swell = Math.sin(x * 0.5 + 1.3) * Math.cos(y * 0.55 - 0.4) * 0.5;
      const ridge = Math.sin(x * 1.4 + y * 0.9) * 0.12 + Math.cos(x * 0.7 - y * 1.8) * 0.1;
      const jitter = (rnd() - 0.5) * 0.16;
      pos.setZ(i, swell + ridge + jitter);
      // Nudge x/y too so the triangles stop reading as a grid.
      pos.setX(i, x + (rnd() - 0.5) * 0.22);
      pos.setY(i, y + (rnd() - 0.5) * 0.22);
    }
    const flat = g.toNonIndexed();
    flat.computeVertexNormals();
    g.dispose();
    return flat;
  }, [viewport.width, viewport.height]);

  useFrame((_, dt) => {
    if (!mesh.current) return;
    // A breath of parallax toward the pointer.
    const tx = -pointer.y * 0.06;
    const ty = pointer.x * 0.08;
    mesh.current.rotation.x += (tx - mesh.current.rotation.x) * Math.min(1, dt * 2);
    mesh.current.rotation.y += (ty - mesh.current.rotation.y) * Math.min(1, dt * 2);
  });

  return (
    <mesh ref={mesh} geometry={geometry} position={[0, 0, -0.4]}>
      <meshStandardMaterial color="#2c2c2a" roughness={0.58} metalness={0.12} flatShading />
    </mesh>
  );
}

function Light() {
  const { viewport } = useThree();
  const light = useRef<THREE.PointLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const target = useRef(new THREE.Vector3(1, 0.5, 2.4));
  const time = useRef(0);

  useFrame((_, dt) => {
    time.current += dt;
    pointer.idle += dt;
    let px = pointer.x;
    let py = pointer.y;
    if (pointer.idle > 3) {
      // Nobody is moving: wander slowly across the relief.
      px = Math.sin(time.current * 0.21) * 0.55;
      py = Math.cos(time.current * 0.17) * 0.4;
    }
    target.current.set((px * viewport.width) / 2, (py * viewport.height) / 2, 2.2);
    if (light.current) {
      light.current.position.lerp(target.current, Math.min(1, dt * 2.2));
    }
    if (fill.current) {
      fill.current.position.set(-viewport.width * 0.4, viewport.height * 0.45, 3.5);
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} color="#fcf3e8" />
      <pointLight ref={light} color="#e9ead0" intensity={30} distance={8.5} decay={2} />
      <pointLight ref={fill} color="#fffdfa" intensity={7} distance={14} decay={2} />
    </>
  );
}

export default function MenuRelief() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      pointer.idle = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="menu__relief" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ fov: 32, position: [0, 0, 11], near: 0.1, far: 40 }}
      >
        <Facets />
        <Light />
      </Canvas>
    </div>
  );
}
