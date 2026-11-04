"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScrollTrigger } from "@/lib/gsap";

/**
 * The floating pill at the bottom centre of the Sanctuary: names the chapter
 * in view and opens the collections menu. Capitolium's "≡ CHAPITRE I ≡",
 * in the house's register.
 */
export function ChapterPill({ initial = "Sanctuary" }: { initial?: string }) {
  const [label, setLabel] = useState(initial);

  useEffect(() => {
    const triggers = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]")).map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: "top 60%",
        end: "bottom 40%",
        onToggle: (self) => {
          if (self.isActive) setLabel(el.dataset.chapter ?? initial);
          else if (self.direction < 0 && self.progress === 0) setLabel(initial);
        },
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, [initial]);

  return (
    <Link href="/menu/sanctuary" className="pill" data-cursor="Collections">
      <span className="pill__bars" aria-hidden="true" />
      <span className="pill__label">{label}</span>
      <span className="pill__bars" aria-hidden="true" />
    </Link>
  );
}
