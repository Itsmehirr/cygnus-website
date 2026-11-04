"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "@/lib/gsap";
import { useLenis } from "./ScrollProvider";

/**
 * Re-keys its children on every route so the new page fades in (CSS .page-in),
 * and, because it mounts together with the new page's DOM, lands a hash target
 * (e.g. /sanctuary#pearl) once the pinned sections have measured themselves.
 */
export function PageFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    // The URL can carry its hash a beat after this mounts (fresh layout mount
    // from the Menu), so look a few times before giving up.
    let tries = 0;
    let id = 0;
    const land = () => {
      const hash = window.location.hash;
      const target = hash ? document.querySelector<HTMLElement>(hash) : null;
      if (!target) {
        if (tries++ < 15) id = window.setTimeout(land, 80);
        return;
      }
      ScrollTrigger.refresh();
      const y = target.getBoundingClientRect().top + window.scrollY;
      if (lenis) {
        // Lenis clamps to its cached limit, which can still be the previous
        // page's (0 on the Menu): measure again before scrolling.
        lenis.resize();
        lenis.scrollTo(y, { immediate: true, force: true });
      } else {
        window.scrollTo(0, y);
      }
    };
    id = window.setTimeout(land, 120);
    return () => window.clearTimeout(id);
  }, [pathname, lenis]);

  return (
    <div key={pathname} className="page-in">
      {children}
    </div>
  );
}
