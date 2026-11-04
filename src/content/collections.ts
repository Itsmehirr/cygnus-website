export type CategorySlug = "rings" | "earrings" | "necklaces" | "bracelets";

export type Category = {
  slug: CategorySlug;
  name: string;
  /** One line under the title. Brand register: spare, concrete. */
  line: string;
  /** One explicit sentence for metadata and answer engines. */
  description: string;
};

export const categories: Category[] = [
  {
    slug: "rings",
    name: "Rings",
    line: "Geometry, held at the hand.",
    description:
      "Cygnus rings: engineered diamond geometries from grown carbon, set in noble metals. Each ring is acquired by enquiry.",
  },
  {
    slug: "earrings",
    name: "Earrings",
    line: "Light, carried at the ear.",
    description:
      "Cygnus earrings: engineered diamond geometries from grown carbon, set in noble metals. Each pair is acquired by enquiry.",
  },
  {
    slug: "necklaces",
    name: "Necklaces",
    line: "Structure that follows the line of the neck.",
    description:
      "Cygnus necklaces: engineered diamond geometries from grown carbon, set in noble metals. Each necklace is acquired by enquiry.",
  },
  {
    slug: "bracelets",
    name: "Bracelets",
    line: "Form that moves with the wrist.",
    description:
      "Cygnus bracelets: engineered diamond geometries from grown carbon, set in noble metals. Each bracelet is acquired by enquiry.",
  },
];

export type Collection = {
  slug: string;
  name: string;
  /** Short line used on tiles. */
  line: string;
  /** Explicit sentence for metadata. */
  description: string;
  /** Longer paragraph for the collection page. */
  story: string;
  /** ★★ in the sitemap: a hairline frame treatment specific to this page. */
  framed?: boolean;
};

export const collections: Collection[] = [
  {
    slug: "pearl",
    name: "Pearl",
    line: "The first collection.",
    description:
      "Pearl is the first Cygnus collection: pearls paired with the house’s engineered diamond geometries, set in noble metals.",
    // TODO: replace with the house's approved collection text.
    story:
      "Pearl is where the house begins: the oldest organic gem set against the newest geometry. Each piece holds the two in balance, so that neither explains the other.",
    framed: true,
  },
];

export const getCategory = (slug: string) =>
  categories.find((c) => c.slug === slug);

export const getCollection = (slug: string) =>
  collections.find((c) => c.slug === slug);
