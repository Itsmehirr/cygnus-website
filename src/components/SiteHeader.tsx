import Link from "next/link";
import { Wordmark } from "./Wordmark";

/**
 * Immersive Garden's chrome: no bar, nothing centred. The small mark sits at
 * the top left and "Menu" alone at the top right, on every page; on Home the
 * mark appears only once the axis has let go (body.is-docked).
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
