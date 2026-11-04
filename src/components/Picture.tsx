import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { Placeholder } from "./Placeholder";

type Ratio = "portrait" | "square" | "landscape" | "tall";

const ratioValue: Record<Ratio, string> = {
  portrait: "4 / 5",
  square: "1 / 1",
  landscape: "3 / 2",
  tall: "3 / 4",
};

/**
 * Renders the image at /public{src} when the file exists, otherwise a tonal
 * placeholder. Server component: the check runs at build time, so dropping
 * photography into /public/images is enough — no code change needed.
 */
export function Picture({
  src,
  alt,
  ratio = "portrait",
  sizes = "(min-width: 1024px) 33vw, (min-width: 720px) 50vw, 100vw",
  priority = false,
  label,
}: {
  src: string;
  alt: string;
  ratio?: Ratio;
  sizes?: string;
  priority?: boolean;
  label?: string;
}) {
  const exists = fs.existsSync(path.join(process.cwd(), "public", src));
  if (!exists) return <Placeholder ratio={ratio} label={label} />;

  return (
    <div style={{ position: "relative", aspectRatio: ratioValue[ratio] }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}
