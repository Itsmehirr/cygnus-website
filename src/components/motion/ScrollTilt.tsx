"use client";

import { useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { useLenis } from "./ScrollProvider";

/**
 * Immersive Garden draws its media as WebGL planes that lean back with the
 * speed of the scroll (the top edge recedes while the page runs down, and
 * settles when it stops). Here every `[data-tilt]` block's media leans the
 * same way: rotateX follows Lenis's velocity, eased, at most 7°.
 */
export function ScrollTilt() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let target = 0;
    let cur = 0;
    const els = () => Array.from(document.querySelectorAll<HTMLElement>("[data-tilt] > *"));
    let list = els();
    const onScroll = ({ velocity }: { velocity: number }) => {
      target = Math.max(-7, Math.min(7, velocity * 0.18));
    };
    const tick = () => {
      target *= 0.9;
      cur += (target - cur) * 0.1;
      if (Math.abs(cur) < 0.01 && Math.abs(target) < 0.01) {
        if (cur !== 0) {
          cur = 0;
          list.forEach((e) => (e.style.transform = ""));
        }
        return;
      }
      const t = `perspective(1400px) rotateX(${cur.toFixed(3)}deg)`;
      list.forEach((e) => (e.style.transform = t));
    };
    const off = lenis.on("scroll", onScroll);
    gsap.ticker.add(tick);
    const mo = window.setInterval(() => (list = els()), 2000);
    return () => {
      off?.();
      gsap.ticker.remove(tick);
      window.clearInterval(mo);
      list.forEach((e) => (e.style.transform = ""));
    };
  }, [lenis]);

  return null;
}
