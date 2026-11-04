import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { collections, getCollection } from "@/content/collections";
import { piecesByCollection } from "@/content/pieces";
import { pageMeta } from "@/lib/seo";
import { collectionPageSchema } from "@/lib/schema";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PieceCard } from "@/components/PieceCard";
import { Picture } from "@/components/Picture";

type Params = { collection: string };

export function generateStaticParams(): Params[] {
  return collections.map((c) => ({ collection: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { collection } = await params;
  const col = getCollection(collection);
  if (!col) return {};
  return pageMeta({
    title: `${col.name} — Collection`,
    description: col.description,
    path: `/sanctuary/collections/${col.slug}`,
  });
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { collection } = await params;
  const col = getCollection(collection);
  if (!col) notFound();

  const list = piecesByCollection(col.slug);
  const hero = list[0]?.images[1] ?? list[0]?.images[0];

  const body = (
    <div className="stack--loose">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Sanctuary", href: "/sanctuary" },
          { name: col.name, href: `/sanctuary/collections/${col.slug}` },
        ]}
      />
      <div className="split">
        <div className="stack">
          <p className="label">Collection</p>
          <h1 className="display-1">{col.name}</h1>
          <p className="lede">{col.description}</p>
          <p className="measure muted">{col.story}</p>
        </div>
        <Picture
          src={hero?.src ?? `/images/collections/${col.slug}-hero.jpg`}
          alt={hero?.alt ?? `${col.name} collection by Cygnus`}
          ratio="landscape"
          sizes="(min-width: 880px) 58vw, 100vw"
          priority
          label={`${col.name} — Light / Atmosphere`}
        />
      </div>

      {list.length === 0 ? (
        <p className="muted">Pieces to follow.</p>
      ) : (
        <div className="grid grid--4">
          {list.map((p) => (
            <PieceCard key={p.slug} piece={p} showCollection={false} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <JsonLd
        data={collectionPageSchema({
          name: `${col.name} — a Cygnus collection`,
          description: col.description,
          path: `/sanctuary/collections/${col.slug}`,
        })}
      />
      <section className="section--top">
        <div className="container">
          {/* ★★ "focus on frame": hairline frame specific to this collection page */}
          {col.framed ? <div className="frame">{body}</div> : body}
        </div>
      </section>
    </>
  );
}
