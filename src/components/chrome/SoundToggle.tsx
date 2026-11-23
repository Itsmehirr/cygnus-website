"use client";

import { useSyncExternalStore } from "react";
import { getServerSound, getSound, subscribeSound, toggleSound } from "@/lib/ambience";

/**
 * The Sound switch: the site's ambience on or off, remembered for the
 * session. Fixed at the bottom right of every page, as on immersive-g.com;
 * `inline` sets it in the flow instead (the footer, the Menu).
 */
export function SoundToggle({ inline = false }: { inline?: boolean }) {
  const { on } = useSyncExternalStore(subscribeSound, getSound, getServerSound);

  return (
    <button
      type="button"
      className={inline ? "sound sound--inline" : "sound"}
      aria-pressed={on}
      onClick={toggleSound}
      data-sound-switch
      data-cursor={on ? "Mute" : "Sound"}
    >
      <span className="sound__word">Sound</span>
      <span className="sound__state">{on ? "On" : "Off"}</span>
    </button>
  );
}
