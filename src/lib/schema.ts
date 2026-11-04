import { SITE_URL, site } from "@/content/site";
import type { Piece } from "@/content/pieces";

/* JSON-LD builders. Every page carries Organization + WebSite via the layout;
   pages add their own type below. */

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: site.name,
    url: SITE_URL,
    foundingDate: site.founded,
    description: site.definition,
    email: site.email,
    logo: `${SITE_URL}/wordmark.svg`,
    brand: { "@type": "Brand", name: site.name },
    sameAs: site.social.map((s) => s.href),
    knowsAbout: [
      "High jewellery",
      "Laboratory-grown diamonds",
      "Diamond cutting geometries",
      "Bespoke jewellery commissions",
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: site.name,
    inLanguage: site.locale,
    publisher: { "@id": ORG_ID },
  };
}

export type Crumb = { name: string; href: string };

export function breadcrumbSchema(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.href}`,
    })),
  };
}

export function collectionPageSchema(input: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: `${SITE_URL}${input.path}`,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
  };
}

/* Pieces are acquired by enquiry, so no Offer/price is declared:
   Google only validates Product rich results when a price is present,
   and an empty Offer would raise warnings rather than help. */
export function productSchema(
  piece: Piece,
  collectionName: string,
  categoryName: string,
) {
  const url = `${SITE_URL}/sanctuary/pieces/${piece.slug}`;
  const additionalProperty = [
    { "@type": "PropertyValue", name: "Collection", value: collectionName },
    piece.geometry && {
      "@type": "PropertyValue",
      name: "Diamond geometry",
      value: piece.geometry,
    },
    piece.stones && {
      "@type": "PropertyValue",
      name: "Stones",
      value: piece.stones,
    },
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${piece.name} — Cygnus`,
    description: piece.description,
    url,
    image: piece.images.map((i) => `${SITE_URL}${i.src}`),
    brand: { "@type": "Brand", name: site.name },
    manufacturer: { "@id": ORG_ID },
    category: categoryName,
    ...(piece.metal ? { material: piece.metal } : {}),
    additionalProperty,
    potentialAction: {
      "@type": "CommunicateAction",
      name: "Enquire",
      target: `${url}#enquire`,
    },
  };
}

export function faqSchema(items: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

export function serviceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Cygnature — bespoke high jewellery by Cygnus",
    serviceType: "Bespoke jewellery commission",
    provider: { "@id": ORG_ID },
    url: `${SITE_URL}/cygnature`,
    description:
      "Cygnature is the bespoke service of Cygnus: a commission designed around one person, from diamond geometry to finished piece. It begins with a registration and a note from the house.",
    // TODO: confirm where the house serves.
    areaServed: "Worldwide",
  };
}
