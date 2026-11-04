# Cygnus — website

The site of Cygnus, a contemporary high jewellery house (founded 2003). Built with Next.js 16 (App Router, TypeScript), self-hosted fonts, Lenis + GSAP for the scroll grammar, and no CMS yet: content lives in typed files under `src/content`.

The build plan, reference deconstructions and open questions live in the Claude Doc **Cygnus Website — Build Plan** (4 Nov 2026).

## Run

```bash
npm ci
cp .env.example .env.local   # fill in when ready; forms dry-run without it
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

## Structure

```
src/app
  layout.tsx            html/body, fonts, JSON-LD, ScrollProvider, cursor
  (site)/               every page with header + footer
    page.tsx            Home: story video → statement → the making → Pearl → Cygnature
    design/             the House
    sanctuary/          collections: by category, by collection, piece pages → enquiry
    cygnature/          bespoke walkthrough → registration → email from the house
    info/               facts, questions answered, write to us
  menu/                 The House menu: charcoal page with the pointer-following light
  actions.ts            server actions: enquiry and registration (honeypot, validation, mail)
  sitemap.ts robots.ts llms.txt/   SEO / AEO / GEO surface
src/components          chrome (header, footer, cursor, loader, sound), motion, home sections
src/content             site facts, nav, home copy, collections, pieces, FAQ
src/lib                 gsap registration, schema builders, metadata helper, mail adapter
public/media            story video and clips (see "Assets")
public/images           photography (see "Assets")
```

## Assets: where to drop them

Everything renders a tonal placeholder until the file exists; no code change is needed when it does.

| Asset | Path | Notes |
| --- | --- | --- |
| Story video | `public/media/story.mp4` + `story-poster.jpg` | H.264, ≤ 8 MB, muted loop; then set `storyVideo.ready` in `src/content/site.ts` or just add the file |
| Making clips | `public/media/making-01.mp4`, `making-02.mp4` | 8–15 s loops |
| Atelier clip | `public/media/atelier.mp4` | Cygnature |
| Piece photography | `public/images/pieces/<slug>-01.jpg`, `-02.jpg` | paths are listed per piece in `src/content/pieces.ts` |
| Design imagery | `public/images/design/geometry-01.jpg`, `light-01.jpg` | |
| Cygnature imagery | `public/images/cygnature/atelier-01.jpg`, `hands.jpg` | |
| Wordmark | `public/wordmark.svg` | replace the placeholder; keep the name |
| OG image, favicon | `public/og.jpg`, `public/favicon.ico` | placeholders generated in brand colours |

### Fonts

Work Sans is open source and self-hosted from `@fontsource/work-sans`. Chronicle Display (Hoefler&Co) needs a web licence: put `ChronicleDisplay-Roman.woff2` and `ChronicleDisplay-Italic.woff2` in `src/app/fonts/` and switch the `src` array in `src/app/fonts.ts` (instructions are in the file). Newsreader stands in until then.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | public origin, no trailing slash (canonicals, sitemap, JSON-LD, llms.txt) |
| `RESEND_API_KEY` | transactional mail; unset = dry run logged to the server console |
| `MAIL_FROM` | verified sender, e.g. `Cygnus <hello@cygnus.example>` |
| `MAIL_TO` | house inbox for enquiries and registrations |

## Motion

- `ScrollProvider` mounts one Lenis instance and feeds ScrollTrigger from GSAP's ticker. Under `prefers-reduced-motion: reduce` nothing is mounted and every component renders its resting state.
- Home hero: a sticky stage inside a 190 vh section; the scrubbed timeline shrinks the video into a soft-white frame, fades the side labels and docks the italic line under the top edge. The header wordmark appears once the line has docked (`body.is-docked`).
- `Statement` reveals words as they cross the viewport; `Reveal` fades framed media in once; `Drift` is a small scrubbed parallax.
- Cursor (dot + lagging ring, labels from `data-cursor`) mounts only for fine pointers.

## Phases

0. Foundation — routes, design system, content model, forms, SEO layer. Done.
1. Home scroll — hero, statements, bands, teaser, Cygnature band, cursor, sound, loader, Menu page. Done (this commit).
2. Sanctuary chapter engine — pinned header, arcade, expand-to-viewport, panels, chapter pill.
3. Menu and Home WebGL relief.
4. Piece pages in the Zoya layout, Cygnature final, Info final.
5. Polish and launch.
