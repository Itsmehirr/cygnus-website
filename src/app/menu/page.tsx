import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { NavLinks } from "@/components/NavLinks";
import { Wordmark } from "@/components/Wordmark";
import { MenuGround } from "@/components/chrome/MenuGround";

export const metadata: Metadata = {
  title: "Menu",
  description: "Design, Sanctuary, Cygnature and Info: the four doors of the house.",
  robots: { index: false, follow: true },
};

/**
 * The House: a charcoal page rather than an overlay, reached by cross-fade.
 * A light follows the pointer across the ground (CSS now; the relief and its
 * WebGL light arrive in Phase 3). Items expand into their line on hover.
 */
export default function MenuPage() {
  return (
    <main id="main" className="menu" aria-label="Menu">
      <MenuGround />
      <div className="menu__top container">
        <Wordmark size="menu" as="div" />
        <Link href="/" className="menu__close" data-cursor="Close">
          Close
        </Link>
      </div>

      <nav className="menu__nav" aria-label="Primary">
        <NavLinks />
      </nav>

      <div className="menu__foot container">
        <a href={`mailto:${site.email}`} className="menu__write" data-cursor="Write">
          Write to us
        </a>
        <span className="menu__est">Founded {site.founded}</span>
      </div>
    </main>
  );
}
