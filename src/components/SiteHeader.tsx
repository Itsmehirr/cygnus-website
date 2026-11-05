import Link from "next/link";
import { Wordmark } from "./Wordmark";

/**
 * Immersive Garden's chrome: no bar, nothing centred. "Menu" sits at the top
 * right with the small mark beside it; on Home the mark joins it only once the
 * axis has let go (body.is-docked).
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
