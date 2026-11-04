import type { Metadata } from "next";
import Link from "next/link";
import { categories, collections } from "@/content/collections";
import { piecesByCategory, piecesByCollection } from "@/content/pieces";
import { pageMeta } from "@/lib/seo";
import { collectionPageSchema } from "@/lib/schema";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Picture } from "@/components/Picture";

const description =
  "The Sanctuary holds the Cygnus collections: rings, earrings, necklaces and bracelets, by category or by collection. Every piece leads to an enquiry with the house.";

export const metadata: Metadata = pageMeta({
  title: "Sanctuary — The Collections",
  description,
  path: "/sanctuary",
});

export default function SanctuaryPage() {
  return (
    <>
      <JsonLd
        data={collectionPageSchema({
          name: "Sanctuary — The Cygnus Collections",
          description,
          path: "/sanctuary",
        })}
      />

      <section className="section--top">
        <div className="container stack--loose">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Sanctuary", href: "/sanctuary" }]} />
          <div className="stack">
            <p className="eyebrow">Sanctuary</p>
            <h1 className="display-1">The collections.</h1>
            <p className="lede">
              By category, or by collection. Every piece leads to a
              conversation with the house rather than a checkout.
            </p>
          </div>
        </div>
      </section>

      {/* ★ Sorted by category */}
      <section className="section band--white textured" aria-labelledby="by-category">
        <div className="container stack--loose">
          <h2 id="by-category" className="eyebrow eyebrow--ink">
            By category
          </h2>
          <div className="grid grid--4">
            {categories.map((c) => {
              const count = piecesByCategory(c.slug).length;
              const cover = piecesByCategory(c.slug)[0]?.images[0];
              return (
                <Link key={c.slug} href={`/sanctuary/category/${c.slug}`} className="tile">
                  <div className="tile__media">
                    <Picture
                      src={cover?.src ?? `/images/categories/${c.slug}.jpg`}
                      alt={cover?.alt ?? `${c.name} by Cygnus`}
                      ratio="tall"
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      label={c.name}
                    />
                  </div>
                  <div className="tile__body">
                    <span className="tile__title">{c.name}</span>
                    <span className="tile__meta">
                      {count} {count === 1 ? "piece" : "pieces"}
                    </span>
                  </div>
                  <p className="tile__line">{c.line}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ★ Sorted by collections */}
      <section className="section textured" aria-labelledby="by-collection">
        <div className="container stack--loose">
          <h2 id="by-collection" className="eyebrow eyebrow--ink">
            By collection
          </h2>
          <div className="grid grid--3">
            {collections.map((col) => {
              const cover = piecesByCollection(col.slug)[0]?.images[0];
              return (
                <Link key={col.slug} href={`/sanctuary/collections/${col.slug}`} className="tile">
                  <div className="tile__media">
                    <Picture
                      src={cover?.src ?? `/images/collections/${col.slug}.jpg`}
                      alt={cover?.alt ?? `${col.name} collection by Cygnus`}
                      ratio="portrait"
                      sizes="(min-width: 720px) 33vw, 100vw"
                      label={`${col.name} collection`}
                    />
                  </div>
                  <div className="tile__body">
                    <span className="tile__title">{col.name}</span>
                    <span className="tile__meta">Collection</span>
                  </div>
                  <p className="tile__line">{col.line}</p>
                </Link>
              );
            })}
            <div className="tile" aria-hidden="true">
              <div className="tile__media" style={{ aspectRatio: "4 / 5", border: "1px solid var(--c-line)" }} />
              <div className="tile__body">
                <span className="tile__title faint">Further collections</span>
                <span className="tile__meta">To follow</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
