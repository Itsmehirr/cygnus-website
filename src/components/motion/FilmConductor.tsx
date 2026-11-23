"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * One film plays in view at a time.
 *
 * Chrome draws the whole page at half its frame rate while two videos play on
 * screen (a power saving meant for video calls), and the smooth scroll shows
 * it as a stutter wherever two films share the viewport. So the film that
 * holds most of the screen plays, or the one under the pointer, or the one
 * with its sound on; any other film in view holds its frame until its turn.
 * When two share the screen for long they take turns, a loop each. Films out
 * of view rest, except one left playing for its sound.
 */
export function FilmConductor() {
  const pathname = usePathname();

  useEffect(() => {
    const area = new Map<HTMLVideoElement, number>();
    let films: HTMLVideoElement[] = [];
    let lead: HTMLVideoElement | null = null;
    let leadSince = 0;
    let heldUntil = 0;
    let hovered: HTMLVideoElement | null = null;

    const seen = (v: HTMLVideoElement) => area.get(v) ?? 0;
    const turn = (v: HTMLVideoElement) => Math.min(12, Math.max(4, v.duration || 6)) * 1000;

    // The film giving way stops first and the next starts a few frames
    // later, so the two never overlap, not even for a frame.
    let starting = 0;
    const apply = () => {
      let stopped = false;
      for (const v of films) {
        if (v.paused || v === lead) continue;
        if (seen(v) > 0) {
          v.pause();
          stopped = true;
        } else if (v.muted) v.pause();
      }
      window.clearTimeout(starting);
      const start = () => {
        if (lead && seen(lead) > 0 && lead.paused) lead.play().catch(() => {});
      };
      if (stopped) starting = window.setTimeout(start, 90);
      else start();
    };

    const follow = (next: HTMLVideoElement | null, held = 0) => {
      if (next !== lead) {
        lead = next;
        leadSince = performance.now();
        heldUntil = held;
      }
      apply();
    };

    const decide = () => {
      const inView = films.filter((v) => seen(v) > 0);
      const loud = inView.find((v) => !v.muted);
      if (loud) return follow(loud);
      if (hovered && inView.includes(hovered)) return follow(hovered);
      const biggest = inView.reduce<HTMLVideoElement | null>((m, v) => (!m || seen(v) > seen(m) ? v : m), null);
      const current = lead && inView.includes(lead) ? lead : null;
      if (!current || !biggest || biggest === current) return follow(current ?? biggest);
      // The lead changes hands only for a clearly larger film; a turn given
      // by the rotation is kept until its film has all but left.
      const margin = performance.now() < heldUntil ? 2.5 : 1.15;
      follow(seen(biggest) > seen(current) * margin ? biggest : current);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          area.set(e.target as HTMLVideoElement, e.isIntersecting ? e.intersectionRect.width * e.intersectionRect.height : 0);
        }
        decide();
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );
    // A film about to arrive fetches its first frames, so it can be shown
    // (held on its first frame) before its turn to play.
    const soon = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLVideoElement).preload = "auto";
          soon.unobserve(e.target);
        }
      },
      { rootMargin: "700px 0px" },
    );

    const scan = () => {
      const found = Array.from(document.querySelectorAll<HTMLVideoElement>("video.clip"));
      for (const v of films) {
        if (found.includes(v)) continue;
        io.unobserve(v);
        soon.unobserve(v);
        v.removeEventListener("volumechange", decide);
        area.delete(v);
      }
      for (const v of found) {
        if (films.includes(v)) continue;
        // From here on playing is decided here, not by the autoplay attribute.
        v.autoplay = false;
        v.addEventListener("volumechange", decide);
        io.observe(v);
        soon.observe(v);
      }
      films = found;
      if (lead && !films.includes(lead)) lead = null;
      if (hovered && !films.includes(hovered)) hovered = null;
    };

    // Two films sharing the screen take turns, a loop each.
    const rotation = window.setInterval(() => {
      const now = performance.now();
      if (!lead || hovered || !lead.muted || document.hidden) return;
      const most = Math.max(0, ...films.map(seen));
      const peers = films.filter((v) => seen(v) > 0 && seen(v) >= most * 0.6);
      if (peers.length < 2 || !peers.includes(lead) || now - leadSince < turn(lead)) return;
      const next = peers[(peers.indexOf(lead) + 1) % peers.length];
      follow(next, now + turn(next));
    }, 500);

    const filmAt = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      const v = target.closest("video.clip") ?? target.closest(".media-fade")?.querySelector("video.clip");
      return v instanceof HTMLVideoElement ? v : null;
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const v = filmAt(e.target);
      if (v === hovered) return;
      hovered = v;
      decide();
    };
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("visibilitychange", decide);

    scan();
    // The page of a new route may still be settling in.
    const again = window.setTimeout(scan, 600);

    return () => {
      window.clearInterval(rotation);
      window.clearTimeout(again);
      window.clearTimeout(starting);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("visibilitychange", decide);
      for (const v of films) v.removeEventListener("volumechange", decide);
      io.disconnect();
      soon.disconnect();
    };
  }, [pathname]);

  return null;
}
