import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { imageDims } from "@/lib/image-dims";
import Link from "next/link";
import { categories, collections } from "@/content/collections";
import { piecesByCollection } from "@/content/pieces";
import { pageMeta } from "@/lib/seo";
import { collectionPageSchema } from "@/lib/schema";
import { JsonLd } from "@/components/JsonLd";
import { Picture } from "@/components/Picture";
import { Story, type StoryChapter } from "@/components/sanctuary/Story";
import { StoryNav } from "@/components/sanctuary/StoryNav";
import { ScrollThumb } from "@/components/sanctuary/ScrollThumb";
import { GalleryDrift } from "@/components/sanctuary/GalleryDrift";
import { Paragraph } from "@/components/motion/Paragraph";
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

const size = (src: string) => imageDims(src);

/** One room per collection: the film behind the arches, then its panels. */
const chapters: StoryChapter[] = collections.map((col) => {
  const list = piecesByCollection(col.slug);
  const intro = list[0]?.images[0];
  return {
    slug: col.slug,
    name: col.name,
    label: `Collection ${col.numeral}`,
    media: { poster: col.intro.poster, video: fs.existsSync(path.join(process.cwd(), "public", col.intro.src)) ? col.intro.src : undefined },
    items: [
      {
        align: "top" as const,
        image: { src: "/images/sanctuary/mood-02.jpg", alt: `${col.name}: a pearl against grown carbon`, ...size("/images/sanctuary/mood-02.jpg") },
        title: `${col.name}, the collection`,
        text: col.story,
      },
      ...list.map((p, i) => {
        const img = p.images[i % 2 ? 0 : 1] ?? p.images[0];
        return {
          align: (i % 2 ? "top" : "bottom") as "top" | "bottom",
          image: { src: img.src, alt: img.alt, ...size(img.src) },
          title: p.name,
          text: p.description,
          href: `/sanctuary/pieces/${p.slug}`,
          linkText: "Enquire about this piece",
          hotspot: ["View", "the piece"] as [string, string],
        };
      }),
    ],
    full: intro
      ? {
          image: { src: "/images/sanctuary/mood-04.jpg", alt: "Stone and shadow, the ground of the collection", ...size("/images/sanctuary/mood-04.jpg") },
          title: `Under the light, ${col.name.toLowerCase()} becomes structure.`,
          text: col.description,
          href: `/sanctuary/collections/${col.slug}`,
          linkText: `The ${col.name} collection`,
        }
      : undefined,
  };
});

/* The Sanctuary: a title band, a gallery that drifts, then the collections as
   rooms in the Capitolium grammar. Every image and panel is a real link. */
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
          <Paragraph className="sanctum__lede">
            The collections of the house, by collection or by category. Every piece leads to a conversation rather than a checkout.
          </Paragraph>
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
                <Picture
                  src={m.src}
                  alt={m.alt}
                  ratio={i % 2 ? "portrait" : "landscape"}
                  sizes="(min-width: 880px) 30vw, 220px"
                  priority={i < 2}
                  label={m.label}
                />
              </div>
            </div>
          ))}
        </GalleryDrift>
      </section>

      <Story chapters={chapters} />

      <section className="sanctum-coda" aria-label="More from the Sanctuary">
        <div className="container center">
          <p className="label">Further collections to follow</p>
          <p className="sanctum__cats">
            {categories.map((c, i) => (
              <span key={c.slug}>
                <Link href={`/sanctuary/category/${c.slug}`} className="link link--quiet">
                  {c.name}
                </Link>
                {i < categories.length - 1 ? <span className="sanctum__sep" aria-hidden="true" /> : null}
              </span>
            ))}
          </p>
        </div>
      </section>

      <StoryNav
        chapters={collections.map((c) => ({ slug: c.slug, label: `Collection ${c.numeral}`, title: c.name }))}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        tagline="Jewellery as wearable art."
      />
      <ScrollThumb />
      <LandOnHash />
    </>
  );
}
