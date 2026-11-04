"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * A soft chartreuse-white light on the Menu's charcoal ground that follows the
 * pointer with a lag; on touch, or when nobody moves, it drifts slowly on its
 * own. Pure CSS variables, so it costs nothing; Phase 3 replaces the ground
 * with the WebGL relief and keeps this light as its fallback.
 */
export function MenuLight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fine = window.matchMedia("(pointer: fine)").matches;

    let tx = 0.62,
      ty = 0.42,
      x = tx,
      y = ty,
      idle = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth;
      ty = e.clientY / window.innerHeight;
      idle = 0;
    };

    const tick = (time: number) => {
      idle += 1;
      if (!fine || idle > 180) {
        tx = 0.5 + Math.sin(time * 0.17) * 0.28;
        ty = 0.45 + Math.cos(time * 0.11) * 0.22;
      }
      x += (tx - x) * 0.05;
      y += (ty - y) * 0.05;
      el.style.setProperty("--lx", `${(x * 100).toFixed(2)}%`);
      el.style.setProperty("--ly", `${(y * 100).toFixed(2)}%`);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    gsap.ticker.add(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.ticker.remove(tick);
    };
  }, []);

  return <div ref={ref} className="menu__light" aria-hidden="true" />;
}
