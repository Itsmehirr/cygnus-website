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
  /** Roman numeral shown beside the name in the menus. */
  numeral: string;
  /** Short line used on tiles. */
  line: string;
  /** Explicit sentence for metadata. */
  description: string;
  /** Longer paragraph for the collection page and its panel in the Design Sanctuary. */
  story: string;
  /** The picture that stands for the collection: its panel in the Design Sanctuary and the top of its page. */
  hero: { src: string; alt: string };
  /** ★★ in the sitemap: a hairline frame treatment specific to this page. */
  framed?: boolean;
};

/**
 * The house's collections, in order. The names are the house's; the lines,
 * descriptions and stories are placeholders.
 * TODO: replace with the house's approved collection texts.
 */
export const collections: Collection[] = [
  {
    slug: "lumen",
    name: "Lumen",
    numeral: "I",
    line: "Light, given structure.",
    description:
      "Lumen is a Cygnus collection: engineered diamond geometries from grown carbon, cut for the way they hold and return light, set in noble metals.",
    story:
      "Lumen takes its name from light. Each piece is built around a geometry cut to gather it and give it back, so that the stone, not the setting, carries the form.",
    hero: { src: "/images/pieces/lumen-ring-02.jpg", alt: "Lumen, a Cygnus collection: rings resting on cut stone" },
    framed: true,
  },
  {
    slug: "apeiron",
    name: "Apeiron",
    numeral: "II",
    line: "Form without limit.",
    description:
      "Apeiron is a Cygnus collection: engineered diamond geometries from grown carbon, set in noble metals as one continuous line.",
    story:
      "Apeiron is the Greek for the boundless. Its pieces follow a single line with no beginning and no end, turning round the body as one structure.",
    hero: { src: "/images/pieces/apeiron-necklace-01.jpg", alt: "Apeiron, a Cygnus collection: a single line worn at the neck" },
    framed: true,
  },
];

/** The film behind the arches of the Design Sanctuary (then full viewport). */
export const sanctuaryFilm = { src: "/media/sanctuary.mp4", poster: "/media/sanctuary-poster.jpg" };

export const getCategory = (slug: string) =>
  categories.find((c) => c.slug === slug);

export const getCollection = (slug: string) =>
  collections.find((c) => c.slug === slug);
