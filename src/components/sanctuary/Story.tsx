"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ScrollTrigger } from "@/lib/gsap";
import { Wordmark } from "@/components/Wordmark";
import { Hotspot } from "./Hotspot";

/* ------------------------------------------------------------------------
   The Sanctuary story: one pinned room per collection, in Capitolium's
   grammar (collabcapitolium.fr, BlockStory / Chapter / ChapterArchs):

     pre    -0.25 → 0    the next room waits behind, sliding in at 30 % parallax
     zoom    0    → 0.25 five round-topped arches look onto one film; the centre
                         arch opens to 1.3× cover, its neighbours part to the
                         sides, the film darkens, the title's letters rise
     panels  0.25 → 0.75 the panels travel right to left over the film (which
                         drifts at 30 %), each panel rising on the diagonal;
                         the title runs off to the left, faster
     leave   0.75 → 1    the room slides away to the left, revealing the next

   Each room is `max(3·vw, 2·panelsWidth + vw)` of scroll, scrubbed by the
   page's Lenis (duration 1.2 s, expo out, as on the reference).
   ------------------------------------------------------------------------ */

// Full motion on every wide, fine-pointer screen (the system's "Reduce motion"
// setting is not consulted, as on the reference); touch and narrow screens rest.
export const STORY_MQ = "(min-width: 880px) and (pointer: fine)";

export type StoryImage = { src: string; alt: string; w: number; h: number };
export type StoryItem = {
  align: "top" | "bottom";
  image: StoryImage;
  title: string;
  text: string;
  href?: string;
  linkText?: string;
  hotspot?: [string, string];
};
export type StoryChapter = {
  slug: string;
  name: string;
  label: string;
  media: { poster: string; video?: string };
  items: StoryItem[];
  full?: { image: StoryImage; title: string; text: string; href: string; linkText: string };
};

const G = 318 / 223; // arch height / width, as on the reference
const COLS = 5;
const CENTRE = Math.floor(COLS / 2);
const PHASE = 1 / 4;
const easeInOutQuad = (a: number) => (a < 0.5 ? 2 * a * a : (4 - 2 * a) * a - 1);
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type Arch = { x: number; y: number; w: number; h: number; o: number } | null;
type Content = { el: HTMLElement; enterP: number; centerP: number; leaveP: number; isFirst: boolean; isLast: boolean };

/** Drives one room. Plain DOM, no React state: it runs on every scroll frame. */
class ChapterEngine {
  private el: HTMLElement;
  private track: HTMLElement;
  private parallax: HTMLElement;
  private panels: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private head: HTMLElement;
  private clips: HTMLElement[];
  private titles: HTMLElement[];
  private chars: HTMLElement[][];
  private media: HTMLImageElement | HTMLVideoElement | null;
  private stroke = "#a59e8f";
  private index: number;
  private isLast: boolean;
  private I = 0;
  private T = 0;
  private B = 0;
  private F = 0;
  private H = 0;
  private Z: number[] = [];
  private q = 0;
  private X = 0;
  private copyW = 0;
  private letters = 1;
  private arches: Arch[] = [];
  private contents: Content[] = [];
  private fulls: HTMLElement[] = [];
  private state: string | null = null;
  private last = -1;
  private raf = 0;
  private clipPath = "";

  constructor(el: HTMLElement, index: number, isLast: boolean) {
    this.el = el;
    this.index = index;
    this.isLast = isLast;
    this.track = el.querySelector(".room__track")!;
    this.parallax = el.querySelector(".room__parallax")!;
    this.panels = el.querySelector(".room__panels")!;
    this.canvas = el.querySelector(".room__canvas")!;
    this.ctx = this.canvas.getContext("2d");
    this.head = el.querySelector(".room__head--base")!;
    this.clips = Array.from(el.querySelectorAll<HTMLElement>(".room__clip"));
    this.titles = Array.from(el.querySelectorAll<HTMLElement>(".room__title-track"));
    this.chars = this.titles.map((t) => Array.from(t.querySelectorAll<HTMLElement>(".room__char, .room__sep")));
    this.letters = (el.querySelector<HTMLElement>(".room__title")?.dataset.title ?? "x").length;
    this.media = el.querySelector<HTMLVideoElement>(".room__source video") ?? el.querySelector<HTMLImageElement>(".room__source img");
    const s = getComputedStyle(el).getPropertyValue("--arch-stroke").trim();
    if (s) this.stroke = s;
    if (this.media instanceof HTMLImageElement && !this.media.complete) this.media.addEventListener("load", () => this.render(), { once: true });
  }

  /** Geometry, from the reference's ChapterArchs.computeRects. */
  measure() {
    this.track.style.transform = "translate3d(0,0,0)";
    this.el.style.transform = "";
    const I = (this.I = document.documentElement.clientWidth);
    const T = (this.T = window.innerHeight);
    this.B =
      I <= 1440
        ? Math.round(Math.max(160, Math.min(223 + (117 / 1050) * (I - 390), 340)))
        : Math.round(Math.min(340 + (140 / 480) * (I - 1440), 480));
    this.F = Math.round(this.B * G);
    this.H = Math.max(8, Math.round(26 + (54 / 1050) * (I - 390)));
    const start = (I - (COLS * this.B + (COLS - 1) * this.H)) / 2;
    const headH = this.head.offsetHeight;
    const top = headH + (T - headH - this.F) / 2 - 25;
    this.Z = Array.from({ length: COLS }, (_, a) => start + a * (this.B + this.H) + this.B / 2);
    this.q = top + this.F / 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = I * dpr;
    this.canvas.height = T * dpr;
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.X = this.panels.scrollWidth;
    this.copyW = this.titles[0]?.querySelector<HTMLElement>(".room__copy")?.offsetWidth ?? 0;

    // Diagonal flow: every panel item rises from below as it enters and keeps
    // rising as it leaves (Chapter.vue, H()); the first and last stay level.
    const items = Array.from(this.panels.querySelectorAll<HTMLElement>(".room__item"));
    items.forEach((e) => (e.style.transform = ""));
    const base = this.panels.getBoundingClientRect().left;
    this.contents = items.map((e, i) => {
      const r = e.getBoundingClientRect();
      const left = r.left - base + I; // the track starts one viewport to the right
      return {
        el: e,
        enterP: (left - I) / this.X,
        centerP: (left + r.width / 2 - I / 2) / this.X,
        leaveP: (left + r.width) / this.X,
        isFirst: i === 0,
        isLast: i === items.length - 1,
      };
    });
    this.fulls = Array.from(this.panels.querySelectorAll<HTMLElement>(".room__full-media"));
    this.state = null;
    if (this.last > -2) this.applyProgress(this.last);
  }

  panelsWidth() {
    return this.X;
  }

  private setArch(i: number, x: number, y: number, w: number, on: boolean, o = 0.08) {
    this.arches[i] = on ? { x, y, w, h: w * G, o } : null;
  }

  private archPath(a: NonNullable<Arch>) {
    const r = a.w / 2;
    return `M ${a.x} ${a.y + r} A ${r} ${r} 0 0 1 ${a.x + a.w} ${a.y + r} V ${a.y + a.h} H ${a.x} Z`;
  }

  /** The canvas: the film seen through every arch, darkened, hairline-stroked. */
  private render() {
    const ctx = this.ctx;
    if (!ctx) return;
    const { I, T } = this;
    ctx.clearRect(0, 0, I, T);
    const m = this.media;
    const ready = m && (m instanceof HTMLVideoElement ? m.readyState >= 2 : m.complete && m.naturalWidth > 0);
    const mw = m ? (m instanceof HTMLVideoElement ? m.videoWidth : m.naturalWidth) : 0;
    const mh = m ? (m instanceof HTMLVideoElement ? m.videoHeight : m.naturalHeight) : 0;
    const k = mw && mh ? Math.max(I / mw, T / mh) : 1;
    const dw = mw * k;
    const dh = mh * k;
    const paths: string[] = [];
    for (const a of this.arches) {
      if (!a) continue;
      const p = new Path2D(this.archPath(a));
      paths.push(this.archPath(a));
      if (ready && m) {
        ctx.save();
        ctx.clip(p);
        ctx.drawImage(m, (I - dw) / 2, (T - dh) / 2, dw, dh);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = a.o;
      ctx.fillStyle = "#000";
      ctx.fill(p);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = this.stroke;
      ctx.lineWidth = 1;
      ctx.stroke(p);
      ctx.restore();
    }
    const clip = paths.length ? `path('${paths.join(" ")}')` : "inset(0 0 100% 0)";
    if (clip !== this.clipPath) {
      this.clipPath = clip;
      this.clips.forEach((c) => (c.style.clipPath = clip));
    }
  }

  private loop = () => {
    this.render();
    const v = this.media;
    this.raf = v instanceof HTMLVideoElement && !v.paused ? requestAnimationFrame(this.loop) : 0;
  };

  private play() {
    const v = this.media;
    if (v instanceof HTMLVideoElement) {
      v.play().catch(() => {});
      if (!this.raf) this.raf = requestAnimationFrame(this.loop);
    }
  }

  private pause() {
    const v = this.media;
    if (v instanceof HTMLVideoElement) v.pause();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private base() {
    for (let i = 0; i < COLS; i++) this.setArch(i, this.Z[i] - this.B / 2, this.q - this.F / 2, this.B, true);
    this.render();
  }

  private hidden() {
    for (let i = 0; i < COLS; i++) this.setArch(i, 0, 0, 0, false);
    this.render();
  }

  private zoom(e: number) {
    const { I, T, B, Z, q } = this;
    const full = 1.3 * Math.max(I, T / G);
    const w = B + e * (full - B);
    const x = Z[CENTRE] + e * (I / 2 - Z[CENTRE]) - w / 2;
    const y = q + e * (T / 2 - q) - (w * G) / 2;
    for (let i = 0; i < COLS; i++) {
      if (i === CENTRE) this.setArch(i, x, y, w, true, 0.08 + 0.4 * e);
      else this.setArch(i, Z[i] + (i < CENTRE ? -I : I) * e - B / 2, q - this.F / 2, B, e < 0.5);
    }
    this.render();
    this.reveal(e);
  }

  private zoomFull(t: number) {
    const { I, T } = this;
    const full = 1.3 * Math.max(I, T / G);
    for (let i = 0; i < COLS; i++) {
      if (i === CENTRE) this.setArch(i, (I - full) / 2, (T - full * G) / 2, full, true, 0.48);
      else this.setArch(i, 0, 0, 0, false);
    }
    this.render();
    this.reveal(1);
    this.scrollTitle(t);
  }

  /** ChapterTitle.reveal: letters rise in order, the line slides in from the right. */
  private reveal(t: number) {
    const r = this.letters + 1;
    this.chars.forEach((set) =>
      set.forEach((c, i) => {
        const s = r > 1 ? ((i % r) / (r - 1)) * 0.4 : 0;
        const n = easeOutQuint(clamp01((t - s) / 1.5));
        c.style.transform = `translateY(${100 * (1 - n)}%)`;
      }),
    );
    const from = this.I / 4;
    const to = -0.02 * this.copyW;
    const x = from + easeOutQuint(t) * (to - from);
    this.titles.forEach((tr) => (tr.style.transform = `translateX(${x}px)`));
  }

  /** ChapterTitle.setScrollX: the title outruns the panels to the left. */
  private scrollTitle(t: number) {
    const speed = Math.max(2, 2 + 0.08 * this.letters);
    const x = -(0.02 * this.copyW + t * this.copyW * speed);
    this.titles.forEach((tr) => (tr.style.transform = `translateX(${x}px)`));
  }

  private diagonal(p: number) {
    const vh = this.T;
    for (const { el, enterP, centerP, leaveP, isFirst, isLast } of this.contents) {
      let y: number;
      if (p <= centerP) y = isFirst ? 0 : (1 - clamp01(centerP - enterP === 0 ? 1 : (p - enterP) / (centerP - enterP))) * vh;
      else y = isLast ? 0 : -clamp01(leaveP - centerP === 0 ? 1 : (p - centerP) / (leaveP - centerP)) * vh;
      el.style.transform = `translate3d(0, ${y}px, 0)`;
    }
  }

  private level() {
    for (const { el, isFirst } of this.contents) el.style.transform = `translate3d(0, ${isFirst ? 0 : this.T}px, 0)`;
  }

  private fullParallax(a: number) {
    for (const el of this.fulls) el.style.transform = `scale(1.1) translateX(${(0.5 - a) * 40}px)`;
  }

  private shift(x: number) {
    this.track.style.transform = `translate3d(${x}px,0,0)`;
  }

  applyProgress(e: number) {
    this.last = e;
    const { I } = this;
    if (e < -PHASE) {
      if (this.state !== "before") {
        this.state = "before";
        this.hidden();
        this.el.style.transform = "";
        this.shift(0);
        this.parallax.style.transform = "";
        this.level();
        this.pause();
      }
      return;
    }
    if (e < 0) {
      if (this.state !== "pre") this.play();
      this.state = "pre";
      this.base();
      this.el.style.transform = "";
      this.shift(0);
      this.parallax.style.transform = this.index > 0 ? `translateX(${(1 - (e + PHASE) / PHASE) * I * 0.3}px)` : "";
      this.reveal(0);
      this.level();
      return;
    }
    if (e >= 1) {
      if (this.state !== "after") {
        this.state = "after";
        if (this.isLast) {
          this.zoomFull(1);
          this.el.style.transform = "";
          this.play();
        } else {
          this.hidden();
          this.el.style.transform = `translateX(${-I}px)`;
          this.pause();
        }
      }
      return;
    }
    if (this.state !== "active" && this.state !== "pre") this.play();
    this.state = "active";
    if (e <= PHASE) {
      this.el.style.transform = "";
      this.shift(0);
      this.parallax.style.transform = "";
      this.level();
      this.zoom(easeInOutQuad(e / PHASE));
    } else if (e <= 0.75) {
      this.el.style.transform = "";
      const a = (e - PHASE) / 0.5;
      const r = -a * this.X;
      this.zoomFull(a);
      this.shift(r);
      this.parallax.style.transform = `translateX(${-0.7 * r}px)`;
      this.diagonal(a);
      this.fullParallax(a);
    } else {
      const r = -this.X;
      this.zoomFull(1);
      this.shift(r);
      this.parallax.style.transform = `translateX(${-0.7 * r}px)`;
      this.diagonal(1);
      this.fullParallax(1);
      this.el.style.transform = this.isLast ? "" : `translateX(${-((e - 0.75) / 0.25) * I}px)`;
    }
  }

  destroy() {
    this.pause();
  }
}

function Head({ chapter, variant }: { chapter: StoryChapter; variant: "base" | "arch" }) {
  return (
    <div className={`room__head room__head--${variant}`} aria-hidden={variant === "arch" || undefined}>
      <span className="room__rule" />
      <div className="room__head-top">
        <span>{chapter.name}</span>
        <Wordmark size="chapter" as="div" />
        <span>{chapter.name}</span>
      </div>
      <div className="room__head-bottom">
        <span className="room__star" aria-hidden="true" />
        {variant === "base" ? <h2 className="room__tag">{chapter.label}</h2> : <span className="room__tag">{chapter.label}</span>}
        <span className="room__star" aria-hidden="true" />
      </div>
    </div>
  );
}

function Title({ text, clip = false }: { text: string; clip?: boolean }) {
  const chars = Array.from(text);
  return (
    <div className={`room__title${clip ? " room__title--clip" : ""}`} data-title={text} aria-hidden="true">
      <div className="room__title-track">
        {[0, 1].map((k) => (
          <span key={k} className="room__copy">
            {chars.map((c, i) => (
              <span key={i} className={`room__char${c === " " ? " room__char--space" : ""}`}>
                {c}
              </span>
            ))}
            <span className="room__sep">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Room({ chapter, index, total }: { chapter: StoryChapter; index: number; total: number }) {
  return (
    <section
      id={chapter.slug}
      className="room"
      data-room={index}
      data-chapter={chapter.label}
      aria-labelledby={`${chapter.slug}-name`}
      style={{ zIndex: total - index }}
    >
      <div className="room__track">
        <div className="room__parallax">
          <div className="room__arcade">
            <Head chapter={chapter} variant="base" />
            <div className="room__clip room__clip--head">
              <Head chapter={chapter} variant="arch" />
            </div>
            <canvas className="room__canvas" aria-hidden="true" />
            {/* Resting arcade (touch, narrow screens): three windows onto one image. */}
            <div className="room__windows" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span key={i} className="room__window" style={{ backgroundImage: `url(${chapter.media.poster})` }} />
              ))}
            </div>
            <div className="room__source" aria-hidden="true">
              {chapter.media.video ? (
                <video src={chapter.media.video} poster={chapter.media.poster} muted loop playsInline preload="auto" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- drawn into the canvas, never shown itself
                <img src={chapter.media.poster} alt="" decoding="async" />
              )}
            </div>
            <Title text={chapter.name} />
            <div className="room__clip room__clip--title">
              <Title text={chapter.name} clip />
            </div>
          </div>
          <h3 id={`${chapter.slug}-name`} className="sr-only">
            {chapter.name}
          </h3>
        </div>

        <div className="room__panels">
          <div className="room__panel">
            {chapter.items.map((it, i) => (
              <div key={i} className={`room__item room__item--${it.align}`}>
                <div className="room__media" style={{ aspectRatio: `${it.image.w} / ${it.image.h}` }}>
                  {it.href && it.hotspot ? (
                    <Hotspot href={it.href} label1={it.hotspot[0]} label2={it.hotspot[1]}>
                      <Image src={it.image.src} alt={it.image.alt} fill sizes="(min-width: 880px) 34vw, 90vw" />
                    </Hotspot>
                  ) : (
                    <Image src={it.image.src} alt={it.image.alt} fill sizes="(min-width: 880px) 34vw, 90vw" />
                  )}
                </div>
                <div className="room__text">
                  <span className="room__text-rule" aria-hidden="true" />
                  <h4 className="room__text-title">{it.href ? <Link href={it.href}>{it.title}</Link> : it.title}</h4>
                  <p>{it.text}</p>
                  {it.href && it.linkText ? (
                    <p>
                      <Link href={it.href} className="link">
                        {it.linkText}
                      </Link>
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {chapter.full ? (
            <div className="room__full">
              <div className="room__full-frame">
                <div className="room__full-media">
                  <Image src={chapter.full.image.src} alt={chapter.full.image.alt} fill sizes="100vw" />
                </div>
              </div>
              <div className="room__full-text">
                <span className="room__text-rule" aria-hidden="true" />
                <h4 className="room__text-title">{chapter.full.title}</h4>
                <p>{chapter.full.text}</p>
                <p>
                  <Link href={chapter.full.href} className="link link--light">
                    {chapter.full.linkText}
                  </Link>
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** The whole story block: pins once, scrubs every room in turn. */
export function Story({ chapters, label = "sanctuary" }: { chapters: StoryChapter[]; label?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const block = root.current;
    if (!block) return;
    const mq = window.matchMedia(STORY_MQ);
    let engines: ChapterEngine[] = [];
    let st: ScrollTrigger | null = null;
    let active = -1;
    let ro: ResizeObserver | null = null;

    const setup = () => {
      teardown();
      if (!mq.matches) return;
      block.classList.add("is-engine");
      const rooms = Array.from(block.querySelectorAll<HTMLElement>(".room"));
      engines = rooms.map((el, i) => new ChapterEngine(el, i, i === rooms.length - 1));
      engines.forEach((e) => e.measure());
      const vw = document.documentElement.clientWidth;
      const widest = Math.max(0, ...engines.map((e) => e.panelsWidth()));
      const a = Math.max(3 * vw, 2 * widest + vw);
      const n = engines.length;
      const span = (n - 1) * a + a * 0.75;
      block.style.height = `${span + window.innerHeight}px`;
      const top = block.getBoundingClientRect().top + window.scrollY;
      block.dataset.offsets = engines.map((_, i) => Math.round(top + i * a)).join(",");
      const o = n - 1 + 0.75;
      engines.forEach((e, i) => e.applyProgress(i === 0 ? 0 : -1));
      st = ScrollTrigger.create({
        trigger: block,
        start: "top top",
        end: `+=${span}`,
        scrub: true,
        onUpdate: (self) => {
          const l = self.progress * o;
          const cur = Math.min(n - 1, l | 0);
          for (let i = Math.max(0, cur - 1); i <= Math.min(n - 1, cur + 1); i++) engines[i].applyProgress(l - i);
          if (cur !== active) {
            active = cur;
            block.dispatchEvent(new CustomEvent("story:chapter", { detail: cur, bubbles: true }));
          }
        },
        onToggle: (self) => {
          // The room's own header carries the mark while the story is pinned.
          document.body.classList.toggle("in-chapter", self.isActive);
          block.dispatchEvent(new CustomEvent("story:active", { detail: self.isActive, bubbles: true }));
        },
      });
      ScrollTrigger.refresh();
    };

    function teardown() {
      st?.kill();
      st = null;
      engines.forEach((e) => e.destroy());
      engines = [];
      block!.classList.remove("is-engine");
      document.body.classList.remove("in-chapter");
      block!.style.height = "";
      block!.querySelectorAll<HTMLElement>(".room, .room__track, .room__parallax, .room__item, .room__full-media, .room__title-track, .room__char, .room__sep").forEach((el) => (el.style.transform = ""));
    }

    let raf = 0;
    const reflow = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(setup);
    };
    const onLoad = () => reflow();
    setup();
    mq.addEventListener("change", reflow);
    window.addEventListener("load", onLoad, { once: true });
    let lastW = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      reflow();
    };
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(reflow);
    ro = new ResizeObserver(() => {
      const w = Math.max(0, ...engines.map((e) => e.panelsWidth()));
      const now = Math.max(0, ...Array.from(block.querySelectorAll<HTMLElement>(".room__panels")).map((p) => p.scrollWidth));
      if (engines.length && Math.abs(now - w) > 2) reflow();
    });
    block.querySelectorAll(".room__panels").forEach((p) => ro?.observe(p));

    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", reflow);
      window.removeEventListener("load", onLoad);
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      teardown();
    };
  }, [chapters.length]);

  return (
    <div ref={root} className="story" data-story={label}>
      <div className="story__pin">
        <div className="story__track">
          {chapters.map((c, i) => (
            <Room key={c.slug} chapter={c} index={i} total={chapters.length} />
          ))}
        </div>
      </div>
    </div>
  );
}
