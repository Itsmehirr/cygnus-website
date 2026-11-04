/**
 * The CYGNUS wordmark, set in the display face with the book's wide tracking.
 * Replace the inner text with the supplied SVG once the vector is in:
 * keep the surrounding element and its aria-label so the mark stays accessible.
 */
export function Wordmark({
  size = "nav",
  as: Tag = "span",
}: {
  size?: "nav" | "hero" | "footer" | "inline" | "loader" | "menu" | "chapter";
  as?: "span" | "div";
}) {
  return (
    <Tag className={`wordmark wordmark--${size}`} aria-label="Cygnus">
      Cygnus
    </Tag>
  );
}
