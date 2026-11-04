import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { faq } from "@/content/faq";
import { pageMeta } from "@/lib/seo";
import { faqSchema } from "@/lib/schema";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = pageMeta({
  title: "Info — About Cygnus",
  description: `${site.definition} Facts about the house, questions answered, care and contact.`,
  path: "/info",
});

/* The Info page is the site's plain-facts layer: the sentences here are written to be
   lifted verbatim by search and answer engines, so the rest of the site can stay spare. */
export default function InfoPage() {
  return (
    <>
      <JsonLd data={faqSchema(faq)} />

      <section className="section--top">
        <div className="container stack--loose">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Info", href: "/info" }]} />
          <div className="split">
            <div className="stack">
              <p className="eyebrow">Info</p>
              <h1 className="display-1">The house, in plain terms.</h1>
              <p className="lede">{site.definition}</p>
            </div>
            <div className="stack">
              <p className="measure--wide muted">{site.description}</p>
              <dl className="spec">
                <dt>Founded</dt>
                <dd>{site.founded}</dd>
                <dt>Material</dt>
                <dd>Grown carbon (laboratory-grown diamond) and noble metals</dd>
                <dt>Signature</dt>
                <dd>Proprietary, trademarked diamond geometries</dd>
                <dt>Acquisition</dt>
                <dd>By enquiry, through the Sanctuary</dd>
                <dt>Bespoke</dt>
                <dd>
                  <Link href="/cygnature" className="link">
                    Cygnature
                  </Link>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="section band--white textured" aria-labelledby="questions">
        <div className="container--narrow stack--loose">
          <h2 id="questions" className="eyebrow eyebrow--ink">
            Questions, answered
          </h2>
          <div className="faq">
            {faq.map((item) => (
              <div key={item.q} className="faq__item">
                <h3 className="faq__q">{item.q}</h3>
                <p className="faq__a">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="contact">
        <div className="container--narrow stack--loose">
          <h2 id="contact" className="eyebrow">
            Write to us
          </h2>
          <p className="quote">
            <a href={`mailto:${site.email}`} className="link">
              {site.email}
            </a>
          </p>
          <p className="measure muted">
            For a piece in the Sanctuary, use the enquiry on its page. For a
            commission, register through Cygnature. For everything else, the
            address above reaches the house directly.
          </p>
        </div>
      </section>
    </>
  );
}
