import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/content/site";
import { getCategory, getCollection } from "@/content/collections";
import { careNote, getPiece, pieces, piecesByCollection } from "@/content/pieces";
import { pageMeta } from "@/lib/seo";
import { productSchema } from "@/lib/schema";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Picture } from "@/components/Picture";
import { PieceCard } from "@/components/PieceCard";
import { EnquiryReveal } from "@/components/EnquiryReveal";
import { Reveal } from "@/components/motion/Reveal";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return pieces.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const piece = getPiece(slug);
  if (!piece) return {};
  return pageMeta({
    title: piece.name,
    description: piece.description,
    path: `/sanctuary/pieces/${piece.slug}`,
    image: piece.images[0]?.src,
  });
}

/* The piece page: a tall gallery on the left scrolling under a sticky column
   on the right (the Zoya layout in the house's register). Price on request;
   the enquiry opens in place. */
export default async function PiecePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const piece = getPiece(slug);
  if (!piece) notFound();

  const collection = getCollection(piece.collection);
  const category = getCategory(piece.category);
  const siblings = piecesByCollection(piece.collection)
    .filter((p) => p.slug !== piece.slug)
    .slice(0, 3);

  const details: [string, string | undefined][] = [
    ["Collection", collection?.name],
    ["Category", category?.name],
    ["Metal", piece.metal],
    ["Geometry", piece.geometry],
    ["Stones", piece.stones],
    ["Dimensions", piece.dimensions],
  ];
  const known = details.filter(([, v]) => v);

  return (
    <>
      <JsonLd data={productSchema(piece, collection?.name ?? piece.collection, category?.name ?? piece.category)} />

      <article className="piece">
        <div className="container piece__grid">
          <div className="piece__gallery">
            {piece.images.map((img, i) => (
              <Reveal key={img.src} className="piece__shot">
                <div className="card">
                  <Picture
                    src={img.src}
                    alt={img.alt}
                    ratio={i === 0 ? "portrait" : "square"}
                    sizes="(min-width: 880px) 56vw, 100vw"
                    priority={i === 0}
                    label={i === 0 ? "Presence" : "Object"}
                  />
                </div>
              </Reveal>
            ))}
            <div className="piece__shot">
              <div className="card">
                <Picture
                  src={piece.images[0].src.replace("-01", "-03")}
                  alt={`${piece.name} by Cygnus, the geometry seen close`}
                  ratio="portrait"
                  sizes="(min-width: 880px) 56vw, 100vw"
                  label="Geometry, close"
                />
              </div>
            </div>
          </div>

          <div className="piece__aside">
            <div className="piece__sticky">
              <Breadcrumbs
                items={[
                  { name: "Home", href: "/" },
                  { name: "Sanctuary", href: "/sanctuary" },
                  ...(category ? [{ name: category.name, href: `/sanctuary/category/${category.slug}` }] : []),
                  { name: piece.name, href: `/sanctuary/pieces/${piece.slug}` },
                ]}
              />

              {collection && (
                <p className="piece__collection">
                  <Link href={`/sanctuary#${collection.slug}`} className="link link--quiet" data-cursor="Open">
                    {collection.name} collection
                  </Link>
                </p>
              )}
              <h1 className="piece__name">{piece.name}</h1>
              <p className="lede">{piece.description}</p>
              {piece.story && <p className="measure muted">{piece.story}</p>}

              <dl className="piece__facts">
                <dt>Price</dt>
                <dd>On request</dd>
                {piece.reference && (
                  <>
                    <dt>Reference</dt>
                    <dd>{piece.reference}</dd>
                  </>
                )}
              </dl>

              <EnquiryReveal piece={{ slug: piece.slug, name: piece.name }} email={site.email} />

              <div className="piece__details">
                <h2 className="piece__h">Details</h2>
                {known.length > 0 ? (
                  <dl className="spec">
                    {known.map(([k, v]) => (
                      <div key={k} className="spec__row">
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="small faint">Details to follow.</p>
                )}
                {piece.placeholder && known.length > 0 && (
                  <p className="small faint">Metal, geometry and dimensions to follow.</p>
                )}
              </div>

              <div className="piece__details">
                <h2 className="piece__h">Care</h2>
                <p className="small muted">{careNote}</p>
              </div>
            </div>
          </div>
        </div>
      </article>

      {siblings.length > 0 && (
        <section className="section band--white" aria-labelledby="also">
          <div className="container stack--loose">
            <h2 id="also" className="piece__h">
              Also in {collection?.name ?? "the collection"}
            </h2>
            <div className="grid grid--3">
              {siblings.map((p) => (
                <PieceCard key={p.slug} piece={p} showCollection={false} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
