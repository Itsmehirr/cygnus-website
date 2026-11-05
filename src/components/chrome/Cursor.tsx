"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { useLenis } from "@/components/motion/ScrollProvider";

/**
 * Immersive Garden's cursor (CursorElt + HomeScrollCursor): the system pointer
 * stays; three 3 px dots ride 15 px to its right, eased at 0.1 a frame, and
 * part vertically as the page moves fast. Over anything that carries
 * `data-cursor`, the dots step aside and the word appears beside the pointer,
 * its letters fading in (0.8 s, staggered over 0.4 s), fading out in 0.5 s.
 *
 * The Sanctuary keeps Capitolium's grammar instead: the system cursor and
 * circular hotspots on the images, so this stays hidden there.
 */
export function Cursor() {
  const dots = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const pathname = usePathname();
  const off = pathname.startsWith("/sanctuary") || pathname.startsWith("/menu");

  useEffect(() => {
    if (off) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const d = dots.current!;
    const l = label.current!;
    const ds = Array.from(d.children) as HTMLElement[];
    let mx = -100,
      my = -100,
      x = -100,
      y = -100,
      lx = -100,
      ly = -100,
      spread = 0,
      seen = false,
      word = "",
      tl: gsap.core.Timeline | null = null;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!seen) {
        seen = true;
        x = lx = mx;
        y = ly = my;
        d.classList.add("is-on");
      }
    };
    const onLeave = () => {
      seen = false;
      d.classList.remove("is-on");
    };

    const show = (text: string) => {
      if (text === word) return;
      word = text;
      tl?.kill();
      if (!text) {
        tl = gsap.timeline().to(l, { opacity: 0, duration: 0.5, ease: "sine.inOut" });
        d.classList.remove("is-hidden");
        return;
      }
      d.classList.add("is-hidden");
      l.innerHTML = "";
      const chars = Array.from(text).map((c) => {
        const s = document.createElement("span");
        s.textContent = c === " " ? " " : c;
        l.appendChild(s);
        return s;
      });
      gsap.set(l, { opacity: 1 });
      tl = gsap.timeline().fromTo(chars, { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.4 / chars.length, ease: "none" });
    };
    const onOver = (e: Event) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor]");
      show(t?.dataset.cursor ?? "");
    };

    const tick = (_t: number, dt: number) => {
      const k = 1 - Math.exp(-0.1 * (dt / (1000 / 60)));
      x += (mx + 15 - x) * k;
      y += (my - y) * k;
      lx += (mx + 18 - lx) * k;
      ly += (my - ly) * k;
      const v = Math.min(18, Math.abs(lenis?.velocity ?? 0) * 0.5);
      spread += (v - spread) * 0.12;
      d.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      ds[0].style.transform = `translate3d(0, ${-spread}px, 0)`;
      ds[2].style.transform = `translate3d(0, ${spread}px, 0)`;
      l.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseover", onOver);
    gsap.ticker.add(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseover", onOver);
      gsap.ticker.remove(tick);
      tl?.kill();
      d.classList.remove("is-on", "is-hidden");
      gsap.set(l, { opacity: 0 });
    };
  }, [off, lenis]);

  return (
    <div className="cursor" aria-hidden="true" hidden={off}>
      <div ref={dots} className="cursor__dots">
        <i />
        <i />
        <i />
      </div>
      <div ref={label} className="cursor__label" />
    </div>
  );
}
