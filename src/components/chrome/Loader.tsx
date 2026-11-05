"use client";

import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import { OPENED_KEY } from "@/lib/loader-gate";

/**
 * First-visit opening: the wordmark settles from wide to its final tracking
 * while a chartreuse rule draws across, then the veil lifts. 1.45 s, once per
 * session, never under reduced motion.
 *
 * The motion is pure CSS (see .loader in globals.css), so it starts with the
 * first paint rather than after hydration, and lifts on its own even if
 * scripts are slow. This component only holds the page still while the veil
 * is up, records the visit, and unmounts the veil once it has lifted.
 */
export function Loader() {
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const html = document.documentElement;
    // No running veil animation: skipped (seen this session, or reduced motion).
    const veil = el
      .getAnimations()
      .find((a) => (a as CSSAnimation).animationName === "loader-out");
    if (!veil) return;

    let live = true;
    html.classList.add("is-opening");
    veil.finished
      .then(() => {
        if (!live) return;
        html.setAttribute("data-opened", "");
        try {
          sessionStorage.setItem(OPENED_KEY, "1");
        } catch {}
        setDone(true);
      })
      .catch(() => {})
      .finally(() => html.classList.remove("is-opening"));

    return () => {
      live = false;
      html.classList.remove("is-opening");
    };
  }, []);

  if (done) return null;

  return (
    <div ref={ref} className="loader" aria-hidden="true">
      <Wordmark size="loader" as="div" />
      <div className="loader__rule" />
    </div>
  );
}
