"use client";

import { useEffect, useState } from "react";
import { MenuLight } from "./MenuLight";
import { ReliefWall, type Relief } from "@/components/home/ReliefWall";

/* The Menu's wall: the Home reliefs carved in the charcoal, around the menu
   (x, w in vw and y in vh from the top left). The light follows the cursor
   and wanders when nobody moves. */
const R = "/images/relief";
const reliefs: Relief[] = [
  { src: `${R}/swan-flight.webp`, aspect: 1.506, x: 67, y: 31, w: 64, depth: 0.55, seed: 11, phone: { x: 56, y: 21, w: 122 } },
  { src: `${R}/branch.webp`, aspect: 1.506, x: 17, y: 19, w: 42, depth: 0.3, rot: -6, seed: 12, phone: { x: 22, y: 50, w: 74 } },
  { src: `${R}/peonies.webp`, aspect: 1, x: 14, y: 76, w: 30, depth: 0.45, seed: 13, phone: { x: 26, y: 82, w: 66 } },
  { src: `${R}/swan-glide.webp`, aspect: 1.506, x: 84, y: 79, w: 32, depth: 0.35, seed: 14, phone: { x: 78, y: 66, w: 62 } },
  { src: `${R}/constellation.webp`, aspect: 1, x: 44, y: 11, w: 15, depth: 0.2, seed: 15, phone: { hide: true } },
];

/**
 * The Menu's ground: the dark relief wall when WebGL is there, otherwise the
 * CSS light that follows the pointer.
 */
export function MenuGround() {
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setWebgl(!!document.createElement("canvas").getContext("webgl")));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <>
      {!webgl && <MenuLight />}
      <ReliefWall reliefs={reliefs} theme="dark" waitForIntro={false} />
    </>
  );
}
