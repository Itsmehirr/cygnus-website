import Link from "next/link";
import { Wordmark } from "./Wordmark";

/**
 * Fixed, transparent chrome: the wordmark centred, "Menu" at the right.
 * On Home the wordmark stays hidden until the hero line has docked
 * (body.is-docked), so the two never share the top edge.
 */
export function SiteHeader() {
  return (
    <header className="header">
      <div className="header__bar container">
        <Link href="/" className="header__home" aria-label="Cygnus — home">
          <Wordmark size="nav" />
        </Link>
        <Link href="/menu" className="header__menu" data-cursor="Open">
          Menu
        </Link>
      </div>
    </header>
  );
}
