import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, getCollection } from "@/content/collections";
import { getPiece, pieces, piecesByCollection } from "@/content/pieces";
import { pageMeta } from "@/lib/seo";
import { productSchema } from "@/lib/schema";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Picture } from "@/components/Picture";
import { PieceCard } from "@/components/PieceCard";
import { EnquiryForm } from "@/components/EnquiryForm";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return pieces.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
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

export default async function PiecePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const piece = getPiece(slug);
  if (!piece) notFound();

  const collection = getCollection(piece.collection);
  const category = getCategory(piece.category);
  const siblings = piecesByCollection(piece.collection)
    .filter((p) => p.slug !== piece.slug)
    .slice(0, 3);

  return (
    <>
      <JsonLd
        data={productSchema(
          piece,
          collection?.name ?? piece.collection,
          category?.name ?? piece.category,
        )}
      />

      <article className="section--top">
        <div className="container stack--loose">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Sanctuary", href: "/sanctuary" },
              ...(category
                ? [{ name: category.name, href: `/sanctuary/category/${category.slug}` }]
                : []),
              { name: piece.name, href: `/sanctuary/pieces/${piece.slug}` },
            ]}
          />

          <div className="split">
            <div className="gallery">
              {piece.images.map((img, i) => (
                <Picture
                  key={img.src}
                  src={img.src}
                  alt={img.alt}
                  ratio={i === 0 ? "portrait" : "square"}
                  sizes="(min-width: 880px) 42vw, 100vw"
                  priority={i === 0}
                  label={i === 0 ? "Human / Presence" : "Object / Form"}
                />
              ))}
            </div>

            <div className="stack--loose">
              <div className="stack">
                {collection && (
                  <p className="eyebrow">
                    <Link href={`/sanctuary/collections/${collection.slug}`} className="link link--quiet">
                      {collection.name} collection
                    </Link>
                  </p>
                )}
                <h1 className="display-1">{piece.name}</h1>
                <p className="lede">{piece.description}</p>
                {piece.story && <p className="measure muted">{piece.story}</p>}
              </div>

              {piece.placeholder ? (
                <p className="small faint" style={{ paddingTop: 20, borderTop: "1px solid var(--c-line)" }}>
                  Details to follow.
                </p>
              ) : (
                <dl className="spec">
                  {category && (
                    <>
                      <dt>Category</dt>
                      <dd>{category.name}</dd>
                    </>
                  )}
                  {piece.metal && (
                    <>
                      <dt>Metal</dt>
                      <dd>{piece.metal}</dd>
                    </>
                  )}
                  {piece.geometry && (
                    <>
                      <dt>Geometry</dt>
                      <dd>{piece.geometry}</dd>
                    </>
                  )}
                  {piece.stones && (
                    <>
                      <dt>Stones</dt>
                      <dd>{piece.stones}</dd>
                    </>
                  )}
                </dl>
              )}

              {/* Individual product page → leads to enquiry */}
              <div className="stack">
                <h2 className="display-3">Enquire</h2>
                <p className="measure muted">
                  Every piece leads to a conversation with the house. Leave your
                  name and we will write to you personally.
                </p>
                <EnquiryForm piece={{ slug: piece.slug, name: piece.name }} />
              </div>
            </div>
          </div>
        </div>
      </article>

      {siblings.length > 0 && (
        <section className="section band--white textured" aria-labelledby="also">
          <div className="container stack--loose">
            <h2 id="also" className="eyebrow eyebrow--ink">
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
