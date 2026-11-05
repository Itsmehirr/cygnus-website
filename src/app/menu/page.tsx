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
    <main id="main" className="menu page-in" aria-label="Menu">
      <MenuGround />
      <div className="menu__top container">
        <Link href="/" className="menu__close">
          Close
          <span className="menu__dash" aria-hidden="true" />
        </Link>
        <Link href="/" className="menu__mark" aria-label="Cygnus — home">
          <Wordmark size="nav" />
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
