"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
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
  const firstPath = useRef(pathname);

  // Pages fade in (CSS .page-in) only when reached by navigation: the first
  // document paints at once, which is both calmer and what LCP measures.
  // A layout effect, so the flag is set before the new page's first paint.
  useLayoutEffect(() => {
    if (pathname !== firstPath.current) document.documentElement.setAttribute("data-navigated", "");
  }, [pathname]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
    if (reduced) return;

    const instance = new Lenis({ lerp: 0.05, smoothWheel: true });
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

  // Each reference keeps its own hand on the wheel: Immersive Garden's pages
  // glide on a 0.05 lerp; the Sanctuary (Capitolium) eases every wheel step
  // over 1.2 s, expo out.
  useEffect(() => {
    const l = lenisRef.current;
    if (!l) return;
    const capitolium = pathname.startsWith("/sanctuary");
    l.options.lerp = capitolium ? 0.1 : 0.05;
    l.options.duration = capitolium ? 1.2 : undefined;
    l.options.easing = capitolium ? (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) : undefined;
  }, [pathname]);

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

  // New route: let triggers re-measure once the page has laid out. Next resets
  // the scroll position itself; hash targets are landed by PageFade, which
  // mounts with the new page's DOM.
  useEffect(() => {
    const id = window.setTimeout(() => {
      lenisRef.current?.resize();
      ScrollTrigger.refresh();
    }, 60);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>;
}
