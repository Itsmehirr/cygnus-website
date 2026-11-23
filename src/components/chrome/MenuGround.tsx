"use client";

import { useEffect, useState } from "react";
import { MenuLight } from "./MenuLight";
import { ReliefWall } from "@/components/home/ReliefWall";

/**
 * The Menu's ground: the same forest as Home, carved in the charcoal. It lies
 * flat in the dark until the cursor passes, then swells out under a soft
 * chartreuse-white light and sinks back along the trail; the links keep a
 * clearing. It begins a little way down the strip, so the Menu does not open
 * on the stretch that sits behind the Home opening. Without WebGL the CSS
 * light that follows the pointer stays in its place.
 */
export function MenuGround() {
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setWebgl(!!document.createElement("canvas").getContext("webgl")));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <>
      {!webgl && <MenuLight />}
      <ReliefWall theme="dark" waitForIntro={false} start={1.08} />
    </>
  );
}
