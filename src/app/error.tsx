"use client";

import Link from "next/link";

/** Something failed while rendering: say so plainly and offer the way back. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="section" style={{ paddingTop: "calc(72px + var(--space-block))" }}>
      <div className="container--narrow stack--loose center">
        <p className="label">Something went wrong</p>
        <h1 className="display-2">This page did not load.</h1>
        <p className="lede">The house has been told. You can try again, or return to the start.</p>
        <p>
          <button type="button" className="btn btn--ghost" onClick={() => reset()}>
            <span>Try again</span>
            <span className="btn__arrow" aria-hidden="true" />
          </button>
        </p>
        <p>
          <Link href="/" className="link">
            Return to the house
          </Link>
        </p>
      </div>
    </main>
  );
}
