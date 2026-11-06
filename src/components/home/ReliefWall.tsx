"use client";

import { useEffect, useRef } from "react";

/** One relief on the wall. */
export type Relief = {
  /** Shading map: grey, 128 = flat wall (see scripts/relief.py). Its -h map
   *  (height) and -s cuts (phones) sit beside it. */
  src: string;
  /** Width / height of the map. */
  aspect: number;
  /** The section it belongs to (a selector). Without one, the relief is fixed
   *  to the screen: x and y are then in vw and vh from the top left. */
  anchor?: string;
  /** Centre across the screen, in vw. */
  x: number;
  /** Centre against the section's centre, in vh, when the section is centred
   *  (or from the top of the screen, without an anchor). */
  y: number;
  /** Width, in vw (phones take 1.7 times as much). */
  w: number;
  /** Nearness: how much it lags the scroll (0 moves with the page, 0.3 trails
   *  by 30 %) and how far it leans with the cursor. */
  depth: number;
  rot?: number;
  flip?: boolean;
  /** Strength of the carving, 0–1 (lighter behind text). Default 1. */
  amount?: number;
  /** Placement on phones (under 720 px), where it differs; hide leaves it out. */
  phone?: { x?: number; y?: number; w?: number; hide?: boolean };
  seed: number;
};

type Theme = "light" | "dark";

const VERT = `
attribute vec2 a_pos;
uniform vec2 u_res;
uniform vec2 u_center;
uniform vec2 u_size;
// Shared with the fragment shader, so declared at its precision.
uniform mediump float u_rot;
uniform mediump float u_flip;
varying vec2 v_uv;
varying vec2 v_px;
void main() {
  vec2 p = (a_pos - 0.5) * u_size;
  float c = cos(u_rot), s = sin(u_rot);
  p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + u_center;
  v_px = p;
  gl_Position = vec4(p.x / u_res.x * 2.0 - 1.0, 1.0 - p.y / u_res.y * 2.0, 0.0, 1.0);
  v_uv = vec2(u_flip > 0.5 ? 1.0 - a_pos.x : a_pos.x, a_pos.y);
}`;

/* The relief rises out of the wall from its heart outward, through a noisy
   front. Its baked shading is laid on the ground (shadow in one colour, light
   in another, so the stone's own grain shows through both), and a light that
   follows the cursor relights it: a pool that deepens the carving near the
   pointer, a raking term from the height map's normals, and a glint on the
   forms that face it. On the dark wall the glints turn faintly iridescent. */
const FRAG = `
precision mediump float;
uniform sampler2D u_tex;
uniform sampler2D u_height;
uniform vec2 u_texel;
uniform float u_rise;
uniform float u_amount;
uniform float u_seed;
uniform float u_rot;
uniform float u_flip;
uniform vec3 u_light;
uniform float u_radius;
uniform float u_bump;
uniform vec4 u_k;
uniform vec3 u_shadow;
uniform vec3 u_lit;
uniform vec2 u_max;
uniform float u_iri;
uniform float u_deepen;
varying vec2 v_uv;
varying vec2 v_px;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
void main() {
  float g = texture2D(u_tex, v_uv).r - 0.5;
  float h = texture2D(u_height, v_uv).r;
  float hx = texture2D(u_height, v_uv + vec2(u_texel.x, 0.0)).r - texture2D(u_height, v_uv - vec2(u_texel.x, 0.0)).r;
  float hy = texture2D(u_height, v_uv + vec2(0.0, u_texel.y)).r - texture2D(u_height, v_uv - vec2(0.0, u_texel.y)).r;
  vec2 grad = vec2(u_flip > 0.5 ? -hx : hx, hy);
  float c = cos(u_rot), s = sin(u_rot);
  grad = vec2(c * grad.x - s * grad.y, s * grad.x + c * grad.y);
  // Slopes are capped so a ragged outline can't turn edge-on to the light.
  vec3 n = normalize(vec3(clamp(-grad * u_bump, -1.1, 1.1), 1.0));

  vec3 lv = vec3(u_light.xy - v_px, u_light.z);
  float d = length(lv.xy) / u_radius;
  float att = 1.0 / (1.0 + d * d);
  vec3 l = normalize(lv);
  float rake = max(dot(n, l), 0.0) - l.z;
  rake = rake < 0.0 ? rake * 0.35 : rake;
  float spec = pow(max(dot(n, normalize(l + vec3(0.0, 0.0, 1.0))), 0.0), 40.0) * smoothstep(0.03, 0.12, h);

  float field = (1.0 - length(v_uv - 0.5) * 1.3) * 0.55 + fbm(v_uv * 3.4 + u_seed) * 0.45;
  float thr = mix(1.05, -0.25, u_rise);
  float m = smoothstep(thr, thr + 0.22, field) * (0.35 + 0.65 * u_rise) * u_amount;

  // The pool deepens the carving itself; shadows cast on the flat wall keep
  // their daylight strength, so the light never smudges the ground.
  float onRelief = smoothstep(0.03, 0.15, h);
  float pool = u_k.x + u_k.y * att * (g > 0.0 ? 1.0 : onRelief * u_deepen);
  float sh = (g * pool + rake * att * u_k.z + spec * att * u_k.w) * m;
  float dark = clamp(-sh * 1.75, 0.0, u_max.x);
  float light = clamp(sh * 1.5, 0.0, u_max.y);
  vec3 iri = 0.5 + 0.5 * cos(6.2831 * (atan(n.y, n.x) / 6.2831 + vec3(0.0, 0.33, 0.67)));
  vec3 lit = mix(u_lit, iri, clamp(spec * att * 2.0, 0.0, 1.0) * u_iri);
  gl_FragColor = sh < 0.0 ? vec4(u_shadow * dark, dark) : vec4(lit * light, light);
}`;

/* The dark wall's own light: a soft chartreuse-white pool under the cursor. */
const GLOW = `
precision mediump float;
uniform vec3 u_light;
uniform float u_radius;
uniform float u_strength;
varying vec2 v_px;
void main() {
  float d = length(v_px - u_light.xy) / u_radius;
  float a = (exp(-d * d * 1.1) * 0.12 + exp(-d * d * 4.0) * 0.06) * u_strength;
  gl_FragColor = vec4(vec3(0.8, 0.83, 0.64) * a, a);
}`;

const THEMES: Record<Theme, { k: [number, number, number, number]; shadow: [number, number, number]; lit: [number, number, number]; max: [number, number]; iri: number; bump: number; deepen: number }> = {
  // Plaster on the warm stone: the carving keeps its daylight, the cursor
  // deepens it and rakes across it.
  light: { k: [0.85, 0.95, 0.45, 0.22], shadow: [0.36, 0.29, 0.21], lit: [1, 0.995, 0.98], max: [0.88, 0.75], iri: 0, bump: 16, deepen: 1 },
  // Dark stone: the carving barely shows until the light finds it.
  dark: { k: [0.22, 1.35, 0.42, 0.34], shadow: [0, 0, 0], lit: [0.93, 0.94, 0.84], max: [0.8, 0.85], iri: 0.35, bump: 14, deepen: 0.35 },
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Immersive Garden's sculpted wall: plaster motifs that rise out of the ground
 * as their section arrives, drift behind the page at their own pace and sink
 * back as it leaves; a light follows the cursor across them and they lean a
 * little towards it. On a touch screen (and on the dark wall when nobody
 * moves) the light wanders slowly on its own. One fixed WebGL layer under the
 * content; without WebGL, nothing shows.
 *
 * theme "light" lays the carving onto the Home stone; "dark" carves it in the
 * Menu's charcoal. waitForIntro holds the wall until the Home opening is done.
 */
export function ReliefWall({ reliefs, theme = "light", waitForIntro = true }: { reliefs: Relief[]; theme?: Theme; waitForIntro?: boolean }) {
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
        if (!cancelled) stop = start(host);
      });
    };
    const ready = () => !waitForIntro || html.classList.contains("is-ready");
    const mo = new MutationObserver(() => {
      if (ready()) begin();
    });
    if (ready()) begin();
    else mo.observe(html, { attributes: true, attributeFilter: ["class"] });

    function start(host: HTMLDivElement): (() => void) | undefined {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
      if (!gl) return;
      host.appendChild(canvas);
      const look = THEMES[theme];

      const compile = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };
      const link = (frag: string) => {
        const p = gl.createProgram()!;
        gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
        gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag));
        gl.linkProgram(p);
        if (gl.getProgramParameter(p, gl.LINK_STATUS)) return p;
        console.warn("[relief wall]", gl.getProgramInfoLog(p));
        return null;
      };
      const prog = link(FRAG);
      const glowProg = theme === "dark" ? link(GLOW) : null;
      if (!prog) {
        canvas.remove();
        return;
      }
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);

      const uniforms = (p: WebGLProgram) => {
        const at = (name: string) => gl.getUniformLocation(p, name);
        return { at, aPos: gl.getAttribLocation(p, "a_pos") };
      };
      const U = uniforms(prog);
      const u = {
        res: U.at("u_res"), center: U.at("u_center"), size: U.at("u_size"), rot: U.at("u_rot"), flip: U.at("u_flip"),
        rise: U.at("u_rise"), amount: U.at("u_amount"), seed: U.at("u_seed"), texel: U.at("u_texel"),
        light: U.at("u_light"), radius: U.at("u_radius"), bump: U.at("u_bump"), k: U.at("u_k"),
        shadow: U.at("u_shadow"), lit: U.at("u_lit"), max: U.at("u_max"), iri: U.at("u_iri"),
      };
      gl.useProgram(prog);
      gl.uniform1i(U.at("u_tex"), 0);
      gl.uniform1i(U.at("u_height"), 1);
      gl.uniform4f(u.k, ...look.k);
      gl.uniform3f(u.shadow, ...look.shadow);
      gl.uniform3f(u.lit, ...look.lit);
      gl.uniform2f(u.max, ...look.max);
      gl.uniform1f(u.iri, look.iri);
      gl.uniform1f(u.bump, look.bump);
      gl.uniform1f(U.at("u_deepen"), look.deepen);
      const G = glowProg ? uniforms(glowProg) : null;
      const g = G
        ? { res: G.at("u_res"), center: G.at("u_center"), size: G.at("u_size"), rot: G.at("u_rot"), flip: G.at("u_flip"), light: G.at("u_light"), radius: G.at("u_radius"), strength: G.at("u_strength") }
        : null;

      // Two maps per relief (shading, height), shared by every relief that
      // uses them; phones take smaller cuts. Pictures decode off the main
      // thread, then go to the GPU one per frame in page order.
      const small = window.innerWidth < 720;
      const file = (src: string, kind: "shade" | "height") => {
        const base = kind === "height" ? src.replace(/\.webp$/, "-h.webp") : src;
        return small ? base.replace(/\.webp$/, "-s.webp") : base;
      };
      type Maps = { shade: WebGLTexture | null; height: WebGLTexture | null; w: number; h: number };
      const maps = new Map<string, Maps>();
      const queue: { src: string; kind: "shade" | "height"; img: HTMLImageElement }[] = [];
      let disposed = false;
      let uploading = 0;
      let dirty = true;
      const upload = () => {
        uploading = 0;
        const next = queue.shift();
        if (!next || disposed) return;
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        // RGBA keeps Chrome on its fast upload path (no per-pixel conversion).
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, next.img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const m = maps.get(next.src)!;
        m[next.kind] = tex;
        if (next.kind === "height") {
          m.w = next.img.naturalWidth;
          m.h = next.img.naturalHeight;
        }
        dirty = true;
        if (queue.length) uploading = requestAnimationFrame(upload);
      };
      const order = [...new Set(reliefs.map((r) => r.src))].flatMap((src) => [
        { src, kind: "shade" as const },
        { src, kind: "height" as const },
      ]);
      const decoded = new Map<string, HTMLImageElement | null>();
      const key = (o: { src: string; kind: string }) => `${o.src}|${o.kind}`;
      let nextIndex = 0;
      // Queue maps in page order as soon as everything before them is in; a
      // map that fails to load is skipped.
      const advance = () => {
        while (nextIndex < order.length && decoded.has(key(order[nextIndex]))) {
          const o = order[nextIndex];
          const img = decoded.get(key(o));
          if (img) queue.push({ ...o, img });
          nextIndex++;
        }
        if (queue.length && !uploading) uploading = requestAnimationFrame(upload);
      };
      for (const o of order) {
        if (!maps.has(o.src)) maps.set(o.src, { shade: null, height: null, w: 1, h: 1 });
        const img = new Image();
        img.decoding = "async";
        (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "low";
        img.src = file(o.src, o.kind);
        img
          .decode()
          .then(() => {
            if (disposed) return;
            decoded.set(key(o), img);
            advance();
          })
          .catch(() => {
            if (disposed) return;
            decoded.set(key(o), null);
            advance();
          });
      }

      // Sections are measured once (and again whenever the page's size
      // changes), never per frame, so drawing the wall forces no layout.
      const items = reliefs.map((r) => ({
        ...r,
        el: r.anchor ? document.querySelector<HTMLElement>(r.anchor) : null,
        rise: 0,
        top: 0,
        h: 0,
        ox: 0,
        oy: 0,
      }));
      const measure = () => {
        const y = window.scrollY;
        for (const it of items) {
          if (!it.el) continue;
          const r = it.el.getBoundingClientRect();
          it.top = r.top + y;
          it.h = r.height;
        }
        dirty = true;
      };
      const ro = new ResizeObserver(measure);
      ro.observe(document.body);
      window.addEventListener("load", measure);
      measure();

      // The light: follows a fine pointer; on touch, or on the dark wall
      // after a few still seconds, it wanders on its own.
      const fine = window.matchMedia("(pointer: fine)").matches;
      const pointer = { x: window.innerWidth * (theme === "dark" ? 0.5 : 0.72), y: window.innerHeight * (theme === "dark" ? 0.45 : 0.28), seen: false, still: 0 };
      const lightPos = { x: pointer.x, y: pointer.y };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.seen = true;
        pointer.still = 0;
      };
      window.addEventListener("pointermove", onMove, { passive: true });

      let global = 0;
      let lastY = -1;
      let w = 0;
      let h = 0;
      let raf = 0;
      let last = performance.now();
      let clock = 0;

      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        clock += dt;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        if (vw !== w || vh !== h) {
          w = vw;
          h = vh;
          const dpr = Math.min(window.devicePixelRatio || 1, vw < 720 ? 1.25 : 1.5);
          canvas.width = Math.round(vw * dpr);
          canvas.height = Math.round(vh * dpr);
          gl.viewport(0, 0, canvas.width, canvas.height);
          dirty = true;
        }
        if (window.scrollY !== lastY) {
          lastY = window.scrollY;
          dirty = true;
        }
        // The wall waits for its page, then comes up over 1.6 s.
        const g0 = ready() ? 1 : 0;
        if (global !== g0) {
          global = g0 > global ? Math.min(1, global + dt / 1.6) : 0;
          dirty = true;
        }

        // Where the light wants to be.
        pointer.still += dt;
        let tx = pointer.x;
        let ty = pointer.y;
        const wander = !fine || !pointer.seen || (theme === "dark" && pointer.still > 4);
        if (wander) {
          tx = vw * (0.5 + Math.sin(clock * 0.21) * 0.32);
          ty = vh * (0.45 + Math.cos(clock * 0.17) * 0.28);
        }
        const follow = 1 - Math.exp(-dt * (wander ? 1.2 : 7));
        const mx = (tx - lightPos.x) * follow;
        const my = (ty - lightPos.y) * follow;
        if (Math.abs(mx) + Math.abs(my) > 0.05) {
          lightPos.x += mx;
          lightPos.y += my;
          dirty = true;
        }
        // The reliefs lean a little towards the light: nearer ones further.
        const nx = (lightPos.x / vw - 0.5) * 2;
        const ny = (lightPos.y / vh - 0.5) * 2;

        const ease = 1 - Math.exp(-dt * 2.2);
        const lean = 1 - Math.exp(-dt * 4);
        const placed: { it: (typeof items)[number]; cx: number; cy: number; sw: number; sh: number }[] = [];
        for (const it of items) {
          const small = vw < 720;
          const ph = small ? it.phone : undefined;
          if (ph?.hide) continue;
          const sw = (vw * (ph?.w ?? it.w * (small ? 1.7 : 1))) / 100;
          const sh = sw / it.aspect;
          let cy: number;
          let target = 1;
          if (it.el) {
            const top = it.top - lastY;
            const centre = top + it.h / 2;
            cy = centre + (vh * (ph?.y ?? it.y)) / 100 - (centre - vh / 2) * it.depth;
            // Rises as its section nears the centre, sinks back as it leaves.
            const dist = Math.abs(centre - vh / 2) / (vh / 2 + it.h / 2);
            target = 1 - smooth(0.38, 0.95, dist);
          } else {
            cy = (vh * (ph?.y ?? it.y)) / 100;
          }
          if (Math.abs(target - it.rise) > 0.001) {
            it.rise += (target - it.rise) * ease;
            dirty = true;
          }
          const reach = 10 + 22 * it.depth;
          const ox = -nx * reach;
          const oy = -ny * reach * 0.7;
          if (Math.abs(ox - it.ox) + Math.abs(oy - it.oy) > 0.05) {
            it.ox += (ox - it.ox) * lean;
            it.oy += (oy - it.oy) * lean;
            dirty = true;
          }
          const cx = (vw * (ph?.x ?? it.x)) / 100 + it.ox;
          cy += it.oy;
          if (cy + sh / 2 < -60 || cy - sh / 2 > vh + 60) continue;
          placed.push({ it, cx, cy, sw, sh });
        }
        if (!dirty) return;
        dirty = false;
        gl.clear(gl.COLOR_BUFFER_BIT);
        const lz = Math.min(vw, vh) * 0.32;
        const radius = Math.max(vw, vh) * 0.3;

        if (glowProg && g && G) {
          gl.useProgram(glowProg);
          gl.enableVertexAttribArray(G.aPos);
          gl.vertexAttribPointer(G.aPos, 2, gl.FLOAT, false, 0, 0);
          gl.uniform2f(g.res, vw, vh);
          gl.uniform2f(g.center, vw / 2, vh / 2);
          gl.uniform2f(g.size, vw, vh);
          gl.uniform1f(g.rot, 0);
          gl.uniform1f(g.flip, 0);
          gl.uniform3f(g.light, lightPos.x, lightPos.y, lz);
          gl.uniform1f(g.radius, Math.max(vw, vh) * 0.42);
          gl.uniform1f(g.strength, global);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        gl.useProgram(prog);
        gl.enableVertexAttribArray(U.aPos);
        gl.vertexAttribPointer(U.aPos, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(u.res, vw, vh);
        gl.uniform3f(u.light, lightPos.x, lightPos.y, lz);
        gl.uniform1f(u.radius, radius);
        for (const { it, cx, cy, sw, sh } of placed) {
          const rise = it.rise * global;
          const m = maps.get(it.src);
          if (!m || !m.shade || !m.height || rise < 0.004) continue;
          // A little growth as it rises, as if pushed through from behind.
          const grow = 0.94 + 0.06 * rise;
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, m.shade);
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, m.height);
          // Normals from a 1.5-texel stencil: smoother along ragged outlines.
          gl.uniform2f(u.texel, 1.5 / m.w, 1.5 / m.h);
          gl.uniform2f(u.center, cx, cy);
          gl.uniform2f(u.size, sw * grow, sh * grow);
          gl.uniform1f(u.rot, ((it.rot ?? 0) * Math.PI) / 180);
          gl.uniform1f(u.flip, it.flip ? 1 : 0);
          gl.uniform1f(u.rise, rise);
          gl.uniform1f(u.amount, it.amount ?? 1);
          gl.uniform1f(u.seed, it.seed);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        // The wandering light never settles, so keep drawing while it moves.
        if (wander && placed.length) dirty = true;
      };
      raf = requestAnimationFrame(frame);

      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        cancelAnimationFrame(uploading);
        ro.disconnect();
        window.removeEventListener("load", measure);
        window.removeEventListener("pointermove", onMove);
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
  }, [reliefs, theme, waitForIntro]);

  return <div ref={root} className={`relief relief--${theme}`} aria-hidden="true" />;
}
