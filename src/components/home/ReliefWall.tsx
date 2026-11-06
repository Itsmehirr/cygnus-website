"use client";

import { useEffect, useRef } from "react";

/** One relief on the wall, placed against a section of the page. */
export type Relief = {
  /** Shading map: grey, 128 = flat wall (see scripts/relief.py). */
  src: string;
  /** Width / height of the map. */
  aspect: number;
  /** The section it belongs to (a selector). */
  anchor: string;
  /** Centre across the screen, in vw. */
  x: number;
  /** Centre against the section's centre, in vh, when the section is centred. */
  y: number;
  /** Width, in vw (phones take 1.7 times as much). */
  w: number;
  /** How much it lags the page: 0 moves with it, 0.3 trails by 30 %. */
  depth: number;
  rot?: number;
  flip?: boolean;
  /** Strength of the carving, 0–1 (lighter behind text). Default 1. */
  amount?: number;
  /** Placement on phones (under 720 px), where it differs. */
  phone?: { x?: number; y?: number; w?: number };
  seed: number;
};

const VERT = `
attribute vec2 a_pos;
uniform vec2 u_res;
uniform vec2 u_center;
uniform vec2 u_size;
uniform float u_rot;
uniform float u_flip;
varying vec2 v_uv;
void main() {
  vec2 p = (a_pos - 0.5) * u_size;
  float c = cos(u_rot), s = sin(u_rot);
  p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + u_center;
  gl_Position = vec4(p.x / u_res.x * 2.0 - 1.0, 1.0 - p.y / u_res.y * 2.0, 0.0, 1.0);
  v_uv = vec2(u_flip > 0.5 ? 1.0 - a_pos.x : a_pos.x, a_pos.y);
}`;

/* The relief rises out of the wall: from its heart outward, through a noisy
   front, deepening as it comes. Shadows are laid on in a warm umber, lights
   in warm white, so the stone's own grain stays visible through both. */
const FRAG = `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_rise;
uniform float u_amount;
uniform float u_seed;
varying vec2 v_uv;
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
  float n = fbm(v_uv * 3.4 + u_seed);
  float r = length(v_uv - 0.5);
  float field = (1.0 - r * 1.3) * 0.55 + n * 0.45;
  float thr = mix(1.05, -0.25, u_rise);
  float m = smoothstep(thr, thr + 0.22, field);
  float k = m * (0.35 + 0.65 * u_rise) * u_amount;
  float dark = clamp(-g * 1.75 * k, 0.0, 0.85);
  float light = clamp(g * 1.5 * k, 0.0, 0.7);
  gl_FragColor = g < 0.0 ? vec4(vec3(0.36, 0.29, 0.21) * dark, dark) : vec4(vec3(1.0, 0.995, 0.98) * light, light);
}`;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Immersive Garden's sculpted wall, on the house's stone: plaster motifs that
 * rise out of the ground as their section arrives, drift behind the page at
 * their own pace, and sink back as it leaves. One fixed WebGL layer under the
 * content; it waits for the opening to finish. Without WebGL, nothing shows.
 */
export function ReliefWall({ reliefs }: { reliefs: Relief[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const html = document.documentElement;
    let stop: (() => void) | undefined;
    let cancelled = false;
    let pending: (() => void) | undefined;

    // Nothing is set up until the opening has finished and the browser is idle,
    // so the wall costs the first load nothing.
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
    const mo = new MutationObserver(() => {
      if (html.classList.contains("is-ready")) begin();
    });
    if (html.classList.contains("is-ready")) begin();
    else mo.observe(html, { attributes: true, attributeFilter: ["class"] });

    function start(host: HTMLDivElement): (() => void) | undefined {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
      if (!gl) return;
      host.appendChild(canvas);

      const compile = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        canvas.remove();
        return;
      }
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(prog, "a_pos");
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      const u = (name: string) => gl.getUniformLocation(prog, name);
      const uRes = u("u_res"), uCenter = u("u_center"), uSize = u("u_size"), uRot = u("u_rot"), uFlip = u("u_flip"), uRise = u("u_rise"), uAmount = u("u_amount"), uSeed = u("u_seed");
      gl.uniform1i(u("u_tex"), 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);

      // One texture per map, shared by every relief that uses it; phones take
      // a smaller cut. Pictures decode off the main thread, then go to the GPU
      // one per frame, in the order they appear down the page, so no single
      // moment carries all the uploads.
      const small = window.innerWidth < 720;
      const variant = (src: string) => (small ? src.replace(/\.webp$/, "-s.webp") : src);
      const textures = new Map<string, WebGLTexture | null>();
      const queue: { src: string; img: HTMLImageElement }[] = [];
      let disposed = false;
      let uploading = 0;
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
        textures.set(next.src, tex);
        dirty = true;
        if (queue.length) uploading = requestAnimationFrame(upload);
      };
      const order = [...new Set(reliefs.map((r) => r.src))];
      const decoded = new Map<string, HTMLImageElement | null>();
      let nextIndex = 0;
      // Queue maps in page order as soon as everything before them is in;
      // a map that fails to load is skipped.
      const advance = () => {
        while (nextIndex < order.length && decoded.has(order[nextIndex])) {
          const img = decoded.get(order[nextIndex]);
          if (img) queue.push({ src: order[nextIndex], img });
          nextIndex++;
        }
        if (queue.length && !uploading) uploading = requestAnimationFrame(upload);
      };
      for (const src of order) {
        textures.set(src, null);
        const img = new Image();
        img.decoding = "async";
        (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "low";
        img.src = variant(src);
        img
          .decode()
          .then(() => {
            if (disposed) return;
            decoded.set(src, img);
            advance();
          })
          .catch(() => {
            if (disposed) return;
            decoded.set(src, null);
            advance();
          });
      }

      // Sections are measured once (and again whenever the page's size changes),
      // never per frame, so drawing the wall forces no layout while scrolling.
      const items = reliefs.map((r) => ({ ...r, el: document.querySelector<HTMLElement>(r.anchor), rise: 0, top: 0, h: 0 }));
      const html = document.documentElement;
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
      let global = 0;
      let dirty = true;
      measure();
      let lastY = -1;
      let w = 0;
      let h = 0;
      let raf = 0;
      let last = performance.now();

      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
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
        // The wall waits for the opening, then comes up over 1.6 s.
        const g = html.classList.contains("is-ready") ? 1 : 0;
        if (global !== g) {
          global = g > global ? Math.min(1, global + dt / 1.6) : 0;
          dirty = true;
        }
        const ease = 1 - Math.exp(-dt * 2.2);
        const placed: { it: (typeof items)[number]; cx: number; cy: number; sw: number; sh: number }[] = [];
        for (const it of items) {
          if (!it.el) continue;
          const top = it.top - lastY;
          const centre = top + it.h / 2;
          const small = vw < 720;
          const ph = small ? it.phone : undefined;
          const sw = (vw * (ph?.w ?? it.w * (small ? 1.7 : 1))) / 100;
          const sh = sw / it.aspect;
          const cx = (vw * (ph?.x ?? it.x)) / 100;
          const cy = centre + (vh * (ph?.y ?? it.y)) / 100 - (centre - vh / 2) * it.depth;
          // Rises as its section nears the centre, sinks back as it leaves.
          const dist = Math.abs(centre - vh / 2) / (vh / 2 + it.h / 2);
          const target = 1 - smooth(0.38, 0.95, dist);
          if (Math.abs(target - it.rise) > 0.001) {
            it.rise += (target - it.rise) * ease;
            dirty = true;
          }
          if (cy + sh / 2 < -60 || cy - sh / 2 > vh + 60) continue;
          placed.push({ it, cx, cy, sw, sh });
        }
        if (!dirty) return;
        dirty = false;
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(uRes, vw, vh);
        for (const { it, cx, cy, sw, sh } of placed) {
          const rise = it.rise * global;
          const tex = textures.get(it.src);
          if (!tex || rise < 0.004) continue;
          // A little growth as it rises, as if pushed through from behind.
          const grow = 0.94 + 0.06 * rise;
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.uniform2f(uCenter, cx, cy);
          gl.uniform2f(uSize, sw * grow, sh * grow);
          gl.uniform1f(uRot, ((it.rot ?? 0) * Math.PI) / 180);
          gl.uniform1f(uFlip, it.flip ? 1 : 0);
          gl.uniform1f(uRise, rise);
          gl.uniform1f(uAmount, it.amount ?? 1);
          gl.uniform1f(uSeed, it.seed);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      };
      raf = requestAnimationFrame(frame);
      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        cancelAnimationFrame(uploading);
        ro.disconnect();
        window.removeEventListener("load", measure);
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
  }, [reliefs]);

  return <div ref={root} className="relief" aria-hidden="true" />;
}
