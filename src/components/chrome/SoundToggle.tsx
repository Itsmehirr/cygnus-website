"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { getServerSound, getSound, subscribeSound, toggleSound } from "@/lib/ambience";

/*
 * One switch on screen at a time. The fixed one shows only while none of the
 * switches set in the page (the footer's last line, the Menu's foot) is in
 * view, and not before the page has been measured: `html.sound-fixed` says so
 * (globals.css hides the fixed switch without it).
 */
const unmeasured = new Set<Element>();
const inView = new Set<Element>();
let fixedShown = false;
let settling = 0;

const settle = () => {
  if (inView.size) fixedShown = false;
  else if (!unmeasured.size) fixedShown = true;
  document.documentElement.classList.toggle("sound-fixed", fixedShown);
};
/** After a page or a layout has changed hands: once its switches are all there. */
const settleSoon = () => {
  window.clearTimeout(settling);
  settling = window.setTimeout(settle, 120);
};

/**
 * The Sound switch: the site's ambience on or off, remembered for the
 * session. Fixed at the bottom right of every page, as on immersive-g.com;
 * `inline` sets one in the flow instead (the footer, the Menu's foot), and
 * the fixed one steps aside while that one is on screen.
 */
export function SoundToggle({ inline = false }: { inline?: boolean }) {
  const sound = useSyncExternalStore(subscribeSound, getSound, getServerSound);
  // On once it can be heard: a remembered "on" that still waits for a click reads Off.
  const on = sound.on && !sound.waiting;
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!inline) {
      // A fixed switch that has just arrived waits until the page's own has been measured.
      fixedShown = false;
      document.documentElement.classList.remove("sound-fixed");
      settleSoon();
      return;
    }
    unmeasured.add(el);
    const io = new IntersectionObserver(
      (entries) => {
        unmeasured.delete(el);
        if (entries[entries.length - 1].intersectionRatio >= 0.9) inView.add(el);
        else inView.delete(el);
        settle();
      },
      { threshold: 0.9 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      unmeasured.delete(el);
      inView.delete(el);
      settleSoon();
    };
  }, [inline]);

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={on}
      className={inline ? "sound sound--inline" : "sound"}
      onClick={toggleSound}
      data-sound-switch
      data-cursor={on ? "Mute" : "Sound"}
    >
      <span className="sound__word">Sound</span>
      {/* Read out, the switch is "Sound" and its state is on or off; the word is for the eye. */}
      <span className="sound__state" aria-hidden="true">
        {on ? "On" : "Off"}
      </span>
    </button>
  );
}
