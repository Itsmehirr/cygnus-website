"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { Wordmark } from "@/components/Wordmark";

const alreadyOpened = () => {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem("cygnus-opened") === "1";
  } catch {
    return false;
  }
};

/**
 * First-visit opening: the wordmark settles from wide to its final tracking
 * while a chartreuse rule draws across, then the veil lifts. Under 1.4 s,
 * once per session, never under reduced motion.
 */
export function Loader() {
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (alreadyOpened() || reduced) {
      el.remove();
      return;
    }

    const mark = el.querySelector<HTMLElement>(".loader__mark")!;
    const rule = el.querySelector<HTMLElement>(".loader__rule")!;
    document.documentElement.classList.add("is-opening");

    const tl = gsap.timeline({
      onComplete: () => {
        document.documentElement.classList.remove("is-opening");
        try {
          sessionStorage.setItem("cygnus-opened", "1");
        } catch {}
        setDone(true);
      },
    });
    tl.fromTo(
      mark,
      { opacity: 0, letterSpacing: "0.6em" },
      { opacity: 1, letterSpacing: "0.3em", duration: 0.9, ease: "power3.out" },
    )
      .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "power2.inOut" }, 0.15)
      .to(el, { opacity: 0, duration: 0.45, ease: "power1.inOut" }, 1.0);

    return () => {
      tl.kill();
      document.documentElement.classList.remove("is-opening");
    };
  }, []);

  if (done) return null;

  return (
    <div ref={ref} className="loader" aria-hidden="true">
      <div className="loader__mark">
        <Wordmark size="loader" as="div" />
      </div>
      <div className="loader__rule" />
    </div>
  );
}
