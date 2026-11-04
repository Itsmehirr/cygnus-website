import type { Metadata } from "next";
import { SITE_URL, site } from "@/content/site";

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
};

/** Per-page metadata with canonical, Open Graph and Twitter cards filled in. */
export function pageMeta({
  title,
  description,
  path,
  image,
  type = "website",
}: PageMetaInput): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImage = image ? `${SITE_URL}${image}` : `${SITE_URL}/og.jpg`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — ${site.name}`,
      description,
      url,
      siteName: site.name,
      type,
      locale: "en_GB",
      images: [{ url: ogImage, width: 1200, height: 630, alt: site.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${site.name}`,
      description,
      images: [ogImage],
    },
  };
}
