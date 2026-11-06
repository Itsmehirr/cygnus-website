"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Immersive Garden's FooterBlock: as the footer arrives its content rises
 * 60 px (2.8 s, expo.out, from 0.3 s) and its parts fade in (1.5 s,
 * sine.inOut, 0.05 s apart); the fixed cues step away while it is on screen.
 */
export function FooterMotion() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const footer = ref.current?.closest("footer");
    if (!footer) return;
    const html = document.documentElement;
    const inner = footer.querySelector<HTMLElement>(".container");
    const parts = Array.from(footer.querySelectorAll<HTMLElement>(".wordmark, .footer__col"));
    let tl: gsap.core.Timeline | null = null;
    // Opacity only, so the footer's links stay reachable by keyboard and screen
    // reader before it has scrolled into view.
    if (inner) gsap.set(parts, { opacity: 0 });
    const io = new IntersectionObserver(
      ([e]) => {
        html.classList.toggle("footer-in", e.isIntersecting);
        if (!inner) return;
        if (e.isIntersecting && !tl) {
          tl = gsap.timeline();
          tl.fromTo(inner, { y: 60 }, { y: 0, duration: 2.8, ease: "expo.out" }, 0.3).to(
            parts,
            { opacity: 1, duration: 1.5, ease: "sine.inOut", stagger: 0.05 },
            0.3,
          );
        } else if (!e.isIntersecting && e.boundingClientRect.top > 0 && tl) {
          tl.kill();
          tl = null;
          gsap.set(inner, { y: 0 });
          gsap.set(parts, { opacity: 0 });
        }
      },
      { threshold: 0.05 },
    );
    io.observe(footer);
    return () => {
      io.disconnect();
      tl?.kill();
      html.classList.remove("footer-in");
      gsap.set(parts, { clearProps: "opacity,visibility" });
      if (inner) gsap.set(inner, { clearProps: "transform" });
    };
  }, []);

  return <span ref={ref} hidden />;
}
