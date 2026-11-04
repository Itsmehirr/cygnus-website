import { site } from "./site";

/**
 * Short, direct answers in the house's register. These are the sentences an
 * answer engine will lift, so each one states a fact plainly and stops.
 * Marked TODO where the house must confirm specifics.
 */
export const faq = [
  {
    q: "What is Cygnus?",
    a: site.definition,
  },
  {
    q: "When was Cygnus founded?",
    a: "Cygnus was founded in 2003.",
  },
  {
    q: "What is grown carbon?",
    a: "Grown carbon is diamond grown in controlled conditions rather than mined. It is chemically and optically diamond. Cygnus works with grown carbon because it can be cut to geometries that nature’s inheritance never required.",
  },
  {
    q: "What are proprietary diamond geometries?",
    a: "Cut forms designed and trademarked by Cygnus rather than inherited from traditional cuts. Each geometry is engineered for how it holds and returns light, and each is protected as the house’s own.",
  },
  {
    q: "How is a Cygnus piece acquired?",
    a: "By enquiry. Every piece in the Sanctuary leads to a conversation with the house rather than a checkout. We reply personally and in order.",
  },
  {
    q: "Can a piece be seen in person?",
    a: "Yes, by private appointment. Request one from the piece’s page, or through a Cygnature registration, and the house will write to you with times.",
  },
  {
    q: "What is Cygnature?",
    a: "Cygnature is the bespoke service of Cygnus: a commission designed around one person, from geometry to finished piece. It begins with a registration and a note from the house.",
  },
  {
    q: "How should a Cygnus piece be cared for?",
    // TODO: confirm care guidance with the house.
    a: "Store each piece separately, away from other jewellery. Keep it from cosmetics and perfume, and clean it with a soft cloth. The house will care for any piece on request.",
  },
] as const;
