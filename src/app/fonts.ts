import localFont from "next/font/local";

/**
 * Body — Work Sans (open source, self-hosted from @fontsource).
 * Brand book: Work Sans Regular for body copy, sentence case.
 */
export const bodyFont = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/work-sans/files/work-sans-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/work-sans/files/work-sans-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../node_modules/@fontsource/work-sans/files/work-sans-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-body-family",
  display: "swap",
});

/**
 * Display — Chronicle Display (Hoefler&Co) is the brand's heading face.
 * It is a licensed typeface, so the files are not in this repository.
 *
 * Until the licensed woff2 files are added, Newsreader (a Scotch-Roman-
 * inspired open-source serif) stands in so proportions can be judged.
 *
 * To switch: copy ChronicleDisplay-Roman.woff2 and ChronicleDisplay-Italic.woff2
 * into src/app/fonts/ and replace the `src` array below with:
 *   { path: "./fonts/ChronicleDisplay-Roman.woff2",  weight: "400", style: "normal" },
 *   { path: "./fonts/ChronicleDisplay-Italic.woff2", weight: "400", style: "italic" },
 */
export const displayFont = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/newsreader/files/newsreader-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/newsreader/files/newsreader-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-display-family",
  display: "swap",
});
