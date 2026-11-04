import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container--narrow stack--loose center">
        <p className="eyebrow">Not found</p>
        <h1 className="display-2">This page has no form yet.</h1>
        <p className="lede">
          The address may have changed, or the piece may not be in the
          Sanctuary.
        </p>
        <p>
          <Link href="/" className="link">
            Return to the house
          </Link>
        </p>
      </div>
    </section>
  );
}
