"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { Wordmark } from "@/components/Wordmark";

let firstLoad = true;

/**
 * Immersive Garden's opening (IntroLoader), on the house's stone:
 *
 *   the axis builds in place: the wordmark is uncovered by a mask sweeping
 *   left to right (2.5 s, quart.out), the line's words fade in one after
 *   another (1 s each, sine.inOut, 0.1 s apart, from 0.3 s), the counter
 *   on the right fades in and counts while the page settles; at 100 it hands
 *   over to "Scroll" and the chrome (Menu, the Sanctuary cue, sound) fades in.
 *
 *   on the first scroll the axis lets go: words out in 0.3 s, 0.1 s apart,
 *   and the small mark appears by "Menu"; back at the top they return
 *   (1.25 s, 0.1 s apart, from 0.25 s).
 *
 * The axis is never pinned: it scrolls away with the page, as on the reference.
 * Reduced motion, no JS: the axis is simply there.
 */
export function Hero({ line, founded }: { line: string; founded: string }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const html = document.documentElement;
    document.body.dataset.home = "";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mask = el.querySelector<HTMLElement>(".hero__mark-clip")!;
    const words = Array.from(el.querySelectorAll<HTMLElement>(".hero__word"));
    const counter = el.querySelector<HTMLElement>(".hero__count")!;
    const cue = el.querySelector<HTMLElement>(".hero__cue")!;
    const mark = el.querySelector<HTMLElement>(".hero__mark")!;

    const done = () => {
      html.classList.remove("is-intro");
      html.classList.add("is-ready");
    };

    let intro: gsap.core.Timeline | null = null;
    let raf = 0;
    if (reduced) {
      done();
      gsap.set([mark, ...words, cue], { opacity: 1 });
      gsap.set(counter, { opacity: 0 });
    } else if (firstLoad) {
      html.classList.add("is-intro");
      gsap.set(words, { opacity: 0 });
      gsap.set([counter, cue], { opacity: 0 });
      intro = gsap.timeline();
      intro
        .fromTo(mask, { clipPath: "inset(0% 66% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 2.5, ease: "quart.out" }, 0)
        .fromTo(words, { opacity: 0 }, { opacity: 1, duration: 1, ease: "sine.inOut", stagger: 0.1 }, 0.3)
        .fromTo(counter, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "sine.inOut" }, ">-0.7");

      // The count follows the page settling (fonts, the first images), and
      // never runs faster than the axis builds.
      const t0 = performance.now();
      let ready = false;
      Promise.all([
        document.fonts?.ready ?? Promise.resolve(),
        new Promise<void>((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", () => r(), { once: true }))),
      ]).then(() => (ready = true));
      let shown = 0;
      const step = () => {
        const t = (performance.now() - t0) / 1000;
        const cap = ready ? 100 : 97;
        const target = Math.min(cap, Math.round(100 * Math.min(1, t / 2.4)));
        shown += Math.max(0, Math.ceil((target - shown) * 0.2));
        counter.textContent = String(Math.min(100, shown));
        if (shown >= 100 && t > 2.4) {
          raf = 0;
          gsap
            .timeline({ onComplete: done })
            .to(counter, { opacity: 0, duration: 0.5, ease: "sine.inOut" })
            .fromTo(cue, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "sine.inOut" }, 0.2)
            .add(() => html.classList.add("is-ready"), 0.1);
          return;
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    } else {
      // Arriving from another page: no count, the axis simply returns.
      done();
      gsap.set(counter, { opacity: 0 });
      gsap.fromTo(mask, { clipPath: "inset(0% 66% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "quart.out" });
      gsap.fromTo(words, { opacity: 0 }, { opacity: 1, duration: 1.25, ease: "sine.inOut", stagger: 0.1, delay: 0.25 });
      gsap.fromTo(cue, { opacity: 0 }, { opacity: 1, duration: 1.25, ease: "sine.inOut", delay: 0.3 });
    }
    firstLoad = false;

    // First scroll: the axis lets go; back at the top it returns.
    let away = false;
    let toggle: gsap.core.Timeline | null = null;
    const onScroll = () => {
      const now = window.scrollY > 40;
      if (now === away || html.classList.contains("is-intro")) return;
      away = now;
      document.body.classList.toggle("is-docked", away);
      toggle?.kill();
      toggle = gsap.timeline();
      if (away) {
        toggle
          .to(mark, { autoAlpha: 0, duration: 0.3, ease: "sine.inOut" }, 0)
          .to(words, { opacity: 0, duration: 0.3, ease: "sine.inOut", stagger: 0.1 }, 0)
          .to(cue, { autoAlpha: 0, duration: 0.3, ease: "sine.inOut" }, 0);
      } else {
        toggle
          .to(mark, { autoAlpha: 1, duration: 0.6, ease: "sine.inOut" }, 0)
          .to(words, { opacity: 1, duration: 1.25, ease: "sine.inOut", stagger: 0.1 }, 0.25)
          .to(cue, { autoAlpha: 1, duration: 1.25, ease: "sine.inOut" }, 0.3);
      }
    };
    if (!reduced) window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      intro?.kill();
      toggle?.kill();
      window.removeEventListener("scroll", onScroll);
      delete document.body.dataset.home;
      document.body.classList.remove("is-docked");
      html.classList.remove("is-intro");
      html.classList.add("is-ready");
    };
  }, []);

  const words = line.split(" ");

  return (
    <section ref={root} className="hero" aria-label="Cygnus">
      <div className="hero__axis container">
        <div className="hero__mark">
          <span className="hero__mark-clip">
            <Wordmark size="hero" as="span" />
          </span>
          <span className="hero__est">Est. {founded}</span>
        </div>
        <h1 className="hero__line">
          {words.map((w, i) => (
            <span key={i} className="hero__word">
              {w}
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </h1>
        <div className="hero__right" aria-hidden="true">
          <span className="hero__count">0</span>
          <span className="hero__cue">Scroll</span>
        </div>
      </div>
    </section>
  );
}
