import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/site";
import { categories, collections } from "@/content/collections";
import { pieces } from "@/content/pieces";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entry = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly",
  ) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    entry("/", 1, "weekly"),
    entry("/design", 0.8),
    entry("/sanctuary", 0.9, "weekly"),
    ...categories.map((c) => entry(`/sanctuary/category/${c.slug}`, 0.7, "weekly")),
    ...collections.map((c) => entry(`/sanctuary/collections/${c.slug}`, 0.8, "weekly")),
    ...pieces.map((p) => entry(`/sanctuary/pieces/${p.slug}`, 0.6, "monthly")),
    entry("/cygnature", 0.8),
    entry("/cygnature/register", 0.5),
    entry("/info", 0.7),
  ];
}
