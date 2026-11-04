import { SITE_URL, site } from "@/content/site";
import { categories, collections } from "@/content/collections";
import { pieces } from "@/content/pieces";
import { faq } from "@/content/faq";

export const dynamic = "force-static";

/**
 * /llms.txt — the llmstxt.org convention: a concise, Markdown description of the
 * site for language models, with the same definition the rest of the site uses.
 */
export function GET() {
  const lines: string[] = [
    `# ${site.name}`,
    "",
    `> ${site.definition}`,
    "",
    site.description,
    "",
    "## Facts",
    "",
    `- Founded: ${site.founded}`,
    "- Material: grown carbon (laboratory-grown diamond) and noble metals",
    "- Signature: proprietary, trademarked diamond geometries",
    "- Acquisition: by enquiry; there is no online checkout",
    "- Bespoke: the Cygnature service, by registration",
    `- Contact: ${site.email}`,
    "",
    "## Pages",
    "",
    `- [Design](${SITE_URL}/design): the house's philosophy, the geometry of light, the manifesto`,
    `- [Sanctuary](${SITE_URL}/sanctuary): the collections, by category and by collection`,
    ...categories.map(
      (c) => `- [${c.name}](${SITE_URL}/sanctuary/category/${c.slug}): ${c.description}`,
    ),
    ...collections.map(
      (c) => `- [${c.name} collection](${SITE_URL}/sanctuary/collections/${c.slug}): ${c.description}`,
    ),
    `- [Cygnature](${SITE_URL}/cygnature): the bespoke service, with a walkthrough of how a commission unfolds`,
    `- [Cygnature registration](${SITE_URL}/cygnature/register): register interest in a commission`,
    `- [Info](${SITE_URL}/info): facts about the house, questions answered, care and contact`,
    "",
    "## Pieces",
    "",
    ...pieces.map(
      (p) => `- [${p.name}](${SITE_URL}/sanctuary/pieces/${p.slug}): ${p.description}`,
    ),
    "",
    "## Questions answered",
    "",
    ...faq.flatMap((f) => [`### ${f.q}`, "", f.a, ""]),
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
