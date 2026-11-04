import Link from "next/link";
import type { ReactNode } from "react";

export function ButtonLink({
  href,
  children,
  ghost = false,
}: {
  href: string;
  children: ReactNode;
  ghost?: boolean;
}) {
  return (
    <Link href={href} className={`btn${ghost ? " btn--ghost" : ""}`}>
      <span>{children}</span>
      <span className="btn__arrow" aria-hidden="true" />
    </Link>
  );
}
