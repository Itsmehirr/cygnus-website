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
  images: PieceImage[];
  /** Until the house supplies final details, the page shows "Details to follow". */
  placeholder?: boolean;
};

/**
 * Placeholder pieces so every route in the sitemap renders.
 * Replace with the house's pieces: one entry per piece, images under /public/images/pieces/.
 */
export const pieces: Piece[] = [
  {
    slug: "pearl-ring",
    name: "Pearl Ring",
    collection: "pearl",
    category: "rings",
    description:
      "A ring from the Pearl collection by Cygnus: a pearl held by an engineered diamond geometry, set in noble metal.",
    images: [
      { src: "/images/pieces/pearl-ring-01.jpg", alt: "Pearl Ring by Cygnus, worn at the hand" },
      { src: "/images/pieces/pearl-ring-02.jpg", alt: "Pearl Ring by Cygnus, seen as an object" },
    ],
    placeholder: true,
  },
  {
    slug: "pearl-earrings",
    name: "Pearl Earrings",
    collection: "pearl",
    category: "earrings",
    description:
      "Earrings from the Pearl collection by Cygnus: pearls carried by engineered diamond geometries, set in noble metal.",
    images: [
      { src: "/images/pieces/pearl-earrings-01.jpg", alt: "Pearl Earrings by Cygnus, worn at the ear" },
      { src: "/images/pieces/pearl-earrings-02.jpg", alt: "Pearl Earrings by Cygnus, seen as objects" },
    ],
    placeholder: true,
  },
  {
    slug: "pearl-necklace",
    name: "Pearl Necklace",
    collection: "pearl",
    category: "necklaces",
    description:
      "A necklace from the Pearl collection by Cygnus: pearls and engineered diamond geometries following the line of the neck, set in noble metal.",
    images: [
      { src: "/images/pieces/pearl-necklace-01.jpg", alt: "Pearl Necklace by Cygnus, worn" },
      { src: "/images/pieces/pearl-necklace-02.jpg", alt: "Pearl Necklace by Cygnus, seen as an object" },
    ],
    placeholder: true,
  },
  {
    slug: "pearl-bracelet",
    name: "Pearl Bracelet",
    collection: "pearl",
    category: "bracelets",
    description:
      "A bracelet from the Pearl collection by Cygnus: pearls and engineered diamond geometries that move with the wrist, set in noble metal.",
    images: [
      { src: "/images/pieces/pearl-bracelet-01.jpg", alt: "Pearl Bracelet by Cygnus, worn at the wrist" },
      { src: "/images/pieces/pearl-bracelet-02.jpg", alt: "Pearl Bracelet by Cygnus, seen as an object" },
    ],
    placeholder: true,
  },
];

export const getPiece = (slug: string) => pieces.find((p) => p.slug === slug);
export const piecesByCategory = (category: CategorySlug) =>
  pieces.filter((p) => p.category === category);
export const piecesByCollection = (collection: string) =>
  pieces.filter((p) => p.collection === collection);
