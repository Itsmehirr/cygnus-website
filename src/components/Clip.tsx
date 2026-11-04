import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { Placeholder } from "./Placeholder";

type Ratio = "portrait" | "square" | "landscape" | "tall";

const exists = (src: string) => fs.existsSync(path.join(process.cwd(), "public", src));

/**
 * A muted, looping clip at /public{src} when the file exists; its poster
 * (same path with .jpg, or `poster`) as a still when only that exists;
 * otherwise a tonal placeholder. Server component: dropping an MP4 into
 * /public/media is enough.
 */
export function Clip({
  src,
  poster,
  ratio = "landscape",
  label = "Film to follow",
  story = false,
  sizes = "(min-width: 880px) 60vw, 100vw",
}: {
  src: string;
  poster?: string;
  ratio?: Ratio;
  label?: string;
  story?: boolean;
  sizes?: string;
}) {
  const posterSrc = poster ?? src.replace(/\.(mp4|webm)$/, ".jpg");
  const hasVideo = exists(src);
  const hasPoster = exists(posterSrc);

  if (hasVideo) {
    return (
      <video
        className={`clip clip--${ratio}`}
        src={src}
        poster={hasPoster ? posterSrc : undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
        {...(story ? { "data-story": true } : {})}
      />
    );
  }

  if (hasPoster) {
    // Shape comes from the .clip--<ratio> class (not inline), so a context such
    // as the Sanctuary's full-bleed film can override it in CSS.
    return (
      <div className={`clip__still clip--${ratio}`}>
        <Image src={posterSrc} alt={label} fill sizes={sizes} style={{ objectFit: "cover" }} />
      </div>
    );
  }

  return <Placeholder ratio={ratio} label={label} />;
}
