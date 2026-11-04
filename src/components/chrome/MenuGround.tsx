"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MenuLight } from "./MenuLight";

const MenuRelief = dynamic(() => import("./MenuRelief"), { ssr: false });

/**
 * Decides what the Menu's ground is on this device: the WebGL relief when the
 * visitor allows motion and the GPU is up to it, otherwise the CSS light. The
 * CSS light always renders first, so the page never waits on the 3D chunk.
 */
export function MenuGround() {
  const [relief, setRelief] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const canvas = document.createElement("canvas");
      if (!canvas.getContext("webgl2")) return;
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
      if (memory < 2) return;
      setRelief(true);
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <MenuLight />
      {relief && <MenuRelief />}
    </>
  );
}
