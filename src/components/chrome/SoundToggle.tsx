"use client";

import { useEffect, useState } from "react";

const remembered = () => {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem("cygnus-sound") === "on";
  } catch {
    return false;
  }
};

/**
 * Opt-in sound for the story video: muted by default, remembered for the
 * session. Sits bottom-right, as on immersive-g.com.
 */
export function SoundToggle() {
  const [on, setOn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Read the remembered choice after hydration so server and client markup match.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      setOn(remembered());
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.querySelectorAll<HTMLVideoElement>("video[data-story]").forEach((v) => {
      v.muted = !on;
      if (on) v.play().catch(() => {});
    });
    try {
      sessionStorage.setItem("cygnus-sound", on ? "on" : "off");
    } catch {}
  }, [on, hydrated]);

  return (
    <button
      type="button"
      className="sound"
      aria-pressed={on}
      onClick={() => setOn((v) => !v)}
      data-cursor={on ? "Mute" : "Sound"}
    >
      <span className="sound__word">Sound</span>
      <span className="sound__state">{on ? "On" : "Off"}</span>
    </button>
  );
}
