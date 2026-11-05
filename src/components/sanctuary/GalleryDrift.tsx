"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";

/**
 * The Sanctuary's gallery band: a row of mood images that drifts sideways as
 * the band crosses the viewport, like paintings passed in a corridor.
 * Scrolls natively on touch.
 */
export function GalleryDrift({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and (pointer: fine)`, () => {
        const track = ref.current!.querySelector<HTMLElement>(".gallery__track")!;
        gsap.fromTo(
          track,
          { x: () => 0 },
          {
            x: () => -(track.scrollWidth - ref.current!.clientWidth),
            ease: "none",
            scrollTrigger: {
              trigger: ref.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="gallery">
      <div className="gallery__track">{children}</div>
    </div>
  );
}
