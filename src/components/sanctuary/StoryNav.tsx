"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { Wordmark } from "@/components/Wordmark";
import { useLenis } from "@/components/motion/ScrollProvider";

type NavChapter = { slug: string; label: string; title: string };
type NavCategory = { slug: string; name: string };

/**
 * Capitolium's NavigationStory: a framed pill at the bottom centre names the
 * room in view. It opens a full-screen charcoal panel that wipes up from the
 * bottom (0.6 s, cubic-bezier(0.22, 0.31, 0, 1)) with the house's mark, the
 * collections as chapters and, under them, the four categories. Two stars
 * follow the item under the pointer. Escape closes; a chapter jumps straight
 * to its room.
 */
export function StoryNav({
  chapters,
  categories,
  tagline,
}: {
  chapters: NavChapter[];
  categories: NavCategory[];
  tagline: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(chapters[0]?.label ?? "Sanctuary");
  const items = useRef<(HTMLElement | null)[]>([]);
  const follower = useRef<HTMLDivElement>(null);
  const lastY = useRef<number | null>(null);
  const lenis = useLenis();

  // The room in view, and whether the story is on screen at all.
  useEffect(() => {
    const onChapter = (e: Event) => setActive((e as CustomEvent<number>).detail);
    const onActive = (e: Event) => setVisible((e as CustomEvent<boolean>).detail);
    document.addEventListener("story:chapter", onChapter);
    document.addEventListener("story:active", onActive);
    // Without the engine (touch, narrow screens) the pill stays available.
    const raf = window.matchMedia("(min-width: 880px) and (pointer: fine)").matches ? 0 : requestAnimationFrame(() => setVisible(true));
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("story:chapter", onChapter);
      document.removeEventListener("story:active", onActive);
    };
  }, []);

  // Label change: the new letters rise in, one after another (CSS, keyed on the label).
  useEffect(() => {
    const next = chapters[active]?.label ?? "Sanctuary";
    const id = requestAnimationFrame(() => setShown(next));
    return () => cancelAnimationFrame(id);
  }, [active, chapters]);

  const follow = useCallback((i: number) => {
    const f = follower.current;
    const it = items.current[i];
    if (!f || !it) return;
    const y = it.offsetTop;
    if (lastY.current !== null && y !== lastY.current) {
      const down = y > lastY.current;
      const stars = f.querySelectorAll("span");
      gsap.to(stars[0], { rotation: down ? "+=180" : "-=180", duration: 0.4, ease: "power2.out" });
      gsap.to(stars[1], { rotation: down ? "-=180" : "+=180", duration: 0.4, ease: "power2.out" });
    }
    lastY.current = y;
    f.style.opacity = "1";
    f.style.transform = `translate(-50%, ${y}px)`;
    f.style.height = `${it.offsetHeight}px`;
  }, []);

  useEffect(() => {
    const list = items.current.filter(Boolean) as HTMLElement[];
    gsap.killTweensOf(list);
    if (open) {
      lenis?.stop();
      document.documentElement.classList.add("story-nav-open");
      requestAnimationFrame(() => follow(active));
      gsap.fromTo(list, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.06, delay: 0.2, overwrite: true });
    } else {
      lenis?.start();
      document.documentElement.classList.remove("story-nav-open");
      gsap.to(list, { opacity: 0, y: 15, duration: 0.3, ease: "power2.in", stagger: 0.03, overwrite: true });
    }
  }, [open, active, follow, lenis]);

  useEffect(() => {
    gsap.set(items.current.filter(Boolean), { opacity: 0, y: 12 });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const jump = (i: number) => (e: React.MouseEvent) => {
    const block = document.querySelector<HTMLElement>(".story");
    const offsets = block?.dataset.offsets?.split(",").map(Number);
    setOpen(false);
    lenis?.start();
    const target = offsets?.[i];
    if (target !== undefined && !Number.isNaN(target)) {
      e.preventDefault();
      if (lenis) lenis.scrollTo(target + 2, { immediate: true, force: true });
      else window.scrollTo(0, target + 2);
    }
  };

  const toggle = (inverted: boolean) => (
    <button
      type="button"
      className={`storynav__toggle${inverted ? " storynav__toggle--inverted" : ""}`}
      onClick={() => setOpen((o) => !o)}
      aria-expanded={inverted ? undefined : open}
      aria-controls={inverted ? undefined : "storynav-panel"}
      aria-hidden={inverted || undefined}
      tabIndex={inverted ? -1 : undefined}
      data-cursor="Collections"
    >
      <span className="storynav__inner">
        <span className={`storynav__icon${open ? " is-open" : ""}`} aria-hidden="true">
          <i />
          <i />
        </span>
        <span className="storynav__label">
          {Array.from(shown).map((c, i) => (
            <span key={`${shown}-${i}`} className="storynav__char" style={{ ["--i" as string]: i }}>
              {c === " " ? " " : c}
            </span>
          ))}
        </span>
        <span className={`storynav__icon${open ? " is-open" : ""}`} aria-hidden="true">
          <i />
          <i />
        </span>
      </span>
    </button>
  );

  return (
    <div className={`storynav${open ? " storynav--open" : ""}${visible ? " storynav--visible" : ""}`}>
      {toggle(false)}
      <div className="storynav__toggle-clip" aria-hidden="true">
        {toggle(true)}
      </div>
      <div id="storynav-panel" className="storynav__panel" role="dialog" aria-modal="true" aria-label="Collections" inert={!open || undefined}>
        <div className="storynav__brand">
          <Wordmark size="menu" as="div" />
          <p className="storynav__tagline">{tagline}</p>
        </div>
        <div className="storynav__list" onMouseLeave={() => follow(active)}>
          <div ref={follower} className="storynav__follower" aria-hidden="true">
            <span />
            <span />
          </div>
          <ul>
            {chapters.map((c, i) => (
              <li key={c.slug}>
                <a
                  ref={(el) => {
                    items.current[i] = el;
                  }}
                  href={`/sanctuary#${c.slug}`}
                  className={`storynav__item${i === active ? " is-active" : ""}`}
                  onClick={jump(i)}
                  onMouseEnter={() => follow(i)}
                >
                  <span className="storynav__item-label">{c.label}</span>
                  <span className="storynav__item-title">{c.title}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="storynav__cats">
            {categories.map((c, i) => (
              <Link
                key={c.slug}
                ref={(el) => {
                  items.current[chapters.length + i] = el;
                }}
                href={`/sanctuary/category/${c.slug}`}
                className="storynav__cat"
                onMouseEnter={() => follow(chapters.length + i)}
              >
                {c.name}
              </Link>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}
