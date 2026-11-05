import fs from "node:fs";
import path from "node:path";

/**
 * Width and height of an image under /public, read from its header at build
 * time (JPEG SOFn, PNG IHDR). Used to give media boxes their true aspect ratio.
 */
export function imageDims(src: string, fallback = { w: 4, h: 5 }): { w: number; h: number } {
  try {
    const b = fs.readFileSync(path.join(process.cwd(), "public", src));
    if (b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG") return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length) {
        if (b[i] !== 0xff) {
          i++;
          continue;
        }
        const m = b[i + 1];
        const len = b.readUInt16BE(i + 2);
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
        i += 2 + len;
      }
    }
  } catch {}
  return fallback;
}
