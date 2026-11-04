import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { serviceSchema } from "@/lib/schema";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Picture } from "@/components/Picture";
import { ButtonLink } from "@/components/Button";

const description =
  "Cygnature is the bespoke service of Cygnus: a commission designed around one person, from diamond geometry to finished piece. It begins with a registration and a note from the house.";

export const metadata: Metadata = pageMeta({
  title: "Cygnature — Bespoke",
  description,
  path: "/cygnature",
});

const steps = [
  {
    title: "A conversation",
    text: "It begins with what you have in mind, or with nothing more than a feeling for a form. The house listens before it draws.",
  },
  {
    title: "The geometry",
    text: "From the conversation, a geometry is chosen or conceived: the cut that will hold the light the way the piece needs it held.",
  },
  {
    title: "The design",
    text: "Drawings, then a model. Proportion, metal and setting are decided together, and nothing is fixed until you have seen it.",
  },
  {
    title: "The making",
    text: "Grown carbon is cut to the geometry and set by hand in noble metal. The house keeps you informed, without ceremony.",
  },
  {
    title: "The reveal",
    text: "The piece is presented to you alone, in its own moment. It is yours, and it is the only one.",
  },
];

export default function CygnaturePage() {
  return (
    <>
      <JsonLd data={serviceSchema()} />

      <section className="section--top">
        <div className="container stack--loose">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Cygnature", href: "/cygnature" }]} />
          <div className="split">
            <div className="stack">
              <p className="eyebrow">Cygnature</p>
              <h1 className="display-1">Bespoke, by Cygnus.</h1>
              <p className="lede">{description}</p>
              <ButtonLink href="/cygnature/register">Register your interest</ButtonLink>
            </div>
            <Picture
              src="/images/cygnature/atelier-01.jpg"
              alt="The Cygnus atelier at work on a bespoke commission"
              ratio="landscape"
              sizes="(min-width: 880px) 58vw, 100vw"
              label="The atelier"
            />
          </div>
        </div>
      </section>

      {/* ★ Info about the service — a walkthrough, on a textured ground */}
      <section className="section band--white textured" aria-labelledby="walkthrough">
        <div className="container--narrow stack--loose">
          <h2 id="walkthrough" className="eyebrow eyebrow--ink">
            How a commission unfolds
          </h2>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={s.title} className="step">
                <span className="step__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="begin">
        <div className="container--narrow stack--loose center">
          <h2 id="begin" className="display-2">
            Begin with a registration.
          </h2>
          <p className="lede">
            Leave your details and a note. A member of the atelier will write
            to you to open the conversation; until then, nothing is required
            of you.
          </p>
          <ButtonLink href="/cygnature/register">Register</ButtonLink>
        </div>
      </section>
    </>
  );
}
