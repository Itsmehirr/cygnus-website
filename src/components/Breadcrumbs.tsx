import Link from "next/link";
import { breadcrumbSchema, type Crumb } from "@/lib/schema";
import { JsonLd } from "./JsonLd";

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <ol>
          {items.map((it, i) => {
            const last = i === items.length - 1;
            return (
              <li key={it.href}>
                {last ? (
                  <span aria-current="page">{it.name}</span>
                ) : (
                  <Link href={it.href}>{it.name}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbSchema(items)} />
    </>
  );
}
