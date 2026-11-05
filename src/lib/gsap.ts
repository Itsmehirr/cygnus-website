"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Media query used by the motion components. Like both references, the site
 * plays its full motion whatever the system's "Reduce motion" setting says
 * (Mihir's decision, 5 Nov 2026), so this matches every screen.
 */
export const MOTION_OK = "all";

export { gsap, ScrollTrigger, useGSAP };
