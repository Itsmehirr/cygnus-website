"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

type LenisRef = React.MutableRefObject<Lenis | null>;
const LenisContext = createContext<LenisRef | null>(null);

/** The live Lenis instance (null under reduced motion or before mount). */
export const useLenis = () => useContext(LenisContext)?.current ?? null;

/**
 * Mounts one Lenis instance for the whole app and feeds its scroll position to
 * ScrollTrigger from GSAP's ticker, so every scrubbed timeline shares one clock.
 * Skipped entirely under prefers-reduced-motion: the page then scrolls natively
 * and the motion components render their resting state.
 */
export function ScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
    if (reduced) return;

    const instance = new Lenis({ lerp: 0.08, smoothWheel: true });
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenisRef.current = instance;

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenisRef.current = null;
    };
  }, []);

  // The header becomes a bar once the page has scrolled (body.is-scrolled).
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      document.body.classList.toggle("is-scrolled", window.scrollY > 72);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // New route: start at the top and let triggers re-measure once the page has laid out.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 60);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>;
}
