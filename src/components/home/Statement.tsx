"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";

/**
 * A statement that is pressed into the ground word by word as it crosses the
 * viewport (Immersive Garden's letter reveal, scrubbed so it answers the hand
 * on the wheel). Rendered whole for crawlers and under reduced motion.
 */
export function Statement({
  text,
  as: Tag = "p",
  className = "",
}: {
  text: string;
  as?: "p" | "h2";
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement & HTMLHeadingElement>(null);
  const words = text.split(" ");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // Colour, not opacity: the unrevealed words stay readable (and pass
        // contrast) while they wait to be pressed into the ground.
        gsap.fromTo(
          ref.current!.querySelectorAll(".statement__w"),
          { color: "#807e79", y: 6 },
          {
            color: "#282827",
            y: 0,
            ease: "none",
            stagger: 0.6,
            scrollTrigger: {
              trigger: ref.current,
              start: "top 82%",
              end: "bottom 52%",
              scrub: 0.4,
            },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={`statement ${className}`.trim()}>
      {words.map((w, i) => (
        <span key={i} className="statement__w">
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
