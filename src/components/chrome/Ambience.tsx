"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getSound, mountSound, subscribeSound } from "@/lib/ambience";

/**
 * Mounts the site's sound once, in the root layout, so it plays on through
 * navigation. A film that carries its own soundtrack (data-sound, none of the
 * stand-ins do) is unmuted with it.
 */
export function Ambience() {
  const pathname = usePathname();

  useEffect(() => mountSound(), []);

  useEffect(() => {
    const films = () =>
      document.querySelectorAll<HTMLVideoElement>("video[data-sound]").forEach((v) => {
        v.muted = !getSound().on;
      });
    films();
    return subscribeSound(films);
  }, [pathname]);

  return null;
}
