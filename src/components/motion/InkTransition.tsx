"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "@/lib/gsap";

/**
 * Immersive Garden opens its studio menu with a dark ink that spreads from
 * the corner by "Menu" (a WebGL mask, 2.5 s on a very front-loaded curve,
 * cubic-bezier(0.01875, 0.08, 0, 0.991875)). Here: a charcoal layer whose
 * feathered circular mask grows from the same corner; the Menu page is
 * pushed while the ink is still spreading and fades in over it.
 */
export function InkTransition() {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const busy = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (!/^\/menu(\/|$)/.test(href) || window.location.pathname.startsWith("/menu")) return;
      // Capture phase, ahead of the Link's own navigation: the ink leads.
      e.preventDefault();
      e.stopPropagation();
      if (busy.current) return;
      busy.current = true;
      const r = a.getBoundingClientRect();
      el.style.setProperty("--ix", `${r.left + r.width / 2}px`);
      el.style.setProperty("--iy", `${r.top + r.height / 2}px`);
      const far = Math.hypot(window.innerWidth, window.innerHeight) * 1.25;
      const state = { r: 0 };
      el.classList.add("is-on");
      gsap.fromTo(
        state,
        { r: 0 },
        {
          r: far,
          duration: 2.5,
          ease: "expo.out",
          onUpdate: () => el.style.setProperty("--ir", `${state.r}px`),
        },
      );
      window.setTimeout(() => router.push(href), 450);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // Once the Menu has arrived, let the ink go (the menu's own ground is the same charcoal).
  useEffect(() => {
    const el = ref.current;
    if (!el || !busy.current || !pathname.startsWith("/menu")) return;
    const id = window.setTimeout(() => {
      gsap.to(el, {
        opacity: 0,
        duration: 0.6,
        ease: "sine.inOut",
        onComplete: () => {
          el.classList.remove("is-on");
          gsap.set(el, { opacity: 1 });
          el.style.setProperty("--ir", "0px");
          busy.current = false;
        },
      });
    }, 900);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return <div ref={ref} className="ink" aria-hidden="true" />;
}
