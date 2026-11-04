/**
 * Site-wide facts. Everything an answer engine might quote lives here once,
 * so the same wording appears in metadata, JSON-LD, llms.txt and on the page.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cygnus.example"
).replace(/\/$/, "");

export const site = {
  name: "Cygnus",
  founded: "2003",
  tagline: "Where Intellect Becomes Form.",

  /**
   * The one-sentence definition of the house. Keep it identical everywhere
   * it appears: this repetition is what lets search and answer engines
   * state what Cygnus is without guessing.
   */
  definition:
    "Cygnus is a contemporary high jewellery house, founded in 2003, that engineers proprietary diamond geometries from grown carbon and sets them in noble metals.",

  /** Slightly longer description for Organization schema and llms.txt. */
  description:
    "Cygnus is a contemporary high jewellery house founded in 2003. The house designs around protected, trademarked diamond geometries conceived through contemporary ingenuity rather than inherited tradition, transforming grown carbon and noble metals into sculptural forms of light. Pieces are acquired by enquiry; bespoke commissions are made through the Cygnature service.",

  // TODO: confirm with the house.
  email: "hello@cygnus.example",

  locale: "en",

  /** Menu items: label, the line it expands into on the Menu page, and its numeral. */
  nav: [
    { href: "/design", label: "Design", note: "The house", line: "where intellect becomes form", numeral: "I" },
    { href: "/sanctuary", label: "Sanctuary", note: "Collections", line: "the collections", numeral: "II" },
    { href: "/cygnature", label: "Cygnature", note: "Bespoke", line: "bespoke, by Cygnus", numeral: "III" },
    { href: "/info", label: "Info", note: "Facts & contact", line: "the house, in plain terms", numeral: "IV" },
  ],

  /** Home copy, in the house's register. */
  home: {
    line: "Jewellery as wearable art.",
    pressed: "We believe jewellery is more than ornament. It is thought, given form.",
    approachLabel: "The house",
    approach:
      "Cygnus creates high jewellery through proprietary diamond geometries, advanced science and contemporary design, transforming grown carbon into new forms of structural beauty.",
    making: [
      {
        title: "Engineered beauty.",
        text: "Proprietary geometries, cut from grown carbon and set in noble metal. The making is slow and exact; the result is structure you can wear.",
      },
      {
        title: "The geometry of light.",
        text: "Each geometry is conceived here, not inherited: a study in proportion, reflection and movement, protected as the house's own.",
      },
    ],
    closing: "Where intellect becomes form.",
  },

  // TODO: add live profiles. Used for footer links and Organization.sameAs.
  social: [] as { label: string; href: string }[],

  /**
   * Home story video. Flip `ready` to true once the files are in /public/media.
   * Recommended: H.264 MP4 (1080p, ≤ 8 MB) + a JPEG poster frame.
   */
  storyVideo: {
    ready: false,
    src: "/media/story.mp4",
    poster: "/media/story-poster.jpg",
    caption: "The Cygnus story",
  },
} as const;

export const pillars = [
  {
    name: "Engineered",
    text: "Proprietary diamond geometries, advanced science and architectural precision transform jewellery into structural art.",
  },
  {
    name: "Celestial",
    text: "Inspired by Cygnus, the constellation where geometry, light and emotion converge.",
  },
  {
    name: "Timeless",
    text: "Beyond trends and conventional status: collectible pieces designed to endure as objects of lasting beauty.",
  },
] as const;

export const manifesto = {
  short: [
    "We believe jewellery is more than ornament. It is thought, given form.",
    "We challenge convention through geometry, science and human ingenuity, transforming grown carbon into structural art. Quietly bold. Precisely considered. Where light takes form.",
  ],
  signOff: "It creates what comes next.",
  long: [
    "We believe jewellery can be more than ornament.",
    "It can be architecture.",
    "It can be thought, given form.",
    "It can be light, made permanent.",
    "",
    "We look beyond what has always been done to imagine what has yet to exist.",
    "Where tradition sees the diamond as nature’s inheritance, we see a material waiting to be reimagined.",
    "",
    "Through geometry, science and human ingenuity, we engineer new possibilities, shaping grown carbon into forms of uncommon beauty. We do not design for convention. We design for those who have moved beyond it.",
    "",
    "Quietly confident.",
    "Precisely considered.",
    "Unbound by expectation.",
    "",
    "Because true luxury does not ask to be recognised.",
    "It is recognised by those who understand.",
    "",
    "Cygnus is where intellect becomes form, where light becomes structure, and where jewellery becomes art.",
  ],
} as const;
