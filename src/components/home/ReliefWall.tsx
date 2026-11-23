"use client";

import { useEffect, useRef } from "react";

type Theme = "light" | "dark";

/** The forest's maps, written by `scripts/relief.py forest`: per tile a
 *  shading map, its -h height map, and -s cuts of both for small screens. */
const FOREST = { src: "/images/relief/forest", tiles: 4 };
/** Grey of a flat face in the light, in the shading maps (ZERO in the script). */
const ZERO = (176 / 255).toFixed(4);
/** The strip is one screen wide, and never narrower than this (CSS px): a
 *  phone looks at its middle, so the figures keep their size. */
const MIN_WORLD = 900;
/** A stretch of the trail sinks back over this many seconds. */
const LIFE = 3.1;

/* Where the pointer was last seen, kept across pages: the Menu opens with the
   wall already risen under the cursor that clicked its way there. */
const lastPointer = { x: 0, y: 0, known: false };
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "touch") return;
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;
      lastPointer.known = true;
    },
    { passive: true },
  );
}

/* Marks painted into the reveal texture. Every vertex carries its place on
   screen (CSS px), a local coordinate and two parameters. */
const MARK_VERT = `
attribute vec2 a_pos;
attribute vec4 a_data;
uniform vec2 u_res;
varying vec4 v_data;
void main() {
  v_data = a_data;
  gl_Position = vec4(a_pos.x / u_res.x * 2.0 - 1.0, 1.0 - a_pos.y / u_res.y * 2.0, 0.0, 1.0);
}`;

/* One stamp of the swell: a soft bell (local xy runs -1..1, z is its level). */
const STAMP_FRAG = `
precision mediump float;
varying vec4 v_data;
void main() {
  float a = clamp(1.0 - dot(v_data.xy, v_data.xy), 0.0, 1.0);
  gl_FragColor = vec4(a * a * v_data.z);
}`;

/* A clearing round a block of text (local xy in px from its centre, zw its
   half size): 1 inside, easing to 0 a little way out. */
const CLEAR_FRAG = `
precision mediump float;
uniform float u_feather;
varying vec4 v_data;
void main() {
  vec2 q = abs(v_data.xy) - v_data.zw;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  gl_FragColor = vec4(1.0 - smoothstep(0.0, u_feather, d));
}`;

const WALL_VERT = `
attribute vec2 a_pos;
uniform vec2 u_res;
uniform vec4 u_rect;
varying vec2 v_uv;
varying vec2 v_scr;
void main() {
  vec2 p = u_rect.xy + a_pos * u_rect.zw;
  v_uv = a_pos;
  // Across the screen with y up: the reveal texture's own way up.
  v_scr = vec2(p.x / u_res.x, 1.0 - p.y / u_res.y);
  gl_Position = vec4(v_scr * 2.0 - 1.0, 0.0, 1.0);
}`;

/* The wall itself. Where the reveal texture is empty the stone stays flat and
   nothing is drawn. Where the cursor has passed, the forest swells out of it:
   the tall figures first, the undergrowth after them. Its shading is laid on
   the ground in two colours (shadow, light), so the stone's own grain shows
   through both; the edge of the swell tilts the forms, lit on the side that
   faces the light. Text keeps a clearing: the reveal is held back round it. */
const WALL_FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D u_shade;
uniform sampler2D u_height;
uniform sampler2D u_reveal;
uniform vec4 u_vmap;
uniform vec2 u_step;
uniform float u_ready;
uniform vec4 u_k;
uniform vec3 u_shadow;
uniform vec3 u_lit;
uniform vec2 u_form;
varying vec2 v_uv;
varying vec2 v_scr;
float risen(vec2 uv) {
  return texture2D(u_reveal, uv).r;
}
void main() {
  vec4 t = texture2D(u_reveal, v_scr);
  float e = t.r * (1.0 - t.g);
  if (e < 0.004) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float h = texture2D(u_height, vec2(v_uv.x, u_vmap.z + v_uv.y * u_vmap.w)).r;
  float from = (1.0 - h) * 0.38;
  float up = smoothstep(from, from + 0.6, e) * u_ready;
  float s = texture2D(u_shade, vec2(v_uv.x, u_vmap.x + v_uv.y * u_vmap.y)).r - ${ZERO};
  // The slope of the swell itself (never of a clearing's edge).
  float gx = risen(v_scr + vec2(u_step.x, 0.0)) - risen(v_scr - vec2(u_step.x, 0.0));
  float gy = risen(v_scr + vec2(0.0, u_step.y)) - risen(v_scr - vec2(0.0, u_step.y));
  float rim = (0.66 * gx - 0.75 * gy) * h * u_form.y;
  float sh = (s + u_form.x * (0.35 + 0.65 * h)) * up + rim * sqrt(up);
  float dark = clamp(-sh * u_k.x, 0.0, u_k.z);
  float light = clamp(sh * u_k.y, 0.0, u_k.w);
  gl_FragColor = sh < 0.0 ? vec4(u_shadow * dark, dark) : vec4(u_lit * light, light);
}`;

/* The dark wall's own light: a soft chartreuse-white pool under the cursor. */
const GLOW_FRAG = `
precision mediump float;
uniform vec3 u_glow;
uniform vec2 u_reach;
varying vec2 v_scr;
void main() {
  vec2 d = (v_scr - u_glow.xy) / u_reach;
  float r = dot(d, d);
  float a = (exp(-r * 1.1) * 0.1 + exp(-r * 4.0) * 0.06) * u_glow.z;
  // A grain of noise keeps so slow a gradient from banding on the dark stone.
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  a = max(a + n * smoothstep(0.0, 0.012, a) / 255.0, 0.0);
  gl_FragColor = vec4(vec3(0.8, 0.83, 0.64) * a, a);
}`;

type Look = {
  /** shadow gain, light gain, shadow limit, light limit */
  k: [number, number, number, number];
  shadow: [number, number, number];
  lit: [number, number, number];
  /** light caught by raised faces; strength of the swell's rim */
  form: [number, number];
};

const THEMES: Record<Theme, Look> = {
  // Plaster pressed out of the warm stone: it reads by its shadows.
  light: { k: [2.35, 2.2, 0.8, 0.85], shadow: [0.36, 0.29, 0.21], lit: [1, 0.995, 0.98], form: [0, 0.5] },
  // Carved in the charcoal: the faces stay dark stone, their edges catch the light.
  dark: { k: [2.6, 4.2, 0.9, 0.72], shadow: [0, 0, 0], lit: [0.93, 0.94, 0.84], form: [0.03, 0.3] },
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Immersive Garden's sculpted wall. A forest of swans, peonies, branches,
 * feathers and constellations covers the whole ground, pressed flat into the
 * stone; where the cursor passes it swells out, and it sinks back along the
 * trail a couple of seconds later. The forest keeps clear of the words on top
 * of it. On a touch screen it rises under the finger, and wanders on its own
 * when nobody touches. One fixed WebGL layer under the content, drawn only
 * while something is risen; without WebGL the ground simply stays flat.
 *
 * theme "light" presses it out of the Home stone; "dark" carves it in the
 * Menu's charcoal, under a soft light. waitForIntro holds the wall until the
 * Home opening is done. start is where the strip begins at the top of the
 * page, in tiles.
 */
export function ReliefWall({ theme = "light", waitForIntro = true, start = 0 }: { theme?: Theme; waitForIntro?: boolean; start?: number }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const html = document.documentElement;
    let stop: (() => void) | undefined;
    let cancelled = false;
    let pending: (() => void) | undefined;

    // Nothing is set up until the page is ready and the browser is idle, so
    // the wall costs the first load nothing.
    const later = (fn: () => void) => {
      if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(fn, { timeout: 1200 });
        return () => window.cancelIdleCallback(id);
      }
      // Safari before 18 has no idle callback.
      const id = setTimeout(fn, 150);
      return () => clearTimeout(id);
    };
    const begin = () => {
      if (stop || pending || cancelled) return;
      pending = later(() => {
        pending = undefined;
        if (!cancelled) stop = run(host);
      });
    };
    const ready = () => !waitForIntro || html.classList.contains("is-ready");
    const mo = new MutationObserver(() => {
      if (ready()) begin();
    });
    if (ready()) begin();
    else mo.observe(html, { attributes: true, attributeFilter: ["class"] });

    function run(host: HTMLDivElement): (() => void) | undefined {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
      if (!gl) return;
      const look = THEMES[theme];
      const minmax = gl.getExtension("EXT_blend_minmax");

      const compile = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };
      const link = (vert: string, frag: string) => {
        const p = gl.createProgram()!;
        gl.attachShader(p, compile(gl.VERTEX_SHADER, vert));
        gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag));
        gl.linkProgram(p);
        if (gl.getProgramParameter(p, gl.LINK_STATUS)) return p;
        console.warn("[relief wall]", gl.getProgramInfoLog(p));
        return null;
      };
      const wallProg = link(WALL_VERT, WALL_FRAG);
      const stampProg = link(MARK_VERT, STAMP_FRAG);
      const clearProg = link(MARK_VERT, CLEAR_FRAG);
      const glowProg = theme === "dark" ? link(WALL_VERT, GLOW_FRAG) : null;
      if (!wallProg || !stampProg || !clearProg) return;
      host.appendChild(canvas);
      const at = (p: WebGLProgram, name: string) => gl.getUniformLocation(p, name);

      const quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
      // Stamps and clearings: six vertices each, six numbers a vertex.
      const MARKS = 200;
      const marks = new Float32Array(MARKS * 36);
      const markBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, markBuf);
      gl.bufferData(gl.ARRAY_BUFFER, marks.byteLength, gl.DYNAMIC_DRAW);

      const w$ = {
        res: at(wallProg, "u_res"), rect: at(wallProg, "u_rect"), vmap: at(wallProg, "u_vmap"), step: at(wallProg, "u_step"),
        ready: at(wallProg, "u_ready"), aPos: gl.getAttribLocation(wallProg, "a_pos"),
      };
      gl.useProgram(wallProg);
      gl.uniform1i(at(wallProg, "u_shade"), 0);
      gl.uniform1i(at(wallProg, "u_height"), 1);
      gl.uniform1i(at(wallProg, "u_reveal"), 2);
      gl.uniform4f(at(wallProg, "u_k"), ...look.k);
      gl.uniform3f(at(wallProg, "u_shadow"), ...look.shadow);
      gl.uniform3f(at(wallProg, "u_lit"), ...look.lit);
      gl.uniform2f(at(wallProg, "u_form"), ...look.form);
      const g$ = glowProg
        ? { res: at(glowProg, "u_res"), rect: at(glowProg, "u_rect"), glow: at(glowProg, "u_glow"), reach: at(glowProg, "u_reach"), aPos: gl.getAttribLocation(glowProg, "a_pos") }
        : null;
      const mark$ = (p: WebGLProgram) => ({ res: at(p, "u_res"), aPos: gl.getAttribLocation(p, "a_pos"), aData: gl.getAttribLocation(p, "a_data") });
      const s$ = mark$(stampProg);
      const c$ = { ...mark$(clearProg), feather: at(clearProg, "u_feather") };

      gl.enable(gl.BLEND);
      gl.clearColor(0, 0, 0, 0);

      // ---- The forest's tiles: asked for as the page reaches them, decoded
      // off the main thread, then handed to the GPU one a frame.
      let w = window.innerWidth;
      let h = window.innerHeight;
      let dpr = Math.min(window.devicePixelRatio || 1, w < 720 ? 1.25 : 1.5);
      const cut = Math.max(w, MIN_WORLD) * dpr <= 1300 ? "-s" : "";
      type Tile = { shade: WebGLTexture | null; height: WebGLTexture | null; sv: [number, number]; hv: [number, number]; asked: boolean; ready: number };
      const tiles: Tile[] = Array.from({ length: FOREST.tiles }, () => ({ shade: null, height: null, sv: [0, 1], hv: [0, 1], asked: false, ready: 0 }));
      type Source = HTMLImageElement | ImageBitmap;
      const queue: { tile: Tile; kind: "shade" | "height"; src: Source }[] = [];
      let disposed = false;
      let uploading = 0;
      let dirty = true;
      const upload = () => {
        uploading = 0;
        const next = queue.shift();
        if (!next || disposed) return;
        const { tile, kind, src } = next;
        const [sw, sh] = src instanceof HTMLImageElement ? [src.naturalWidth, src.naturalHeight] : [src.width, src.height];
        const tex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, src);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (!(src instanceof HTMLImageElement)) src.close();
        // A tile is twice as wide as tall; the rows beyond that are its
        // neighbours' edges, there so sampling meets no seam.
        const rows = sw / 2;
        const v: [number, number] = [(sh - rows) / 2 / sh, rows / sh];
        tile[kind] = tex;
        if (kind === "shade") tile.sv = v;
        else tile.hv = v;
        dirty = true;
        if (queue.length) uploading = requestAnimationFrame(upload);
      };
      // A bitmap decodes off the main thread and reaches the GPU in a couple
      // of milliseconds (an <img> costs a whole frame there); where bitmaps
      // are missing, the <img> still works.
      const fetchMap = async (url: string): Promise<Source> => {
        if (typeof createImageBitmap === "function") {
          try {
            const res = await fetch(url, { priority: "low" } as RequestInit);
            if (res.ok) return await createImageBitmap(await res.blob(), { premultiplyAlpha: "none", colorSpaceConversion: "none" });
          } catch {
            // fall through
          }
        }
        const img = new Image();
        img.decoding = "async";
        img.src = url;
        await img.decode();
        return img;
      };
      const ask = (i: number) => {
        const tile = tiles[i];
        if (tile.asked) return;
        tile.asked = true;
        for (const kind of ["height", "shade"] as const) {
          fetchMap(`${FOREST.src}-${i}${kind === "height" ? "-h" : ""}${cut}.webp`)
            .then((src) => {
              if (disposed) return;
              queue.push({ tile, kind, src });
              if (!uploading) uploading = requestAnimationFrame(upload);
            })
            .catch(() => {});
        }
      };

      // ---- The reveal texture: the swell in red, the clearings in green.
      let target: { fbo: WebGLFramebuffer; tex: WebGLTexture; w: number; h: number } | null = null;
      const makeTarget = () => {
        if (target) {
          gl.deleteFramebuffer(target.fbo);
          gl.deleteTexture(target.tex);
        }
        const tw = Math.max(2, Math.ceil(w / 4));
        const th = Math.max(2, Math.ceil(h / 4));
        const tex = gl.createTexture()!;
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const fbo = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        target = { fbo, tex, w: tw, h: th };
      };
      const size = () => {
        dpr = Math.min(window.devicePixelRatio || 1, w < 720 ? 1.25 : 1.5);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        makeTarget();
        dirty = true;
      };
      size();

      // ---- The words on top: every block of text keeps a clearing. Blocks
      // are found once (and again when the page changes); only the ones near
      // the screen are measured, and only on frames that draw.
      type Block = { ox: number; oy: number; w: number; h: number };
      const blocks = new Map<Element, Block>();
      const near = new Set<Element>();
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) near.add(e.target);
            else near.delete(e.target);
          }
          dirty = true;
        },
        { rootMargin: "160px" },
      );
      const SKIP = ".cursor, .relief, .sr-only, script, style, noscript, template, [hidden]";
      const collect = () => {
        if (disposed) return;
        const found = new Set<Element>();
        const inline = new Map<Element, boolean>();
        const isInline = (el: Element) => {
          let v = inline.get(el);
          if (v === undefined) {
            const d = getComputedStyle(el).display;
            v = d === "inline" || d === "inline-block" || d === "contents";
            inline.set(el, v);
          }
          return v;
        };
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          if (!n.nodeValue || !n.nodeValue.trim()) continue;
          let el = n.parentElement;
          if (!el || el.closest(SKIP)) continue;
          // Letters and words belong to the block that holds their line.
          while (el.parentElement && el.parentElement !== document.body && isInline(el)) el = el.parentElement;
          found.add(el);
        }
        const range = document.createRange();
        for (const el of blocks.keys()) {
          if (found.has(el)) continue;
          io.unobserve(el);
          blocks.delete(el);
          near.delete(el);
        }
        for (const el of found) {
          const box = el.getBoundingClientRect();
          range.selectNodeContents(el);
          const text = range.getBoundingClientRect();
          if (text.width < 4 || text.height < 4) {
            if (blocks.delete(el)) {
              io.unobserve(el);
              near.delete(el);
            }
            continue;
          }
          const known = blocks.has(el);
          blocks.set(el, { ox: text.left - box.left, oy: text.top - box.top, w: text.width, h: text.height });
          if (!known) io.observe(el);
        }
        dirty = true;
      };
      let collecting: (() => void) | undefined;
      let debounce = 0;
      const recollect = (wait: number) => {
        clearTimeout(debounce);
        debounce = window.setTimeout(() => {
          collecting?.();
          collecting = later(collect);
        }, wait);
      };
      const pageWatch = new MutationObserver((list) => {
        for (const m of list) {
          const t = m.target instanceof Element ? m.target : m.target.parentElement;
          if (t && !t.closest(".cursor, .relief")) {
            recollect(500);
            return;
          }
        }
      });
      pageWatch.observe(document.body, { childList: true, subtree: true });
      const ro = new ResizeObserver(() => recollect(300));
      ro.observe(document.body);
      document.fonts?.ready.then(() => recollect(100));
      collect();

      // ---- The pointer. A fine pointer leads the swell; a finger does too,
      // and when it lifts the swell wanders on its own.
      const fine = window.matchMedia("(pointer: fine)").matches;
      const pointer = { x: lastPointer.x, y: lastPointer.y, seen: fine && lastPointer.known, inside: true, touched: -1e9 };
      let clock = 0;
      const onPointer = (e: PointerEvent) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.seen = true;
        pointer.inside = true;
        if (e.pointerType === "touch") pointer.touched = clock;
      };
      // A scrolling finger stops sending pointer events; touches keep coming.
      const onTouch = (e: TouchEvent) => {
        const t = e.touches[0];
        if (!t) return;
        pointer.x = t.clientX;
        pointer.y = t.clientY;
        pointer.seen = true;
        pointer.touched = clock;
      };
      const onLeave = () => {
        pointer.inside = false;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("pointerdown", onPointer, { passive: true });
      window.addEventListener("touchstart", onTouch, { passive: true });
      window.addEventListener("touchmove", onTouch, { passive: true });
      html.addEventListener("mouseleave", onLeave);

      // ---- The swell: a head that follows the pointer, and the stamps it
      // leaves on the wall behind it (kept in page coordinates, so they stay
      // with the stone as it scrolls).
      type Stamp = { x: number; y: number; born: number; level: number };
      const stamps: Stamp[] = [];
      const head = { x: pointer.x, y: pointer.y, placed: false };
      const dropped = { x: 0, y: 0 };
      let presence = 0;
      let global = 0;
      let blank = false;
      const drawn = { x: -1, y: -1, presence: -1, scroll: -1 };
      let raf = 0;
      let last = performance.now();
      let count = 0;

      const put = (x0: number, y0: number, x1: number, y1: number, lx0: number, ly0: number, lx1: number, ly1: number, p: number, q: number) => {
        if (count >= MARKS) return;
        let o = count++ * 36;
        const v = (x: number, y: number, lx: number, ly: number) => {
          marks[o++] = x;
          marks[o++] = y;
          marks[o++] = lx;
          marks[o++] = ly;
          marks[o++] = p;
          marks[o++] = q;
        };
        v(x0, y0, lx0, ly0);
        v(x1, y0, lx1, ly0);
        v(x0, y1, lx0, ly1);
        v(x1, y0, lx1, ly0);
        v(x1, y1, lx1, ly1);
        v(x0, y1, lx0, ly1);
      };
      const drawMarks = (loc: { res: WebGLUniformLocation | null; aPos: number; aData: number }) => {
        if (!count) return;
        gl.bindBuffer(gl.ARRAY_BUFFER, markBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, marks.subarray(0, count * 36));
        gl.enableVertexAttribArray(loc.aPos);
        gl.vertexAttribPointer(loc.aPos, 2, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(loc.aData);
        gl.vertexAttribPointer(loc.aData, 4, gl.FLOAT, false, 24, 8);
        gl.uniform2f(loc.res, w, h);
        gl.drawArrays(gl.TRIANGLES, 0, count * 6);
        gl.disableVertexAttribArray(loc.aData);
      };

      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        clock += dt;
        if (window.innerWidth !== w || window.innerHeight !== h) {
          w = window.innerWidth;
          h = window.innerHeight;
          size();
        }
        const scroll = window.scrollY;
        const world = Math.max(w, MIN_WORLD);
        const tileH = world / 2;
        const radius = Math.min(270, Math.max(125, world * 0.15));

        // The wall waits for its page, then is allowed up over a second.
        if (global < 1 && ready()) global = Math.min(1, global + dt);

        // Where the swell wants to be, and whether it should be there at all.
        const wander = fine ? false : clock - pointer.touched > 2.5;
        let tx = pointer.x;
        let ty = pointer.y;
        let want = fine ? (pointer.seen && pointer.inside ? 1 : 0) : 1;
        if (wander) {
          tx = w * (0.5 + Math.sin(clock * 0.21) * 0.3);
          ty = h * (0.44 + Math.cos(clock * 0.17) * 0.27);
        }
        want *= global;
        // A leap (the pointer returning somewhere else, a new touch) leaves
        // the old swell to sink where it stands and starts a new one.
        if (!head.placed || Math.hypot(tx - head.x, ty - head.y) > radius * 3) {
          if (head.placed && presence > 0.02) stamps.push({ x: head.x, y: head.y + scroll, born: clock, level: presence });
          head.x = tx;
          head.y = ty;
          head.placed = true;
          presence = 0;
          dropped.x = tx;
          dropped.y = ty + scroll;
        }
        const follow = 1 - Math.exp(-dt * (wander ? 1.3 : 12));
        head.x += (tx - head.x) * follow;
        head.y += (ty - head.y) * follow;
        presence += (want - presence) * (1 - Math.exp(-dt / (want > presence ? 0.2 : 0.45)));
        if (presence < 0.002 && want === 0) presence = 0;

        // The trail: a stamp every quarter radius of travel across the wall
        // (the page scrolling under a resting cursor counts as travel).
        const hx = head.x;
        const hy = head.y + scroll;
        if (presence > 0.02) {
          const gap = radius * 0.24;
          const dx = hx - dropped.x;
          const dy = hy - dropped.y;
          const dist = Math.hypot(dx, dy);
          if (dist >= gap) {
            const n = Math.min(40, Math.floor(dist / gap));
            for (let i = 1; i <= n; i++) {
              const f = (i * gap) / dist;
              stamps.push({ x: dropped.x + dx * f, y: dropped.y + dy * f, born: clock, level: presence });
            }
            dropped.x += dx * ((n * gap) / dist);
            dropped.y += dy * ((n * gap) / dist);
          }
        } else {
          dropped.x = hx;
          dropped.y = hy;
        }
        while (stamps.length && (clock - stamps[0].born >= LIFE || stamps.length > MARKS - 70)) stamps.shift();

        // Tiles under the screen (and the next one down) are asked for.
        const top = scroll + start * tileH;
        const first = Math.floor(top / tileH);
        const lastTile = Math.floor((top + h) / tileH);
        const tileCount = FOREST.tiles;
        for (let k = first; k <= lastTile + 1; k++) ask(((k % tileCount) + tileCount) % tileCount);
        for (const t of tiles) {
          if (t.shade && t.height && t.ready < 1) {
            t.ready = Math.min(1, t.ready + dt / 0.5);
            dirty = true;
          }
        }

        // Nothing risen: the canvas is cleared once and left alone.
        if (presence === 0 && !stamps.length) {
          if (!blank) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT);
            blank = true;
          }
          return;
        }
        const still = !stamps.length && Math.abs(hx - drawn.x) + Math.abs(head.y - drawn.y) < 0.05 && Math.abs(presence - drawn.presence) < 0.0005 && scroll === drawn.scroll;
        if (still && !dirty) return;
        dirty = false;
        blank = false;
        drawn.x = hx;
        drawn.y = head.y;
        drawn.presence = presence;
        drawn.scroll = scroll;
        if (!target) return;

        // ---- Pass 1: the reveal texture.
        count = 0;
        let bx0 = Infinity;
        let by0 = Infinity;
        let bx1 = -Infinity;
        let by1 = -Infinity;
        const stamp = (x: number, y: number, r: number, level: number) => {
          if (level < 0.004 || y + r < 0 || y - r > h || x + r < 0 || x - r > w) return;
          put(x - r, y - r, x + r, y + r, -1, -1, 1, 1, level, 0);
          bx0 = Math.min(bx0, x - r);
          by0 = Math.min(by0, y - r);
          bx1 = Math.max(bx1, x + r);
          by1 = Math.max(by1, y + r);
        };
        stamp(head.x, head.y, radius, presence);
        for (const s of stamps) stamp(s.x, s.y - scroll, radius * 0.94, s.level * (1 - smooth(0.5, LIFE, clock - s.born)));
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        gl.viewport(0, 0, target.w, target.h);
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (!count) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.viewport(0, 0, canvas.width, canvas.height);
          gl.clear(gl.COLOR_BUFFER_BIT);
          return;
        }
        // Stamps join by their strongest, not their sum.
        if (minmax) gl.blendEquation(minmax.MAX_EXT);
        gl.blendFunc(gl.ONE, minmax ? gl.ONE : gl.ONE_MINUS_SRC_COLOR);
        gl.useProgram(stampProg);
        gl.colorMask(true, false, false, false);
        drawMarks(s$);

        const feather = Math.min(56, Math.max(36, w * 0.032));
        const pad = feather * 0.3;
        count = 0;
        for (const el of near) {
          const b = blocks.get(el);
          if (!b) continue;
          const box = el.getBoundingClientRect();
          const x0 = box.left + b.ox - pad;
          const y0 = box.top + b.oy - pad;
          const x1 = x0 + b.w + pad * 2;
          const y1 = y0 + b.h + pad * 2;
          if (x1 + feather < bx0 || x0 - feather > bx1 || y1 + feather < by0 || y0 - feather > by1) continue;
          const hw = (x1 - x0) / 2;
          const hh = (y1 - y0) / 2;
          put(x0 - feather, y0 - feather, x1 + feather, y1 + feather, -hw - feather, -hh - feather, hw + feather, hh + feather, hw, hh);
        }
        if (count) {
          gl.useProgram(clearProg);
          gl.uniform1f(c$.feather, feather);
          gl.colorMask(false, true, false, false);
          drawMarks(c$);
        }
        gl.colorMask(true, true, true, true);
        if (minmax) gl.blendEquation(gl.FUNC_ADD);

        // ---- Pass 2: the wall, only where something is risen.
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        if (glowProg && g$) {
          gl.useProgram(glowProg);
          gl.enableVertexAttribArray(g$.aPos);
          gl.vertexAttribPointer(g$.aPos, 2, gl.FLOAT, false, 0, 0);
          gl.uniform2f(g$.res, w, h);
          gl.uniform4f(g$.rect, 0, 0, w, h);
          const reach = Math.max(w, h) * 0.42;
          gl.uniform3f(g$.glow, head.x / w, 1 - head.y / h, presence);
          gl.uniform2f(g$.reach, reach / w, reach / h);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        bx0 = Math.max(0, bx0);
        by0 = Math.max(0, by0);
        bx1 = Math.min(w, bx1);
        by1 = Math.min(h, by1);
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(Math.floor(bx0 * dpr), Math.floor((h - by1) * dpr), Math.ceil((bx1 - bx0) * dpr) + 1, Math.ceil((by1 - by0) * dpr) + 1);
        gl.useProgram(wallProg);
        gl.enableVertexAttribArray(w$.aPos);
        gl.vertexAttribPointer(w$.aPos, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(w$.res, w, h);
        gl.uniform2f(w$.step, radius / 12 / w, radius / 12 / h);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, target.tex);
        const x0 = (w - world) / 2;
        for (let k = first; k <= lastTile; k++) {
          const y = k * tileH - top;
          if (y + tileH < by0 || y > by1) continue;
          const t = tiles[((k % tileCount) + tileCount) % tileCount];
          if (!t.shade || !t.height) continue;
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, t.shade);
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, t.height);
          gl.uniform4f(w$.rect, x0, y, world, tileH);
          gl.uniform4f(w$.vmap, t.sv[0], t.sv[1], t.hv[0], t.hv[1]);
          gl.uniform1f(w$.ready, t.ready);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        gl.disable(gl.SCISSOR_TEST);
      };
      raf = requestAnimationFrame(frame);

      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        cancelAnimationFrame(uploading);
        clearTimeout(debounce);
        collecting?.();
        io.disconnect();
        ro.disconnect();
        pageWatch.disconnect();
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("pointerdown", onPointer);
        window.removeEventListener("touchstart", onTouch);
        window.removeEventListener("touchmove", onTouch);
        html.removeEventListener("mouseleave", onLeave);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        canvas.remove();
      };
    }

    return () => {
      cancelled = true;
      mo.disconnect();
      pending?.();
      stop?.();
    };
  }, [theme, waitForIntro, start]);

  return <div ref={root} className={`relief relief--${theme}`} aria-hidden="true" />;
}
