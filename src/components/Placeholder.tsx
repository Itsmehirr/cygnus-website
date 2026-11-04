/**
 * Tonal image placeholder. Swap for next/image once photography is in
 * (see Picture.tsx, which does that automatically when a file exists).
 */
export function Placeholder({
  ratio = "portrait",
  label = "Photography to follow",
  tone = "beige",
}: {
  ratio?: "portrait" | "square" | "landscape" | "tall";
  label?: string;
  tone?: "beige" | "charcoal";
}) {
  return (
    <div
      className={`ph ph--${ratio}${tone === "charcoal" ? " ph--charcoal" : ""}`}
      data-label={label}
      role="img"
      aria-label={label}
    />
  );
}
