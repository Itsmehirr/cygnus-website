# Cygnus — website

The site of Cygnus, a contemporary high jewellery house working in grown carbon (founded 2003). Next.js 16 (App Router, TypeScript), plain CSS, self-hosted fonts, Lenis + GSAP for the scroll grammar, and one raw WebGL relief wall for Home (light stone) and the Menu (dark stone). There is no CMS yet: content lives in typed files under `src/content`.

- Live: https://cygnus-website-eight.vercel.app (Vercel deploys every push to `main`).
- The build plan, the two reference deconstructions and the open questions for the house live in the Claude Doc **Cygnus Website — Build Plan**.

## Run

```bash
npm ci
cp .env.example .env.local   # optional: forms dry-run without it
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
npm run lint
```

## Structure

```
src/app
  layout.tsx            html/body, fonts, JSON-LD, Lenis, cursor, ink transition, analytics
  (site)/               every page with header and footer
    page.tsx            Home: opening axis, statement, story film, the house, making, Pearl, Cygnature, close
    design/             Design
    sanctuary/          the Sanctuary story (collections as rooms), by category, by collection, piece pages → enquiry
    cygnature/          bespoke: film, picture, text → registration → a note from the house
    info/               facts, questions answered, write to us
  menu/                 the Menu ("The House"): the reliefs carved in charcoal, lit by the cursor
  actions.ts            server actions: enquiry and registration (honeypot, validation, mail)
  sitemap.ts robots.ts llms.txt/   SEO / AEO / GEO surface
  globals.css story.css            design system, Home grammar, Sanctuary grammar
src/components
  home/                 Hero (opening), ReliefWall (the sculpted wall, Home and Menu)
  motion/               ScrollProvider (Lenis), Reveal, Paragraph + Dissolve, Pixelate, ScrollTilt, InkTransition, FooterMotion
  sanctuary/            Story (room engine), StoryNav, Hotspot, ScrollThumb, GalleryDrift
  chrome/               Cursor, Menu ground (dark relief wall; CSS light without WebGL), sound
src/content             site facts, nav, home copy, collections, pieces, FAQ
src/lib                 gsap registration, schema builders, metadata helper, mail adapter
scripts/                stone-texture.py (the ground), relief.py (wall maps)
public/media            films and their posters
public/images           photography; relief/ holds the wall's shading maps
public/textures         the stone ground
```

## Motion

The site runs full motion for every visitor; like both references, it does not read the system "Reduce motion" setting.

- **Home, after immersive-g.com.** The opening builds the axis in place (wordmark mask sweep, the line word by word, a counter that hands over to "Scroll"), then the chrome fades in. Paragraphs reveal line by line; statements dissolve in letter by letter; films and pictures arrive through a pixel mosaic (`Pixelate`); media lean with scroll speed (`ScrollTilt`). Lenis lerp 0.05. The cursor keeps the system pointer with three trailing dots and words from `data-cursor`. The Menu opens with an ink spreading from its corner.
- **The sculpted wall.** `ReliefWall` draws plaster motifs onto the stone as shading only, one fixed WebGL layer under the page. Each relief belongs to a section (placements in `src/app/(site)/page.tsx`), rises out of the ground as that section nears the centre, trails the page and sinks back as it leaves. A light follows the cursor across it (relighting the carving from its height map, with a glint on the forms that face it) and the reliefs lean slightly towards it; on touch screens the light wanders on its own. It starts only after the opening, when the browser is idle, and uploads its maps one per frame.
- **The Menu** uses the same wall in its dark theme: the reliefs carved in the charcoal (placements in `src/components/chrome/MenuGround.tsx`), barely visible until the cursor's chartreuse-white light finds them, with a faint iridescence on the glints; the light wanders when nobody moves.
- **Sanctuary, after collabcapitolium.fr.** Each collection is a pinned room: five round-topped arches onto one film, the centre arch opening to full screen, the gold script title rising and scrolling, panels travelling right to left on the diagonal, the room sliding away left. A framed pill opens the slate nav panel. Lenis 1.2 s expo on this route.

## Assets: where to drop them

A missing file falls back to a poster or tonal placeholder; adding the file needs no code change.

| Asset | Path | Notes |
| --- | --- | --- |
| Story film | `public/media/story.mp4` + `story-poster.jpg` | H.264, muted loop, fast start; poster = first frame |
| Collection film | `public/media/collections/pearl.mp4` + `pearl-poster.jpg` | plays through the Sanctuary arches |
| Making films | `public/media/making-01.mp4`, `making-02.mp4` (+ `.jpg` posters) | 3:4 for the second |
| Atelier film | `public/media/atelier.mp4` (+ `.jpg`) | Home and Cygnature |
| Piece photography | `public/images/pieces/<slug>-01.jpg`, `-02.jpg` | listed per piece in `src/content/pieces.ts` |
| Relief maps | `public/images/relief/<name>.webp`, `<name>-h.webp` and their `-s` phone cuts | shading and height, see below |
| Wordmark | `public/wordmark.svg` | replace the placeholder; keep the name |
| OG image, favicon | `public/og.jpg`, `public/favicon.ico` | |

The films and reliefs in the repo are stand-ins generated with Higgsfield from brand-book stills.

### Relief maps

The wall draws grey shading maps where 128 is the flat wall, darker is shadow and lighter is light. To make one from any lit image of a relief on a flat wall (a photograph, or a generated stand-in):

```bash
python3 scripts/relief.py convert photo.png public/images/relief/swan-flight.webp 1280 560
```

writes the shading and height maps and their phone cuts (`swan-flight.webp`, `swan-flight-h.webp`, `swan-flight-s.webp`, `swan-flight-h-s.webp`). Size each to its largest placement, about 21.6 px per vw of width on desktop and 6 px per vw on phones (the swan in flight spans 60 vw, so 1280 and 560). Keep an existing name to replace a relief, or add an entry to `reliefs` in `src/app/(site)/page.tsx`.

### Fonts

Work Sans and Pinyon Script are open source, self-hosted from `@fontsource`. Chronicle Display (Hoefler&Co) needs a web licence: put `ChronicleDisplay-Roman.woff2` and `ChronicleDisplay-Italic.woff2` in `src/app/fonts/` and switch the `src` array in `src/app/fonts.ts`. Newsreader stands in until then. Pinyon Script stands in for the reference's Edwardian Script (licensed).

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | public origin, no trailing slash (canonicals, sitemap, JSON-LD, llms.txt) |
| `RESEND_API_KEY` | transactional mail; unset = dry run logged to the server console |
| `MAIL_FROM` | verified sender, e.g. `Cygnus <hello@cygnus.example>` |
| `MAIL_TO` | house inbox for enquiries and registrations |

## Analytics

Vercel Web Analytics and Speed Insights are mounted in the root layout. Both are cookieless and start collecting once they are switched on in the Vercel project (Analytics and Speed Insights tabs). The site records two events, `Enquiry` (with the piece) and `Cygnature registration`; custom events show on Vercel's Pro plan.

## Browser support

Current Chrome, Edge, Safari (15.4+, iOS included) and Firefox. The intro's `:has()` rule degrades on Firefox before 121 (the chrome simply shows during the opening). Films autoplay muted; where a phone blocks autoplay (Low Power Mode) the posters stay. Without WebGL the wall is absent and the Menu falls back to a CSS light that follows the pointer.

## Phases

0. Foundation — routes, design system, content model, forms, SEO layer. Done.
1. Home scroll. Done.
2. Sanctuary room engine. Done.
3. Menu and Home WebGL relief. Done.
4. Piece pages, Cygnature, Info. Done.
5. Launch pass — audits, analytics, handoff. Done, except what waits on the house: real env vars and mail, the domain, the real films, photography and wordmark, the Chronicle Display licence.
