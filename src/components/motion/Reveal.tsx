"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";

/**
 * Fades a block of media in once as it enters the viewport (Immersive Garden's
 * 1.9 s tile reveal). Used on media only; text has its own line reveal.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "className">) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const el = ref.current;
        if (!el) return;
        // Already on screen when the page mounts: the page's own fade brings it
        // in. Hiding it now would blank server-rendered media for a moment.
        if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
        // Immersive Garden's tiles surface over ~1.9 s as they enter.
        gsap.from(el, {
          opacity: 0,
          y: 40,
          duration: 1.9,
          delay,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        });
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  );
}

/** Scrubbed vertical drift: `speed` is the fraction of scroll the element lags or leads by. */
export function Drift({
  children,
  className,
  speed = 0.12,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          ref.current,
          { y: () => speed * 240 },
          {
            y: () => -speed * 240,
            ease: "none",
            scrollTrigger: {
              trigger: ref.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
