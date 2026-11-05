import type { Metadata } from "next";
import { manifesto, site } from "@/content/site";
import { pageMeta } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Pillars } from "@/components/Pillars";
import { Picture } from "@/components/Picture";
import { ButtonLink } from "@/components/Button";

export const metadata: Metadata = pageMeta({
  title: "Design",
  description:
    "The design philosophy of Cygnus: proprietary, trademarked diamond geometries conceived through contemporary ingenuity, transforming grown carbon into structural art.",
  path: "/design",
});

export default function DesignPage() {
  return (
    <>
      <section className="section--top">
        <div className="container stack--loose">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Design", href: "/design" }]} />
          <div className="split">
            <div className="stack">
              <p className="label">Design</p>
              <h1 className="display-1">Thought, given form.</h1>
              <p className="lede">
                Cygnus crafts design-forward high jewellery anchored by
                protected, trademarked diamond geometries conceived through
                contemporary ingenuity rather than passive reliance on
                inherited tradition.
              </p>
            </div>
            <Picture
              src="/images/design/geometry-01.jpg"
              alt="A Cygnus diamond geometry, studied as an object of design"
              ratio="landscape"
              sizes="(min-width: 880px) 58vw, 100vw"
              priority
              label="Object / Form"
            />
          </div>
        </div>
      </section>

      {/* ★ textures on section pages */}
      <section className="section band--white textured" aria-labelledby="geometry">
        <div className="container stack--loose">
          <div className="split split--reverse">
            <div className="stack">
              <p className="label">The geometry of light</p>
              <h2 id="geometry" className="display-2">
                A study in proportion, reflection and movement.
              </h2>
              <p className="measure muted">
                Where tradition sees the diamond as nature’s inheritance, Cygnus
                sees a material waiting to be reimagined. Grown carbon can be cut
                to forms that no inherited cut required: geometries designed for
                how they hold light, and how they return it.
              </p>
              <p className="measure muted">
                Each geometry is the house’s own, protected and trademarked, and
                each is set in noble metal so that the structure is as considered
                as the stone.
              </p>
            </div>
            <Picture
              src="/images/design/light-01.jpg"
              alt="Light moving through a Cygnus geometry"
              ratio="portrait"
              sizes="(min-width: 880px) 42vw, 100vw"
              label="Light / Atmosphere"
            />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="pillars">
        <div className="container stack--loose">
          <h2 id="pillars" className="label">
            Three principles
          </h2>
          <Pillars />
        </div>
      </section>

      <section className="section band--white textured" aria-labelledby="essence">
        <div className="container--narrow stack--loose">
          <p className="label">Essence</p>
          <h2 id="essence" className="display-2">
            Engineered beauty.
          </h2>
          <p className="lede">
            Cygnus brings together science, architecture and artistry to create
            jewellery where precision becomes emotion, and innovation becomes
            timeless beauty.
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="manifesto">
        <div className="container--narrow stack--loose">
          <h2 id="manifesto" className="label">
            Manifesto
          </h2>
          <div className="manifesto-lines">
            {manifesto.long.map((line, i) =>
              line === "" ? (
                <div key={i} className="gap" aria-hidden="true" />
              ) : (
                <p key={i}>{line}</p>
              ),
            )}
          </div>
          <p className="small faint">
            {site.name}, founded {site.founded}.
          </p>
          <ButtonLink href="/sanctuary">See the work</ButtonLink>
        </div>
      </section>
    </>
  );
}
