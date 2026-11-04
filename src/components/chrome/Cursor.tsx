"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * A charcoal dot that snaps to the pointer and a ring that lags behind it,
 * with a label when the pointer rests on anything that carries `data-cursor`.
 * Mounted only for fine pointers; touch devices never see it.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const d = dot.current!;
    const r = ring.current!;
    const l = label.current!;
    document.documentElement.dataset.cursor = "custom";

    let tx = -100,
      ty = -100,
      rx = -100,
      ry = -100,
      shown = false;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        rx = tx;
        ry = ty;
        d.style.opacity = "1";
        r.style.opacity = "1";
      }
    };
    const onLeave = () => {
      d.style.opacity = "0";
      r.style.opacity = "0";
      shown = false;
    };
    const onOver = (e: Event) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor], a, button");
      const text = target?.dataset.cursor ?? "";
      l.textContent = text;
      r.classList.toggle("is-active", !!target);
      r.classList.toggle("has-label", !!text);
    };

    const tick = () => {
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;
      d.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseover", onOver);
    gsap.ticker.add(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseover", onOver);
      gsap.ticker.remove(tick);
      delete document.documentElement.dataset.cursor;
    };
  }, []);

  return (
    <div className="cursor" aria-hidden="true">
      <div ref={dot} className="cursor__dot" />
      <div ref={ring} className="cursor__ring">
        <span ref={label} className="cursor__label" />
      </div>
    </div>
  );
}
