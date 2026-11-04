import type { Metadata } from "next";
import Link from "next/link";
import { categories, collections } from "@/content/collections";
import { Wordmark } from "@/components/Wordmark";
import { MenuLight } from "@/components/chrome/MenuLight";

export const metadata: Metadata = {
  title: "Collections",
  description: "Jump to a Cygnus collection, or browse by category.",
  robots: { index: false, follow: true },
};

/** The chapter menu: every collection and the four categories, on charcoal. */
export default function SanctuaryMenuPage() {
  return (
    <main id="main" className="menu" aria-label="Collections menu">
      <MenuLight />
      <div className="menu__top container">
        <Wordmark size="menu" as="div" />
        <Link href="/sanctuary" className="menu__close" data-cursor="Close">
          Close
        </Link>
      </div>

      <nav className="menu__nav menu__nav--two" aria-label="Collections and categories">
        <div className="menu__group">
          <p className="menu__kicker">By collection</p>
          <ul className="menu__list">
            {collections.map((c) => (
              <li key={c.slug} className="menu__item">
                <Link href={`/sanctuary#${c.slug}`} className="menu__link" data-cursor="Enter">
                  <span className="menu__name">{c.name}</span>
                  <span className="menu__more" aria-hidden="true">
                    collection {c.numeral}
                  </span>
                </Link>
              </li>
            ))}
            <li className="menu__item menu__item--soon">
              <span className="menu__name">Further collections to follow</span>
            </li>
          </ul>
        </div>
        <div className="menu__group">
          <p className="menu__kicker">By category</p>
          <ul className="menu__list">
            {categories.map((c) => (
              <li key={c.slug} className="menu__item">
                <Link href={`/sanctuary/category/${c.slug}`} className="menu__link" data-cursor="Open">
                  <span className="menu__name">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="menu__foot container">
        <Link href="/menu" className="menu__write" data-cursor="Menu">
          The house
        </Link>
        <span className="menu__est">Every piece leads to an enquiry</span>
      </div>
    </main>
  );
}
