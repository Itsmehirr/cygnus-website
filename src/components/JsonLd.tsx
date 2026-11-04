/** Emits one JSON-LD block. Pass the output of a builder from lib/schema.ts. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD is data, not markup; escaping "<" keeps it from closing the tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
