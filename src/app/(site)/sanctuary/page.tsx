import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { imageDims } from "@/lib/image-dims";
import Link from "next/link";
import { categories, collections, sanctuaryFilm } from "@/content/collections";
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

const description = `The Design Sanctuary holds the Cygnus collections, ${collections.map((c) => c.name).join(" and ")}: rings, earrings, necklaces and bracelets, by collection or by category. Every piece leads to an enquiry with the house.`;

export const metadata: Metadata = pageMeta({
  title: "Design Sanctuary — The Collections",
  description,
  path: "/sanctuary",
});

const moods = [
  { src: "/images/sanctuary/mood-01.jpg", alt: "Light across a facet", label: "Light" },
  { src: "/images/sanctuary/mood-02.jpg", alt: "Stone, linen and wood, composed", label: "Object" },
  { src: "/images/sanctuary/mood-03.jpg", alt: "A piece worn, in movement", label: "Presence" },
  { src: "/images/sanctuary/mood-04.jpg", alt: "Stone and shadow", label: "Material" },
  { src: "/images/sanctuary/mood-05.jpg", alt: "Geometry, studied", label: "Form" },
  { src: "/images/sanctuary/mood-06.jpg", alt: "Reflection on water", label: "Atmosphere" },
];

const size = (src: string) => imageDims(src);

/** One room: the film behind the arches under the Sanctuary's own name, then
 *  the collections, one panel each, travelling across it. */
const chapters: StoryChapter[] = [
  {
    slug: "collections",
    name: "Design Sanctuary",
    label: "Collections",
    media: { poster: sanctuaryFilm.poster, video: fs.existsSync(path.join(process.cwd(), "public", sanctuaryFilm.src)) ? sanctuaryFilm.src : undefined },
    items: collections.map((col, i) => {
      return {
        align: (i % 2 ? "bottom" : "top") as "top" | "bottom",
        // The picture that opens the collection's own page.
        image: { ...col.hero, ...size(col.hero.src) },
        title: col.name,
        text: col.story,
        href: `/sanctuary/collections/${col.slug}`,
        linkText: "See Collection",
        cta: true,
        hotspot: ["See", "Collection"] as [string, string],
      };
    }),
  },
];

/* The Design Sanctuary: a title band, a gallery that drifts, then the collections as
   panels of one room in the Capitolium grammar. Every panel is a real link. */
export default function SanctuaryPage() {
  return (
    <>
      <JsonLd
        data={collectionPageSchema({
          name: "Design Sanctuary — The Cygnus Collections",
          description,
          path: "/sanctuary",
        })}
      />

      <section className="sanctum" aria-labelledby="sanctuary">
        <div className="container">
          <h1 id="sanctuary" className="sanctum__title">
            Design Sanctuary
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

      <section className="sanctum-coda" aria-label="More from the Design Sanctuary">
        <div className="container center">
          <p className="label">By category</p>
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
        collections={collections.map((c) => ({ slug: c.slug, label: `Collection ${c.numeral}`, name: c.name }))}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        tagline="Jewellery as wearable art."
      />
      <ScrollThumb />
      <LandOnHash />
    </>
  );
}
