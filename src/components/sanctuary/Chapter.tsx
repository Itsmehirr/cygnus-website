"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Wordmark } from "@/components/Wordmark";

/** The chapter engine runs only where it feels right: wide, fine pointer, motion allowed. */
export const ENGINE_MQ =
  "(min-width: 880px) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

type Props = {
  slug: string;
  name: string;
  numeral: string;
  ground: "beige" | "white";
  framed?: boolean;
  /** Arcade windows in travel order; the last one is the intro window. */
  windows: ReactNode[];
  /** The intro film, full-bleed layer. */
  full: ReactNode;
  /** The diagonal panel flow that follows the film. */
  panels: ReactNode;
};

/**
 * One collection as a Capitolium-style chapter, in the house's own shapes:
 *
 *   0–5 %    header settles
 *   3–45 %   the arcade travels horizontally on the vertical wheel; the window
 *            nearest the centre grows, the far ones recede
 *   47–65 %  the intro window opens out to the whole viewport
 *   50–78 %  the collection's name sweeps across in display italic
 *   80–100 % the film darkens and the pin releases; the panels scroll up over it
 *
 * Resting state (touch, narrow, reduced motion, no JS): header, a native
 * horizontal scroll-snap row of windows, the film as a block, then the panels.
 */
export function Chapter({ slug, name, numeral, ground, framed, windows, full, panels }: Props) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const mm = gsap.matchMedia();

      mm.add(ENGINE_MQ, () => {
        section.classList.add("chapter--engine");
        const stage = section.querySelector<HTMLElement>(".chapter__stage")!;
        const head = section.querySelector<HTMLElement>(".chapter__head")!;
        const track = section.querySelector<HTMLElement>(".chapter__track")!;
        const wins = Array.from(section.querySelectorAll<HTMLElement>(".chapter__win"));
        const introWin = wins[wins.length - 1];
        const fullEl = section.querySelector<HTMLElement>(".chapter__full")!;
        const title = section.querySelector<HTMLElement>(".chapter__title")!;
        const veil = section.querySelector<HTMLElement>(".chapter__veil")!;

        const centreOf = (el: HTMLElement) => el.offsetLeft + el.offsetWidth / 2;
        // Fill the row from the first frame (Capitolium): start at the gutter
        // unless the track is narrower than the viewport, then centre the first window.
        const gutter = () => parseFloat(getComputedStyle(stage).getPropertyValue("--gutter")) || 48;
        const xStart = () => Math.min(gutter(), stage.clientWidth / 2 - centreOf(wins[0]));
        const xEnd = () => stage.clientWidth / 2 - centreOf(introWin);

        /**
         * The intro window's rectangle once it is centred, as clip-path insets,
         * driven from a proxy so the browser's shorthand collapsing of
         * `inset(a b c b)` can never confuse a string tween.
         */
        const expand = { t: 0 };
        const applyClip = () => {
          const vw = stage.clientWidth;
          const vh = stage.clientHeight;
          const w = introWin.offsetWidth;
          const h = introWin.offsetHeight;
          const top = track.offsetTop + introWin.offsetTop;
          const x = (vw - w) / 2;
          const k = 1 - expand.t;
          fullEl.style.clipPath = `inset(${top * k}px ${x * k}px ${(vh - top - h) * k}px ${x * k}px)`;
        };

        const scaleWindows = () => {
          const vw = stage.clientWidth;
          for (const win of wins) {
            const r = win.getBoundingClientRect();
            const dx = r.left + r.width / 2 - vw / 2;
            const t = Math.max(0, 1 - Math.abs(dx) / (vw * 0.7));
            const s = 0.74 + 0.26 * t * t;
            gsap.set(win, { scale: s, opacity: 0.55 + 0.45 * t });
          }
        };

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=420%",
            pin: stage,
            scrub: 0.5,
            invalidateOnRefresh: true,
            onUpdate: scaleWindows,
            onRefresh: () => {
              scaleWindows();
              applyClip();
            },
          },
        });

        tl.fromTo(head, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.05 }, 0)
          .fromTo(track, { x: xStart }, { x: xEnd, duration: 0.42 }, 0.03)
          .set(fullEl, { autoAlpha: 1 }, 0.47)
          .fromTo(expand, { t: 0 }, { t: 1, duration: 0.18, ease: "power2.inOut", onUpdate: applyClip }, 0.47)
          .to(track, { opacity: 0, duration: 0.06 }, 0.52)
          .fromTo(title, { xPercent: 60, opacity: 0 }, { xPercent: -10, opacity: 1, duration: 0.22 }, 0.52)
          .to(title, { xPercent: -45, opacity: 0, duration: 0.12 }, 0.78)
          .to(veil, { opacity: 0.6, duration: 0.14 }, 0.82);

        return () => section.classList.remove("chapter--engine");
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id={slug}
      className={`chapter chapter--${ground}${framed ? " chapter--framed" : ""}`}
      data-chapter={name}
      aria-labelledby={`${slug}-title`}
    >
      <div className="chapter__stage">
        <header className="chapter__head">
          <span className="chapter__side">{name}</span>
          <Wordmark size="chapter" as="div" />
          <span className="chapter__side chapter__side--right">{name}</span>
          <span className="chapter__pill">Collection {numeral}</span>
        </header>

        <div className="chapter__arcade">
          <ul className="chapter__track">
            {windows.map((w, i) => (
              <li key={i} className={`chapter__win${i === windows.length - 1 ? " chapter__win--intro" : ""}`}>
                {w}
              </li>
            ))}
          </ul>
        </div>

        <div className="chapter__full" aria-hidden="true">
          {full}
          <div className="chapter__veil" />
        </div>

        <h2 id={`${slug}-title`} className="chapter__title">
          {name}
        </h2>
      </div>

      <div className="chapter__panels">{panels}</div>
    </section>
  );
}
