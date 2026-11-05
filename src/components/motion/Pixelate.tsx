"use client";

import { useEffect, useRef } from "react";

type Media = HTMLImageElement | HTMLVideoElement;

const size = (m: Media) =>
  m instanceof HTMLVideoElement ? [m.videoWidth, m.videoHeight] : [m.naturalWidth, m.naturalHeight];

const ready = (m: Media) => {
  const [w, h] = size(m);
  return w > 0 && h > 0 && (m instanceof HTMLVideoElement ? m.readyState >= 2 : m.complete);
};

/**
 * Immersive Garden's pixel transition: a picture or film arrives as a coarse
 * mosaic and resolves, step by step, to the sharp image (1.1 s); on hover it
 * breaks into a fine mosaic and settles again (0.5 s). Films keep playing
 * through the mosaic. Drawn on a canvas laid over the server-rendered media;
 * without JS the media simply show.
 */
export function Pixelate({ children, className }: { children: React.ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const media = el?.querySelector<Media>("video, img");
    if (!el || !media) return;
    const canvas = document.createElement("canvas");
    canvas.className = "pixelate__canvas";
    canvas.setAttribute("aria-hidden", "true");
    el.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const tiny = document.createElement("canvas");
    const tctx = tiny.getContext("2d");
    if (!ctx || !tctx) return;

    el.classList.add("is-pending");
    let raf = 0;
    let running = false;
    let shown = false;

    // Coarsest block in CSS px, then the mosaic halves its size about every
    // 0.1 s: 64, 48, 32, 24, 16, 12, 8, 6, 4, 2 and the image.
    const STEPS = [64, 48, 32, 24, 16, 12, 8, 6, 4, 2, 1];

    const draw = (block: number) => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      if (!W || !H) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
      }
      const [sw, sh] = size(media);
      if (!sw || !sh) return;
      // object-fit: cover, centred
      const k = Math.max(W / sw, H / sh);
      const cw = W / k;
      const ch = H / k;
      const sx = (sw - cw) / 2;
      const sy = (sh - ch) / 2;
      const tw = Math.max(1, Math.round(W / block));
      const th = Math.max(1, Math.round(H / block));
      tiny.width = tw;
      tiny.height = th;
      tctx.imageSmoothingEnabled = true;
      tctx.drawImage(media, sx, sy, cw, ch, 0, 0, tw, th);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tiny, 0, 0, tw, th, 0, 0, canvas.width, canvas.height);
    };

    const run = (from: number, duration: number) => {
      cancelAnimationFrame(raf);
      running = true;
      const t0 = performance.now();
      const steps = STEPS.slice(from);
      canvas.style.opacity = "1";
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / (duration * 1000));
        const i = Math.min(steps.length - 1, Math.floor(p * steps.length));
        const block = steps[i];
        if (block > 1) {
          draw(block);
          el.classList.remove("is-pending");
          raf = requestAnimationFrame(tick);
        } else {
          canvas.style.opacity = "0";
          running = false;
        }
      };
      raf = requestAnimationFrame(tick);
    };

    const reveal = () => {
      if (shown) return;
      shown = true;
      if (ready(media)) {
        run(0, 1.1);
        return;
      }
      const go = () => run(0, 1.1);
      media.addEventListener(media instanceof HTMLVideoElement ? "loadeddata" : "load", go, { once: true });
      // If the file is slow, show it rather than keep an empty frame.
      window.setTimeout(() => {
        if (!running && el.classList.contains("is-pending")) el.classList.remove("is-pending");
      }, 4000);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) reveal();
        // Below the viewport again: ready to resolve once more on the way down.
        else if (e.boundingClientRect.top > 0 && !running) {
          shown = false;
          el.classList.add("is-pending");
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);

    const fine = window.matchMedia("(pointer: fine)");
    const onEnter = () => {
      if (fine.matches && shown && !running && ready(media)) run(5, 0.5);
    };
    el.addEventListener("pointerenter", onEnter);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener("pointerenter", onEnter);
      el.classList.remove("is-pending");
      canvas.remove();
    };
  }, []);

  return (
    <div ref={root} className={`pixelate${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
