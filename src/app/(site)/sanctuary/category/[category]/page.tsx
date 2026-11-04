import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories, getCategory } from "@/content/collections";
import { piecesByCategory } from "@/content/pieces";
import { pageMeta } from "@/lib/seo";
import { collectionPageSchema } from "@/lib/schema";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PieceCard } from "@/components/PieceCard";

type Params = { category: string };

export function generateStaticParams(): Params[] {
  return categories.map((c) => ({ category: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return {};
  return pageMeta({
    title: `${cat.name}`,
    description: cat.description,
    path: `/sanctuary/category/${cat.slug}`,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const list = piecesByCategory(cat.slug);

  return (
    <>
      <JsonLd
        data={collectionPageSchema({
          name: `${cat.name} — Cygnus`,
          description: cat.description,
          path: `/sanctuary/category/${cat.slug}`,
        })}
      />

      <section className="section--top">
        <div className="container stack--loose">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Sanctuary", href: "/sanctuary" },
              { name: cat.name, href: `/sanctuary/category/${cat.slug}` },
            ]}
          />
          <div className="stack">
            <p className="label">By category</p>
            <h1 className="display-1">{cat.name}</h1>
            <p className="lede">{cat.line}</p>
            <p className="measure muted">{cat.description}</p>
          </div>
        </div>
      </section>

      {/* ★ textured ground behind the grid */}
      <section className="section band--white textured">
        <div className="container">
          {list.length === 0 ? (
            <p className="muted">Pieces to follow.</p>
          ) : (
            <div className="grid grid--3">
              {list.map((p) => (
                <PieceCard key={p.slug} piece={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
