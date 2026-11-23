"use client";

import { useEffect, useRef } from "react";

type Media = HTMLImageElement | HTMLVideoElement;

const ready = (m: Media) => (m instanceof HTMLVideoElement ? m.readyState >= 2 : m.complete && m.naturalWidth > 0);

/**
 * A picture or film arrives by fading in (1.4 s), once it is in view and has
 * something to show. Gone back below the screen, it waits again, so it fades
 * in once more on the way down. The film keeps playing throughout. Without
 * JS the media simply show.
 */
export function MediaFade({ children, className }: { children: React.ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const media = el?.querySelector<Media>("video, img");
    if (!el || !media) return;
    const loaded = media instanceof HTMLVideoElement ? "loadeddata" : "load";
    let shown = false;
    let late = 0;

    el.classList.add("is-pending");
    const show = () => {
      window.clearTimeout(late);
      el.classList.remove("is-pending");
    };
    const reveal = () => {
      if (shown) return;
      shown = true;
      if (ready(media)) {
        // A picture is decoded first, so the fade never opens on a half-drawn image.
        if (media instanceof HTMLImageElement) media.decode().then(show, show);
        else show();
        return;
      }
      media.addEventListener(loaded, show, { once: true });
      // If the file is slow, show the frame rather than keep it empty.
      late = window.setTimeout(show, 4000);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) reveal();
        // Below the viewport again: ready to fade in once more on the way down.
        else if (e.boundingClientRect.top > 0) {
          shown = false;
          window.clearTimeout(late);
          media.removeEventListener(loaded, show);
          el.classList.add("is-pending");
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      window.clearTimeout(late);
      media.removeEventListener(loaded, show);
      el.classList.remove("is-pending");
    };
  }, []);

  return (
    <div ref={root} className={`media-fade${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
