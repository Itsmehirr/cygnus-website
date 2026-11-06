"use client";

import { useEffect, useRef, type ElementType } from "react";
import { gsap } from "@/lib/gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

/**
 * Immersive Garden's AnimatedParagraph: as the block's top crosses the bottom
 * of the screen it rises 50 px (2 s, power2.out) while its lines fade in one
 * after another (1.8 s, power1.out, 0.1 s apart). It resets whenever it drops
 * back below the screen, so it plays again on the way down.
 */
export function Paragraph({
  children,
  as: Tag = "p",
  className,
  id,
}: {
  children: React.ReactNode;
  as?: ElementType;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const state = useRef<{ split: SplitText | null; tl: gsap.core.Timeline | null }>({ split: null, tl: null });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const s = state.current;
    // aria "none": the lines keep their words, so the paragraph reads as written
    // (an aria-label is not allowed on a <p>). Lines fade by opacity only, never
    // visibility, so the words stay readable to assistive technology while hidden.
    s.split = SplitText.create(el, { type: "lines", linesClass: "para__line", aria: "none" });
    gsap.set(s.split.lines, { opacity: 0 });
    const enter = () => {
      if (s.tl) return;
      s.tl = gsap.timeline();
      s.tl.fromTo(el, { y: 50 }, { y: 0, duration: 2, ease: "power2.out" }, 0);
      s.tl.fromTo(s.split!.lines, { opacity: 0 }, { opacity: 1, duration: 1.8, ease: "power1.out", stagger: 0.1 }, 0);
    };
    const reset = () => {
      s.tl?.kill();
      s.tl = null;
      gsap.set(el, { y: 0 });
      gsap.set(s.split!.lines, { opacity: 0 });
    };
    const io = new IntersectionObserver(
      ([e]) => {
        const below = e.boundingClientRect.top >= (e.rootBounds?.bottom ?? window.innerHeight);
        if (e.isIntersecting) enter();
        else if (below) reset();
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      s.tl?.kill();
      s.tl = null;
      s.split?.revert();
      s.split = null;
      gsap.set(el, { clearProps: "transform" });
    };
  }, []);

  return (
    <Tag ref={ref} className={className} id={id}>
      {children}
    </Tag>
  );
}

/**
 * The statement after the axis: Immersive Garden dissolves its H1 in from
 * plaster (a WebGL shader); here every letter surfaces in its own moment,
 * out of a blur, across about two seconds. Replays from below, like the
 * paragraphs. The text stays whole in the markup for crawlers.
 */
export function Dissolve({
  text,
  as: Tag = "h2",
  className,
  id,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chars = Array.from(el.querySelectorAll<HTMLElement>(".dissolve__c"));
    // A fixed scatter (seeded by index), so the order is the same on every visit.
    const delays = chars.map((_, i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1);
    let tl: gsap.core.Timeline | null = null;
    gsap.set(chars, { opacity: 0, filter: "blur(10px)" });
    const enter = () => {
      if (tl) return;
      tl = gsap.timeline();
      chars.forEach((c, i) =>
        tl!.to(c, { opacity: 1, filter: "blur(0px)", duration: 1.1, ease: "power2.out" }, 0.15 + delays[i] * 1.5),
      );
    };
    const reset = () => {
      tl?.kill();
      tl = null;
      gsap.set(chars, { opacity: 0, filter: "blur(10px)" });
    };
    const io = new IntersectionObserver(
      ([e]) => {
        const below = e.boundingClientRect.top >= (e.rootBounds?.bottom ?? window.innerHeight);
        if (e.isIntersecting && e.intersectionRatio > 0.25) enter();
        else if (below) reset();
      },
      { threshold: [0, 0.25] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      tl?.kill();
      gsap.set(chars, { clearProps: "opacity,filter" });
    };
  }, []);

  const words = text.split(" ");
  return (
    <Tag ref={ref} className={`dissolve ${className ?? ""}`.trim()} id={id}>
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <span key={i} className="dissolve__w" aria-hidden="true">
          {Array.from(w).map((c, k) => (
            <span key={k} className="dissolve__c">
              {c}
            </span>
          ))}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}

