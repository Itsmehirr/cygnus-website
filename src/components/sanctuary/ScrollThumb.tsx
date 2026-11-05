"use client";

import { useEffect, useRef } from "react";

/**
 * Capitolium's ScrollThumb: a 4 × 48 px bar on the right edge that shows only
 * while the page moves (opacity eased over 0.6 s) and tracks the scroll.
 */
export function ScrollThumb() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t = 0;
    let raf = 0;
    const place = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      const travel = window.innerHeight - el.offsetHeight - 70;
      el.style.transform = `translate3d(0, ${35 + p * travel}px, 0)`;
    };
    const onScroll = () => {
      el.classList.add("is-on");
      window.clearTimeout(t);
      t = window.setTimeout(() => el.classList.remove("is-on"), 900);
      if (!raf) raf = requestAnimationFrame(place);
    };
    place();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="scroll-thumb" aria-hidden="true" />;
}
