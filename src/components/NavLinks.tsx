"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/content/site";

/**
 * The Menu page's stacked items. Hover or focus expands an item into its line
 * and shows its numeral at the right edge, as on immersive-g.com's studio hub.
 */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="menu__list">
      {site.nav.map((item) => {
        const current =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href} className="menu__item">
            <Link
              href={item.href}
              className="menu__link"
              aria-current={current ? "page" : undefined}
              data-cursor="Enter"
            >
              <span className="menu__name">{item.label}</span>
              <span className="menu__more" aria-hidden="true">
                {item.line}
              </span>
              <span className="menu__num" aria-hidden="true">
                {item.numeral}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
