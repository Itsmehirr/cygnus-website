"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import Link from "next/link";

/**
 * Capitolium's MouseFollower + ButtonCursor: a circular button sits on the
 * image, two words set on its rim (one over the top, one under the bottom),
 * a "+" at its heart. While the pointer moves over the image the button leans
 * towards it (at most 20 px, eased at 0.08 a frame) and the ring turns with
 * the lean. The words rise in, letter by letter, as the image is entered.
 */
export function Hotspot({
  href,
  label1,
  label2,
  name,
  children,
}: {
  href: string;
  label1: string;
  label2: string;
  /** What it leads to, said after the visible words (the picture's alt text). */
  name?: string;
  children: ReactNode;
}) {
  const wrap = useRef<HTMLAnchorElement>(null);
  const btn = useRef<HTMLSpanElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    const el = wrap.current;
    const b = btn.current;
    const s = svg.current;
    if (!el || !b || !s) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let tx = 0,
      ty = 0,
      x = 0,
      y = 0,
      raf = 0,
      inside = false;
    const ease = 0.08;
    const step = () => {
      x += (tx - x) * ease;
      y += (ty - y) * ease;
      const half = b.offsetWidth / 2 || 1;
      b.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      s.style.transform = `rotate(${(x / half) * 90}deg)`;
      raf = !inside && Math.abs(tx - x) < 0.1 && Math.abs(ty - y) < 0.1 ? 0 : requestAnimationFrame(step);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      tx = Math.max(-20, Math.min(20, 40 * nx));
      ty = Math.max(-20, Math.min(20, 40 * ny));
      inside = true;
      el.classList.add("is-over");
      kick();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      inside = false;
      el.classList.remove("is-over");
      kick();
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Each letter has its own place on the rim (3 % apart), centred on 25 % / 75 %.
  const place = (text: string, at: number) => {
    const chars = Array.from(text.toUpperCase());
    const span = 3 * (chars.length - 1);
    return chars.map((c, i) => ({ c, offset: `${at - span / 2 + 3 * i}%`, i }));
  };

  return (
    <Link ref={wrap} href={href} className="hotspot" aria-label={`${label1} ${label2}${name ? `: ${name}` : ""}`}>
      {children}
      <span ref={btn} className="hotspot__btn" aria-hidden="true">
        <svg ref={svg} className="hotspot__svg" viewBox="0 0 100 100">
          <defs>
            <path id={`${id}-c`} d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" />
          </defs>
          {place(label1, 25).map(({ c, offset, i }) => (
            <text key={`a${i}`} style={{ transitionDelay: `${0.3 + i * 0.02}s` }}>
              <textPath href={`#${id}-c`} startOffset={offset} textAnchor="middle">
                {c}
              </textPath>
            </text>
          ))}
          {place(label2, 75).map(({ c, offset, i }) => (
            <text key={`b${i}`} style={{ transitionDelay: `${0.3 + i * 0.02}s` }}>
              <textPath href={`#${id}-c`} startOffset={offset} textAnchor="middle">
                {c}
              </textPath>
            </text>
          ))}
        </svg>
        <span className="hotspot__ring" />
        <span className="hotspot__plus" />
      </span>
    </Link>
  );
}
