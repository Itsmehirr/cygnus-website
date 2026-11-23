import type { CategorySlug } from "./collections";

export type PieceImage = { src: string; alt: string };

export type Piece = {
  slug: string;
  name: string;
  collection: string; // collection slug
  category: CategorySlug;
  /** One explicit sentence: what it is, in what, from what. Used in metadata. */
  description: string;
  /** Spare editorial paragraph for the page. */
  story?: string;
  metal?: string;
  geometry?: string;
  stones?: string;
  dimensions?: string;
  /** House reference, shown under the price line. */
  reference?: string;
  images: PieceImage[];
  /** Until the house supplies final details, the page shows "Details to follow". */
  placeholder?: boolean;
};

/** Care guidance shared by every piece until the house supplies its own. TODO: confirm. */
export const careNote =
  "Store the piece on its own, away from other jewellery. Keep it from cosmetics and perfume, and clean it with a soft cloth. The house will care for any piece on request.";

/**
 * Placeholder pieces so every route in the sitemap renders: two under each
 * collection, one in each category.
 * Replace with the house's pieces: one entry per piece, images under /public/images/pieces/.
 */
export const pieces: Piece[] = [
  {
    slug: "lumen-ring",
    reference: "CYG-LUM-01",
    name: "Lumen Ring",
    collection: "lumen",
    category: "rings",
    description:
      "A ring from the Lumen collection by Cygnus: an engineered diamond geometry from grown carbon, set in noble metal.",
    images: [
      { src: "/images/pieces/lumen-ring-01.jpg", alt: "Lumen Ring by Cygnus, worn at the hand" },
      { src: "/images/pieces/lumen-ring-02.jpg", alt: "Lumen Ring by Cygnus, seen as an object" },
    ],
    placeholder: true,
  },
  {
    slug: "lumen-earrings",
    reference: "CYG-LUM-02",
    name: "Lumen Earrings",
    collection: "lumen",
    category: "earrings",
    description:
      "Earrings from the Lumen collection by Cygnus: engineered diamond geometries from grown carbon, set in noble metal.",
    images: [
      { src: "/images/pieces/lumen-earrings-01.jpg", alt: "Lumen Earrings by Cygnus, worn at the ear" },
      { src: "/images/pieces/lumen-earrings-02.jpg", alt: "Lumen Earrings by Cygnus, seen as objects" },
    ],
    placeholder: true,
  },
  {
    slug: "apeiron-necklace",
    reference: "CYG-APR-01",
    name: "Apeiron Necklace",
    collection: "apeiron",
    category: "necklaces",
    description:
      "A necklace from the Apeiron collection by Cygnus: engineered diamond geometries following the line of the neck, set in noble metal.",
    images: [
      { src: "/images/pieces/apeiron-necklace-01.jpg", alt: "Apeiron Necklace by Cygnus, worn" },
      { src: "/images/pieces/apeiron-necklace-02.jpg", alt: "Apeiron Necklace by Cygnus, seen as an object" },
    ],
    placeholder: true,
  },
  {
    slug: "apeiron-bracelet",
    reference: "CYG-APR-02",
    name: "Apeiron Bracelet",
    collection: "apeiron",
    category: "bracelets",
    description:
      "A bracelet from the Apeiron collection by Cygnus: engineered diamond geometries that move with the wrist, set in noble metal.",
    images: [
      { src: "/images/pieces/apeiron-bracelet-01.jpg", alt: "Apeiron Bracelet by Cygnus, worn at the wrist" },
      { src: "/images/pieces/apeiron-bracelet-02.jpg", alt: "Apeiron Bracelet by Cygnus, seen as an object" },
    ],
    placeholder: true,
  },
];

export const getPiece = (slug: string) => pieces.find((p) => p.slug === slug);
export const piecesByCategory = (category: CategorySlug) =>
  pieces.filter((p) => p.category === category);
export const piecesByCollection = (collection: string) =>
  pieces.filter((p) => p.collection === collection);
