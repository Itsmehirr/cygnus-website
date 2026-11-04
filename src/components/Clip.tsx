import fs from "node:fs";
import path from "node:path";
import { Placeholder } from "./Placeholder";

type Ratio = "portrait" | "square" | "landscape" | "tall";

/**
 * A muted, looping clip at /public{src} when the file exists, otherwise a
 * tonal placeholder. Server component: dropping an MP4 into /public/media is
 * enough. Pass `poster` for the first frame.
 */
export function Clip({
  src,
  poster,
  ratio = "landscape",
  label = "Film to follow",
  story = false,
}: {
  src: string;
  poster?: string;
  ratio?: Ratio;
  label?: string;
  story?: boolean;
}) {
  const exists = fs.existsSync(path.join(process.cwd(), "public", src));
  if (!exists) return <Placeholder ratio={ratio} label={label} />;

  return (
    <video
      className={`clip clip--${ratio}`}
      src={src}
      poster={poster}
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
