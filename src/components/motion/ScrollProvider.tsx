"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const LenisContext = createContext<Lenis | null>(null);

/** The live Lenis instance: null on the first render, then the instance (the
 *  component re-renders when it arrives, so effects keyed on it run). */
export const useLenis = () => useContext(LenisContext);

/**
 * Mounts one Lenis instance for the whole app and feeds its scroll position to
 * ScrollTrigger from GSAP's ticker, so every scrubbed timeline shares one clock.
 * It runs whatever the system's "Reduce motion" setting says, as both
 * references do.
 */
export function ScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = usePathname();
  const firstPath = useRef(pathname);

  // Pages fade in (CSS .page-in) only when reached by navigation: the first
  // document paints at once, which is both calmer and what LCP measures.
  // A layout effect, so the flag is set before the new page's first paint.
  useLayoutEffect(() => {
    if (pathname !== firstPath.current) document.documentElement.setAttribute("data-navigated", "");
  }, [pathname]);

  useEffect(() => {
    // Full motion for everyone, as on both references (the system's
    // "Reduce motion" setting is deliberately not consulted).
    document.documentElement.dataset.motion = "full";

    const instance = new Lenis({ lerp: 0.05, smoothWheel: true });
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenisRef.current = instance;
    // Hand the instance to consumers on the next frame (they mounted before it
    // existed and re-render when it arrives).
    const handoff = window.requestAnimationFrame(() => setLenis(instance));

    return () => {
      window.cancelAnimationFrame(handoff);
      gsap.ticker.remove(tick);
      instance.destroy();
      lenisRef.current = null;
      setLenis(null);
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

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
