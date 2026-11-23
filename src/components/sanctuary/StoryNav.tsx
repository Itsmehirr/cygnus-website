"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { Wordmark } from "@/components/Wordmark";
import { useLenis } from "@/components/motion/ScrollProvider";

type NavCollection = { slug: string; label: string; name: string };
type NavCategory = { slug: string; name: string };
type List = "categories" | "collections";

/**
 * Capitolium's NavigationStory, as the Design Sanctuary's own menu: a framed
 * pill at the bottom centre, named "Sanctuary", with a mark at either end.
 * Its left half opens the four categories, its right half the collections,
 * each as a list stacked on a full-screen slate panel that wipes up from the
 * bottom (0.6 s, cubic-bezier(0.22, 0.31, 0, 1)) under the house's mark. Two
 * stars follow the item under the pointer. Pressing the same half again, or
 * Escape, closes; the other half changes the list. The right mouse button on
 * the pill opens the collections too.
 */
export function StoryNav({
  collections,
  categories,
  tagline,
}: {
  collections: NavCollection[];
  categories: NavCategory[];
  tagline: string;
}) {
  const [open, setOpen] = useState<List | null>(null);
  // The list last asked for stays in the panel while it wipes away.
  const [list, setList] = useState<List>("categories");
  const [visible, setVisible] = useState(false);
  const items = useRef<(HTMLElement | null)[]>([]);
  const follower = useRef<HTMLDivElement>(null);
  const lastY = useRef<number | null>(null);
  const lenis = useLenis();

  const show = (which: List | null) => {
    if (which) setList(which);
    setOpen(which);
  };
  const press = (which: List) => show(open === which ? null : which);

  // Whether the story is on screen at all.
  useEffect(() => {
    const onActive = (e: Event) => setVisible((e as CustomEvent<boolean>).detail);
    document.addEventListener("story:active", onActive);
    // Without the engine (touch, narrow screens) the pill stays available.
    const raf = window.matchMedia("(min-width: 880px) and (pointer: fine)").matches ? 0 : requestAnimationFrame(() => setVisible(true));
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("story:active", onActive);
    };
  }, []);

  // The fixed Sound switch makes room for the pill on narrow screens (globals.css).
  useEffect(() => {
    document.documentElement.classList.add("has-storynav");
    return () => document.documentElement.classList.remove("has-storynav");
  }, []);

  const follow = useCallback((i: number) => {
    const f = follower.current;
    const it = items.current[i];
    if (!f) return;
    if (!it) {
      f.style.opacity = "0";
      lastY.current = null;
      return;
    }
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

  // Open, close, or one list giving way to the other: its lines rise in.
  useEffect(() => {
    const lines = items.current.filter(Boolean) as HTMLElement[];
    gsap.killTweensOf(lines);
    if (open) {
      lenis?.stop();
      document.documentElement.classList.add("story-nav-open");
      follow(-1);
      gsap.fromTo(lines, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.06, delay: 0.2, overwrite: true });
    } else {
      lenis?.start();
      document.documentElement.classList.remove("story-nav-open");
      gsap.to(lines, { opacity: 0, y: 15, duration: 0.3, ease: "power2.in", stagger: 0.03, overwrite: true });
    }
  }, [open, follow, lenis]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("story-nav-open");
    };
  }, []);

  const entries =
    list === "collections"
      ? collections.map((c) => ({ key: c.slug, href: `/sanctuary/collections/${c.slug}`, label: c.label, name: c.name }))
      : categories.map((c) => ({ key: c.slug, href: `/sanctuary/category/${c.slug}`, label: "", name: c.name }));
  const heading = list === "collections" ? "Collections" : "Categories";

  // The pill: one frame, two halves. `inverted` is the copy seen through the
  // panel as it wipes up (slate on gold), which takes the presses while open.
  const half = (which: List, inverted: boolean) => (
    <button
      type="button"
      className={`storynav__half storynav__half--${which === "categories" ? "left" : "right"}`}
      onClick={() => press(which)}
      aria-expanded={inverted ? undefined : open === which}
      aria-controls={inverted ? undefined : "storynav-panel"}
      aria-label={which === "categories" ? "Categories" : "Collections"}
      tabIndex={inverted ? -1 : undefined}
      data-cursor={which === "categories" ? "Categories" : "Collections"}
    >
      <span className={`storynav__icon${open === which ? " is-open" : ""}`} aria-hidden="true">
        <i />
        <i />
      </span>
    </button>
  );
  const pill = (inverted: boolean) => (
    <div
      className={`storynav__toggle${inverted ? " storynav__toggle--inverted" : ""}`}
      aria-hidden={inverted || undefined}
      onContextMenu={(e) => {
        // The right mouse button asks for the collections, as the right half does.
        e.preventDefault();
        show("collections");
      }}
    >
      <span className="storynav__inner">
        {half("categories", inverted)}
        <span className="storynav__label" aria-hidden="true">
          Sanctuary
        </span>
        {half("collections", inverted)}
      </span>
    </div>
  );

  return (
    <div className={`storynav${open ? " storynav--open" : ""}${visible ? " storynav--visible" : ""}`}>
      {pill(false)}
      <div className="storynav__toggle-clip" aria-hidden="true">
        {pill(true)}
      </div>
      <div id="storynav-panel" className="storynav__panel" role="dialog" aria-modal="true" aria-label={heading} inert={!open || undefined}>
        <div className="storynav__brand">
          <Wordmark size="menu" as="div" />
          <p className="storynav__tagline">{tagline}</p>
        </div>
        <div className="storynav__list" onMouseLeave={() => follow(-1)}>
          <div ref={follower} className="storynav__follower" aria-hidden="true">
            <span />
            <span />
          </div>
          <p
            className="storynav__heading"
            ref={(el) => {
              items.current[0] = el;
            }}
          >
            {heading}
          </p>
          <ul key={list}>
            {entries.map((c, i) => (
              <li key={c.key}>
                <Link
                  ref={(el) => {
                    items.current[i + 1] = el;
                  }}
                  href={c.href}
                  className="storynav__item"
                  onClick={() => setOpen(null)}
                  onMouseEnter={() => follow(i + 1)}
                  onFocus={() => follow(i + 1)}
                >
                  {c.label ? <span className="storynav__item-label">{c.label}</span> : null}
                  <span className="storynav__item-title">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
