import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { serviceSchema } from "@/lib/schema";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Picture } from "@/components/Picture";
import { Clip } from "@/components/Clip";
import { Reveal } from "@/components/motion/Reveal";
import { Statement } from "@/components/home/Statement";
import { RegistrationForm } from "@/components/RegistrationForm";

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

/* Cygnature, the simple layout the client asked for: one video, one picture,
   one text; then the walkthrough; then the registration, in place. */
export default function CygnaturePage() {
  return (
    <>
      <JsonLd data={serviceSchema()} />

      <section className="section--top">
        <div className="container">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Cygnature", href: "/cygnature" }]} />
          <div className="bespoke__grid" style={{ marginTop: "var(--space-block)" }}>
            <Reveal className="bespoke__video">
              <div className="card">
                <Clip src="/media/atelier.mp4" ratio="landscape" label="The atelier" />
              </div>
            </Reveal>
            <Reveal className="bespoke__picture" delay={0.15}>
              <div className="card">
                <Picture
                  src="/images/cygnature/hands.jpg"
                  alt="A Cygnus commission in the making"
                  ratio="tall"
                  sizes="(min-width: 880px) 24vw, 60vw"
                  label="Presence"
                />
              </div>
            </Reveal>
            <div className="bespoke__text">
              <p className="label">Cygnature</p>
              <h1 className="display-2">Bespoke, by Cygnus.</h1>
              <p className="measure muted">{description}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-label="The thought">
        <div className="container--narrow center">
          <Statement
            as="h2"
            text="One person, one geometry, one piece. Nothing is fixed until you have seen it."
            className="quote"
          />
        </div>
      </section>

      {/* ★ the walkthrough, on a textured ground */}
      <section className="section band--white textured" aria-labelledby="walkthrough">
        <div className="container--narrow stack--loose">
          <h2 id="walkthrough" className="label">
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

      <section className="section" aria-labelledby="register-heading" id="register">
        <div className="container">
          <div className="split">
            <div className="stack">
              <p className="label">Registration</p>
              <h2 id="register-heading" className="display-2">
                Begin with a registration.
              </h2>
              <p className="lede">
                Tell us a little, or nothing at all. A member of the atelier writes
                back to every registration to open the conversation; until then,
                nothing is required of you.
              </p>
            </div>
            <RegistrationForm />
          </div>
        </div>
      </section>
    </>
  );
}
