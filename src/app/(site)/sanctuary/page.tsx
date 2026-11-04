import type { Metadata } from "next";
import Link from "next/link";
import { categories, collections } from "@/content/collections";
import { piecesByCollection } from "@/content/pieces";
import { pageMeta } from "@/lib/seo";
import { collectionPageSchema } from "@/lib/schema";
import { JsonLd } from "@/components/JsonLd";
import { Picture } from "@/components/Picture";
import { Clip } from "@/components/Clip";
import { Chapter } from "@/components/sanctuary/Chapter";
import { ChapterPill } from "@/components/sanctuary/ChapterPill";
import { GalleryDrift } from "@/components/sanctuary/GalleryDrift";
import { Statement } from "@/components/home/Statement";
import { LandOnHash } from "@/components/motion/LandOnHash";

const description =
  "The Sanctuary holds the Cygnus collections: rings, earrings, necklaces and bracelets, by category or by collection. Every piece leads to an enquiry with the house.";

export const metadata: Metadata = pageMeta({
  title: "Sanctuary — The Collections",
  description,
  path: "/sanctuary",
});

const moods = [
  { src: "/images/sanctuary/mood-01.jpg", alt: "Light across a facet", label: "Light" },
  { src: "/images/sanctuary/mood-02.jpg", alt: "A pearl against grown carbon", label: "Object" },
  { src: "/images/sanctuary/mood-03.jpg", alt: "A piece worn, in movement", label: "Presence" },
  { src: "/images/sanctuary/mood-04.jpg", alt: "Stone and shadow", label: "Material" },
  { src: "/images/sanctuary/mood-05.jpg", alt: "Geometry, studied", label: "Form" },
  { src: "/images/sanctuary/mood-06.jpg", alt: "Reflection on water", label: "Atmosphere" },
];

/* The Sanctuary: a title band, a gallery that drifts, then one chapter per
   collection in the Capitolium grammar. Every window and panel is a real link. */
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

      <section className="sanctum" aria-labelledby="sanctuary">
        <div className="container">
          <h1 id="sanctuary" className="sanctum__title">
            Sanctuary
          </h1>
          <Statement
            text="The collections of the house, by collection or by category. Every piece leads to a conversation rather than a checkout."
            className="sanctum__lede"
          />
          <p className="sanctum__cats">
            {categories.map((c, i) => (
              <span key={c.slug}>
                <Link href={`/sanctuary/category/${c.slug}`} className="link link--quiet" data-cursor="Open">
                  {c.name}
                </Link>
                {i < categories.length - 1 ? <span className="sanctum__sep" aria-hidden="true" /> : null}
              </span>
            ))}
          </p>
        </div>
        <GalleryDrift>
          {moods.map((m, i) => (
            <div key={m.src} className={`gallery__item gallery__item--${(i % 3) + 1}`}>
              <div className="card">
                <Picture src={m.src} alt={m.alt} ratio={i % 2 ? "portrait" : "landscape"} sizes="30vw" label={m.label} />
              </div>
            </div>
          ))}
        </GalleryDrift>
      </section>

      {collections.map((col) => {
        const list = piecesByCollection(col.slug);
        return (
          <Chapter
            key={col.slug}
            slug={col.slug}
            name={col.name}
            numeral={col.numeral}
            ground={col.ground}
            framed={col.framed}
            windows={[
              ...list.map((p) => (
                <Link key={p.slug} href={`/sanctuary/pieces/${p.slug}`} className="win" data-cursor="View">
                  <Picture src={p.images[0].src} alt={p.images[0].alt} ratio="portrait" sizes="28vw" label={p.name} />
                  <span className="win__name">{p.name}</span>
                </Link>
              )),
              <div key="intro" className="win win--intro">
                <Clip src={col.intro.src} poster={col.intro.poster} ratio="portrait" label={`${col.name}, the film`} />
                <span className="win__name">{col.name}</span>
              </div>,
            ]}
            full={<Clip src={col.intro.src} poster={col.intro.poster} ratio="landscape" label={`${col.name}, the film`} />}
            panels={
              <div className="panels container">
                <div className="panel panel--story">
                  <div className="panel__text">
                    <p className="panel__kicker">Collection {col.numeral}</p>
                    <h3 className="display-2">{col.name}</h3>
                    <p className="lede">{col.description}</p>
                    <p className="measure muted">{col.story}</p>
                  </div>
                </div>
                {list.map((p, i) => (
                  <div key={p.slug} className={`panel ${i % 2 ? "panel--right" : "panel--left"}`}>
                    <Link href={`/sanctuary/pieces/${p.slug}`} className="panel__media card tile" data-cursor="View">
                      <Picture
                        src={p.images[i % 2 ? 1 : 0]?.src ?? p.images[0].src}
                        alt={p.images[i % 2 ? 1 : 0]?.alt ?? p.images[0].alt}
                        ratio={i % 2 ? "square" : "portrait"}
                        sizes="(min-width: 880px) 40vw, 90vw"
                        label={p.name}
                      />
                    </Link>
                    <div className="panel__text">
                      <h4 className="display-3">
                        <Link href={`/sanctuary/pieces/${p.slug}`} data-cursor="View">
                          {p.name}
                        </Link>
                      </h4>
                      <p className="measure muted">{p.description}</p>
                      <p>
                        <Link href={`/sanctuary/pieces/${p.slug}`} className="link">
                          Enquire about this piece
                        </Link>
                      </p>
                    </div>
                  </div>
                ))}
                <div className="panel panel--end">
                  <p className="muted">Further collections to follow.</p>
                </div>
              </div>
            }
          />
        );
      })}

      <ChapterPill />
      <LandOnHash />
    </>
  );
}
