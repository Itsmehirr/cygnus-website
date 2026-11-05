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
 * Display — the brand book names Chronicle Display (Hoefler&Co), a Scotch
 * Roman; it is licensed, so its files are not in this repository.
 *
 * Until the licence lands, Newsreader (Production Type, open source) stands
 * in. It is drawn from the same Scotch-Roman tradition and ships as a
 * variable font with an optical-size axis, so headlines take the 72 pt
 * display cut (higher contrast, tighter fit) and small italics the text cut —
 * the closest open match to Chronicle Display's own optical range.
 *
 * The files in ./fonts are the fontsource Latin cut with the weight axis
 * pinned at 400 (the only weight the site sets) and the optical-size axis
 * kept: 122 KB for both styles instead of 276 KB.
 *   fonttools varLib.instancer newsreader-latin-standard-normal.woff2 wght=400
 *
 * To switch: copy ChronicleDisplay-Roman.woff2 and ChronicleDisplay-Italic.woff2
 * into src/app/fonts/ and replace the `src` array below with:
 *   { path: "./fonts/ChronicleDisplay-Roman.woff2",  weight: "400", style: "normal" },
 *   { path: "./fonts/ChronicleDisplay-Italic.woff2", weight: "400", style: "italic" },
 */
export const displayFont = localFont({
  src: [
    { path: "./fonts/newsreader-opsz-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/newsreader-opsz-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-display-family",
  display: "swap",
});

/**
 * Script — the Sanctuary's room titles, after collabcapitolium.fr, which sets
 * them in Edwardian Script (licensed). Pinyon Script (Nicole Fally, open
 * source, from @fontsource) is the closest open formal roundhand.
 */
export const scriptFont = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/pinyon-script/files/pinyon-script-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-script-family",
  display: "swap",
});
