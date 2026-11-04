"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";
import { Wordmark } from "@/components/Wordmark";

type Props = {
  ready: boolean;
  src: string;
  poster: string;
  line: string;
  founded: string;
};

/**
 * The Home opening: the story video full-bleed under one horizontal axis
 * (wordmark · line · scroll cue). On the first scroll the video shrinks into a
 * soft-white framed card, the side labels fade, and the line rises to dock
 * under the top edge; near the end of the section it hands over to the header
 * wordmark. Resting state (reduced motion, no JS): a full-bleed hero with the
 * axis centred, which is also what crawlers read.
 */
export function Hero({ ready, src, poster, line, founded }: Props) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      document.body.dataset.home = "";

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const stage = section.querySelector<HTMLElement>(".hero__stage")!;
        const media = section.querySelector<HTMLElement>(".hero__media")!;
        const frame = section.querySelector<HTMLElement>(".hero__frame")!;
        const lineEl = section.querySelector<HTMLElement>(".hero__line")!;
        const sides = section.querySelectorAll<HTMLElement>(".hero__side");

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              document.body.classList.toggle("is-docked", self.progress > 0.55);
            },
          },
        });

        tl.to(sides, { opacity: 0, duration: 0.25 }, 0)
          .to(frame, { opacity: 1, duration: 0.2 }, 0.05)
          .to(media, { scale: 0.62, duration: 0.7 }, 0)
          .to(frame, { scale: 0.635, duration: 0.7 }, 0)
          .to(
            lineEl,
            {
              y: () => -(stage.clientHeight / 2 - 84),
              scale: 0.42,
              duration: 0.62,
            },
            0,
          )
          .to(lineEl, { opacity: 0, duration: 0.15 }, 0.85);
      });

      return () => {
        delete document.body.dataset.home;
        document.body.classList.remove("is-docked");
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} className="hero" aria-label="The Cygnus story">
      <div className="hero__stage">
        <div className="hero__frame" aria-hidden="true" />
        <div className="hero__media">
          {ready ? (
            <video
              className="hero__video"
              src={src}
              poster={poster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              data-story
            />
          ) : (
            <div className="hero__placeholder" role="img" aria-label="Story video to follow">
              <span>Where light takes form.</span>
            </div>
          )}
        </div>

        <div className="hero__axis">
          <div className="hero__side hero__side--left">
            <Wordmark size="hero" as="div" />
            <span className="hero__est">Est. {founded}</span>
          </div>
          <h1 className="hero__line">{line}</h1>
          <span className="hero__side hero__side--right" aria-hidden="true">
            Scroll
          </span>
        </div>
      </div>
    </section>
  );
}
