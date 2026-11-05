"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { useLenis } from "./ScrollProvider";

/**
 * Rendered inside a page that has anchor targets (the Sanctuary's chapters):
 * it mounts only when that page's DOM is in place, so a hash in the URL can be
 * landed once the pinned sections have measured themselves.
 */
export function LandOnHash() {
  const lenis = useLenis();

  useEffect(() => {
    let tries = 0;
    let id = 0;
    const land = () => {
      const hash = window.location.hash;
      const target = hash ? document.querySelector<HTMLElement>(hash) : null;
      if (!target) {
        if (tries++ < 10) id = window.setTimeout(land, 100);
        return;
      }
      ScrollTrigger.refresh();
      // A room inside the pinned story lands at the start of its own scroll
      // span (the story publishes them), not at the shared pin's top.
      const room = target.dataset.room;
      const offsets = target.closest<HTMLElement>(".story.is-engine")?.dataset.offsets?.split(",").map(Number);
      const fromStory = room !== undefined && offsets ? offsets[Number(room)] : undefined;
      const y = fromStory !== undefined && !Number.isNaN(fromStory) ? fromStory + 2 : target.getBoundingClientRect().top + window.scrollY;
      if (lenis) {
        // Lenis clamps to its cached limit, which can still be the previous
        // page's (0 on the Menu): measure again before scrolling.
        lenis.resize();
        lenis.scrollTo(y, { immediate: true, force: true });
      } else {
        window.scrollTo(0, y);
      }
    };
    id = window.setTimeout(land, 100);
    return () => window.clearTimeout(id);
  }, [lenis]);

  return null;
}
