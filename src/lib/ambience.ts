/**
 * The site's sound: one soft, looping ambience (public/media/ambience.mp3,
 * rendered by scripts/ambience.py), off until the visitor lets it in.
 *
 * - On a desktop the cursor says "Click to enable sound" and the first click
 *   anywhere switches it on, as on immersive-g.com. On touch screens, and on
 *   the pages without that cursor, only the Sound switch does.
 * - The choice is remembered for the session. A page loaded with sound on
 *   waits for the first click or key (browsers do not let audio start alone);
 *   until then the switch reads Off, and pressing it lets the sound in.
 * - The track's last seconds are crossfaded into its first (equal power), so
 *   it loops without a seam; switching on fades in, switching off fades out,
 *   and a hidden tab rests.
 *
 * One instance for the whole site, kept outside React so it plays on through
 * navigation.
 */

export type SoundState = {
  /** Sound is wanted: switched on by the visitor (or by their first click). */
  on: boolean;
  /** Sound is coming out. */
  playing: boolean;
  /** The visitor has decided this session; nothing switches itself on after that. */
  chosen: boolean;
  /** Wanted, but the browser is waiting for a click or a key before it lets audio start. */
  waiting: boolean;
};

const TRACK = {
  src: "/media/ambience.mp3",
  /** Seconds of the track's end laid over its start. */
  cross: 6,
  /** Output level: a background, not a soundtrack. */
  level: 0.55,
  /** On phones and tablets, 3 dB more: their speakers lose the low half of
   *  the pad, which measures as 2 to 5 dB of its loudness. */
  small: 0.78,
};
const level = () => (typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches ? TRACK.small : TRACK.level);
const KEY = "cygnus-sound";
const SERVER: SoundState = { on: false, playing: false, chosen: false, waiting: false };

let state: SoundState = SERVER;
const listeners = new Set<() => void>();
const set = (patch: Partial<SoundState>) => {
  const next = { ...state, ...patch };
  if (next.on === state.on && next.playing === state.playing && next.chosen === state.chosen && next.waiting === state.waiting) return;
  state = next;
  listeners.forEach((l) => l());
};

export const subscribeSound = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const getSound = () => state;
export const getServerSound = () => SERVER;

// ---- The audio graph: passes of the track -> master gain -> meter -> out.

type Pass = { source: AudioBufferSourceNode; gain: GainNode; at: number };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let meter: AnalyserNode | null = null;
let buffer: AudioBuffer | null = null;
let loading: Promise<void> | null = null;
let passes: Pass[] = [];
let running = false;
let resting = 0;
let armed = false;

/** An equal-power fade over the crossfade, drawn as a dozen short ramps
 *  (plain ramps behave the same in every browser; value curves do not). */
const fade = (gain: AudioParam, at: number, rise: boolean) => {
  const steps = 12;
  gain.setValueAtTime(rise ? 0 : 1, at);
  for (let i = 1; i <= steps; i++) {
    const x = ((i / steps) * Math.PI) / 2;
    gain.linearRampToValueAtTime(rise ? Math.sin(x) : Math.cos(x), at + (i / steps) * TRACK.cross);
  }
};

const context = () => {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC({ latencyHint: "playback" });
  } catch {
    return null;
  }
  master = ctx.createGain();
  master.gain.value = 0;
  meter = ctx.createAnalyser();
  meter.fftSize = 2048;
  master.connect(meter);
  meter.connect(ctx.destination);
  ctx.onstatechange = go;
  return ctx;
};

const load = async () => {
  const c = context();
  if (!c) throw new Error("no audio");
  const res = await fetch(TRACK.src);
  if (!res.ok) throw new Error(`ambience ${res.status}`);
  const data = await res.arrayBuffer();
  // The callback form: Safari before 14.1 has no promise here.
  buffer = await new Promise<AudioBuffer>((done, fail) => c.decodeAudioData(data, done, fail));
};

/** The master level's last fade. Where the level stands mid-fade is worked
 *  out from this, not read back from the browser: not every browser reports
 *  a level that is on its way somewhere, and a wrong reading would click. */
let ramp = { from: 0, to: 0, t0: 0, t1: 0 };

const fadeTo = (level: number, seconds: number) => {
  if (!ctx || !master) return;
  const now = ctx.currentTime;
  const from = now >= ramp.t1 ? ramp.to : now <= ramp.t0 ? ramp.from : ramp.from + (ramp.to - ramp.from) * ((now - ramp.t0) / (ramp.t1 - ramp.t0));
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(from, now);
  master.gain.linearRampToValueAtTime(level, now + seconds);
  ramp = { from, to: level, t0: now, t1: now + seconds };
};

/** One pass of the track from `at`; every pass after the first rises out of
 *  the one before it, and each gives way to the next over its last seconds. */
const pass = (at: number, rise: boolean) => {
  const c = ctx!;
  const b = buffer!;
  const source = c.createBufferSource();
  source.buffer = b;
  const gain = c.createGain();
  gain.gain.value = rise ? 0 : 1;
  if (rise) fade(gain.gain, at, true);
  fade(gain.gain, at + b.duration - TRACK.cross, false);
  source.connect(gain);
  gain.connect(master!);
  source.start(at);
  const p: Pass = { source, gain, at };
  passes.push(p);
  source.onended = () => {
    passes = passes.filter((x) => x !== p);
    source.disconnect();
    gain.disconnect();
    if (running) ahead();
  };
};

/** Keeps the pass that is playing and the one after it scheduled. */
const ahead = () => {
  if (!ctx || !buffer) return;
  const period = buffer.duration - TRACK.cross;
  const now = ctx.currentTime;
  if (!passes.length) pass(now + 0.06, false);
  let last = Math.max(...passes.map((p) => p.at));
  while (last + period < now + period + 5) {
    last = Math.max(last + period, now + 0.05);
    pass(last, true);
  }
};

const silence = () => {
  for (const p of passes) {
    p.source.onended = null;
    try {
      p.source.stop();
    } catch {
      // not started yet
    }
    p.source.disconnect();
    p.gain.disconnect();
  }
  passes = [];
  running = false;
};

/** Starts, or carries on, once everything allows it. */
function go() {
  if (!ctx || !state.on) return;
  if (ctx.state !== "running") {
    set({ playing: false });
    return;
  }
  if (!buffer || document.hidden) return;
  window.clearTimeout(resting);
  if (!running) {
    running = true;
    ahead();
  }
  fadeTo(level(), 2.4);
  set({ playing: true, waiting: false });
}

/** Call from a click or a key: lets the context start and fetches the track. */
const start = () => {
  const c = context();
  if (!c) {
    set({ on: false, waiting: false });
    return;
  }
  // An explicit "sound on" should sound even with an iPhone's ringer switch off.
  const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
  if (session) {
    try {
      session.type = "playback";
    } catch {
      // not settable here
    }
  }
  window.clearTimeout(resting);
  if (c.state !== "running") {
    c.resume().catch(() => {});
    // Older iPhones let a context start only if something sounds inside the
    // tap itself: one silent sample does.
    try {
      const kick = c.createBufferSource();
      kick.buffer = c.createBuffer(1, 1, 22050);
      kick.connect(c.destination);
      kick.start(0);
    } catch {
      // nothing to unlock here
    }
  }
  loading ??= load().catch((error) => {
    loading = null;
    console.warn("[sound]", error);
    set({ on: false, playing: false, waiting: false });
  });
  loading.then(go);
};

const stop = () => {
  set({ playing: false, waiting: false });
  if (!ctx) return;
  fadeTo(0, 0.7);
  window.clearTimeout(resting);
  resting = window.setTimeout(() => {
    if (state.on) return;
    silence();
    ctx?.suspend().catch(() => {});
  }, 850);
};

const remember = (on: boolean) => {
  try {
    sessionStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // private mode
  }
};

/** The visitor's own choice. Call it from a click (the Sound switch does). */
export const chooseSound = (on: boolean) => {
  remember(on);
  set({ on, chosen: true, waiting: false });
  if (on) start();
  else stop();
};
/** The Sound switch. While the sound is wanted but still waiting to be let
 *  in (a reload), the switch reads Off, and pressing it lets it in. */
export const toggleSound = () => chooseSound(!state.on || state.waiting);

/** The cursor says when "Click to enable sound" is in front of the visitor:
 *  it is on this page and the pointer has moved. */
export const armSound = (on: boolean) => {
  armed = on;
};

/** What is coming out right now (for the audits). */
export const probeSound = () => {
  if (!ctx || !master || !meter) return { context: "none", level: 0, gain: 0, time: 0, passes: 0, duration: 0, sampleRate: 0 };
  let level = 0;
  if (typeof meter.getFloatTimeDomainData === "function") {
    const data = new Float32Array(meter.fftSize);
    meter.getFloatTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    level = Math.sqrt(sum / data.length);
  }
  return { context: ctx.state as string, level, gain: master.gain.value, time: ctx.currentTime, passes: passes.length, duration: buffer?.duration ?? 0, sampleRate: ctx.sampleRate };
};

let mounted = false;

/** Wires the engine to the page: called once, from the root layout. */
export const mountSound = () => {
  if (mounted) return () => {};
  mounted = true;
  let remembered: string | null = null;
  try {
    remembered = sessionStorage.getItem(KEY);
  } catch {
    // private mode
  }
  if (remembered === "on") set({ on: true, chosen: true, waiting: true });
  else if (remembered === "off") set({ chosen: true });

  const inSwitch = (t: EventTarget | null) => t instanceof Element && !!t.closest("[data-sound-switch]");
  const onDown = (e: PointerEvent) => {
    if (inSwitch(e.target)) return;
    // The first click of a visitor who has not chosen, where the cursor has
    // told them so, lets the sound in.
    if (!state.chosen && armed && e.pointerType === "mouse" && e.button === 0) chooseSound(true);
    else if (state.on && !state.playing) start();
  };
  // A tap or a pen only counts as the visitor's gesture once it is a click
  // (a screen with both a mouse and touch has the cursor, and its invitation,
  // too). A click made from the keyboard is not one: detail is 0 there.
  const onClick = (e: MouseEvent) => {
    if (inSwitch(e.target)) return;
    if (!state.chosen && armed && e.button === 0 && e.detail > 0) chooseSound(true);
    else if (state.on && !state.playing) start();
  };
  const onKey = () => {
    if (state.on && !state.playing) start();
  };
  const onVisibility = () => {
    if (!ctx || !state.on) return;
    if (document.hidden) {
      fadeTo(0, 0.4);
      window.clearTimeout(resting);
      resting = window.setTimeout(() => {
        if (document.hidden) ctx?.suspend().catch(() => {});
      }, 500);
    } else {
      window.clearTimeout(resting);
      if (ctx.state === "running") go();
      else ctx.resume().catch(() => {});
    }
  };
  window.addEventListener("pointerdown", onDown, { capture: true, passive: true });
  window.addEventListener("click", onClick, { capture: true, passive: true });
  window.addEventListener("keydown", onKey, { capture: true, passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  (window as unknown as { __cygnusSound?: unknown }).__cygnusSound = { probe: probeSound, state: getSound };

  return () => {
    window.removeEventListener("pointerdown", onDown, { capture: true });
    window.removeEventListener("click", onClick, { capture: true });
    window.removeEventListener("keydown", onKey, { capture: true });
    document.removeEventListener("visibilitychange", onVisibility);
    mounted = false;
  };
};
