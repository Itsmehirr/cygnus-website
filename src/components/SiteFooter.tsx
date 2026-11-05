import Link from "next/link";
import { site } from "@/content/site";
import { Wordmark } from "./Wordmark";
import { FooterMotion } from "./motion/FooterMotion";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer band--charcoal textured">
      <FooterMotion />
      <div className="container">
        <Wordmark size="footer" as="div" />

        <div className="footer__grid">
          <div className="footer__col">
            <p className="measure muted">{site.tagline}</p>
            <p className="small faint">Founded {site.founded}</p>
          </div>

          <div className="footer__col">
            <p className="label">The house</p>
            {site.nav.map((item) => (
              <p key={item.href}>
                <Link href={item.href} className="footer__link">
                  {item.label}
                </Link>
              </p>
            ))}
          </div>

          <div className="footer__col">
            <p className="label">Write to us</p>
            <p>
              <a href={`mailto:${site.email}`} className="footer__link">
                {site.email}
              </a>
            </p>
            <p>
              <Link href="/cygnature/register" className="footer__link">
                Cygnature registration
              </Link>
            </p>
          </div>

          <div className="footer__col">
            <p className="label">Elsewhere</p>
            {site.social.length === 0 ? (
              <p className="small faint">Profiles to follow.</p>
            ) : (
              site.social.map((s) => (
                <p key={s.href}>
                  <a
                    href={s.href}
                    className="footer__link"
                    rel="me noopener"
                    target="_blank"
                  >
                    {s.label}
                  </a>
                </p>
              ))
            )}
          </div>
        </div>

        <div className="footer__bottom">
          <span>
            © {year} {site.name}. All rights reserved.
          </span>
          <span>Engineered beauty.</span>
        </div>
      </div>
    </footer>
  );
}
