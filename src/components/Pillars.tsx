import { pillars } from "@/content/site";

/** The three brand pillars with the book's hairline-and-dot rule between them. */
export function Pillars() {
  return (
    <div className="pillars">
      {pillars.map((p, i) => (
        <PillarWithRule key={p.name} index={i} name={p.name} text={p.text} />
      ))}
    </div>
  );
}

function PillarWithRule({
  index,
  name,
  text,
}: {
  index: number;
  name: string;
  text: string;
}) {
  return (
    <>
      {index > 0 && (
        <div className="pillars__rule" aria-hidden="true">
          <span className="rule" />
        </div>
      )}
      <div className="pillar">
        <h3>{name}</h3>
        <p>{text}</p>
      </div>
    </>
  );
}
