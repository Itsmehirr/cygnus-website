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
  menu/                 the Menu ("The House"): the forest carved in charcoal, rising under the cursor
  actions.ts            server actions: enquiry and registration (honeypot, validation, mail)
  sitemap.ts robots.ts llms.txt/   SEO / AEO / GEO surface
  globals.css story.css            design system, Home grammar, Sanctuary grammar
src/components
  home/                 Hero (opening), ReliefWall (the sculpted wall, Home and Menu)
  motion/               ScrollProvider (Lenis), Reveal, Paragraph + Dissolve, MediaFade, ScrollTilt, FilmConductor, InkTransition, FooterMotion
  sanctuary/            Story (room engine), StoryNav, Hotspot, ScrollThumb, GalleryDrift
  chrome/               Cursor, Menu ground (dark relief wall; CSS light without WebGL), Ambience + SoundToggle (the sound and its switch)
src/content             site facts, nav, home copy, collections, pieces, FAQ
src/lib                 gsap registration, schema builders, metadata helper, mail adapter, ambience (the sound engine)
scripts/                stone-texture.py (the ground), relief.py (wall maps), ambience.py (the soundscape)
public/media            films and their posters; ambience.mp3 (the site's sound)
public/images           photography; relief/ holds the forest's maps (the sculpted wall)
public/textures         the stone ground
```

## Motion

The site runs full motion for every visitor; like both references, it does not read the system "Reduce motion" setting (Lenis is told not to either, or its glide would be dropped for those visitors).

- **Home, after immersive-g.com.** The opening builds the axis in place (wordmark mask sweep, the line word by word, a counter that hands over to "Scroll"), then the chrome fades in. Paragraphs reveal line by line; statements dissolve in letter by letter; films and pictures arrive by fading in (`MediaFade`); media lean with scroll speed (`ScrollTilt`). Lenis lerp 0.05. The cursor keeps the system pointer with three trailing dots and words from `data-cursor`. The Menu opens with an ink spreading from its corner.
- **The sculpted wall.** `ReliefWall` lays one continuous forest (swans, peonies, flowering branches, feathers, constellations) over the whole ground: one fixed WebGL layer under the page, drawn as shading only. It lies flat in the stone until the cursor passes; there it swells out, the tall figures first and the undergrowth after them, and it sinks back along the trail about three seconds later, as on the reference. Every block of text keeps a clearing, so the forest forms round the content and never under the words. The strip is one screen wide and repeats down the page every two screen widths; its tiles load as the page reaches them, after the opening, and nothing is drawn while the wall is flat. On touch screens it rises under the finger and wanders on its own when nobody touches.
- **The Menu** carries the same forest in its dark theme (`src/components/chrome/MenuGround.tsx`): carved in the charcoal, the forms keep the stone's tone and catch a chartreuse-white light on their edges, under a soft pool of light at the cursor.
- **Films.** One film plays in view at a time (`FilmConductor`). Chrome draws the whole page at 30 frames a second while two videos play on screen, which shows as a stutter in the scroll; so the film holding most of the screen plays (or the one under the pointer, or the story film with its sound on), another in view holds its frame until its turn, and two that share the screen for long take turns, a loop each.
- **Sound.** One soft ambience for the whole site (`src/lib/ambience.ts`, mounted once in the root layout so it plays on through navigation): a slow pad in D major with a few glass chimes in a long room. It is off until the visitor lets it in. On a desktop the cursor says "Click to enable sound" and, once it has said so, the first click anywhere switches it on, as on the reference; on touch screens, and on the pages without that cursor (the Sanctuary, the Menu), only the Sound switch does. Nothing else starts it: not scrolling, not a key, not a click made from the keyboard. There is always exactly one Sound switch on screen (`SoundToggle`): fixed at the bottom right of every page, and stepping aside while one set in the page is in view (the footer's last line, the Menu's foot); on the Sanctuary's phone layout it sits just above the pill. It is a switch named "Sound" to screen readers and works from the keyboard. The choice is remembered for the session; a page loaded with sound on waits for the first click or key, because browsers do not let audio start by itself, and until then the switch reads Off and pressing it lets the sound in. The track is fetched only when sound is switched on, loops with its last 6 seconds crossfaded into its first, fades in and out, rests while the tab is hidden, and plays 3 dB higher on phones and tablets, whose speakers lose the low half of the pad.
- **Sanctuary, after collabcapitolium.fr.** Each collection is a pinned room: five round-topped arches onto one film, the centre arch opening to full screen, the gold script title rising and scrolling, panels travelling right to left on the diagonal, the room sliding away left. A framed pill opens the slate nav panel. Lenis 1.2 s expo on this route.

## Assets: where to drop them

A missing file falls back to a poster or tonal placeholder; adding the file needs no code change.

| Asset | Path | Notes |
| --- | --- | --- |
| Story film | `public/media/story.mp4` + `story-poster.jpg` | H.264, muted loop, fast start; poster = first frame. If the real film has a soundtrack, set `storyVideo.sound` in `src/content/site.ts`: it is then unmuted while Sound is on |
| Ambience | `public/media/ambience.mp3` | the site's sound; any track that is at full level at both ends (no fade in or out baked in) and at least 20 s long. The stand-in is rendered by `python3 scripts/ambience.py public/media/ambience.mp3` |
| Collection film | `public/media/collections/pearl.mp4` + `pearl-poster.jpg` | plays through the Sanctuary arches |
| Making films | `public/media/making-01.mp4`, `making-02.mp4` (+ `.jpg` posters) | 3:4 for the second |
| Atelier film | `public/media/atelier.mp4` (+ `.jpg`) | Home and Cygnature |
| Piece photography | `public/images/pieces/<slug>-01.jpg`, `-02.jpg` | listed per piece in `src/content/pieces.ts` |
| Forest maps | `public/images/relief/forest-<n>.webp`, `forest-<n>-h.webp` and their `-s` cuts | shading and height tiles of the wall, see below |
| Wordmark | `public/wordmark.svg` | replace the placeholder; keep the name |
| OG image, favicon | `public/og.jpg`, `public/favicon.ico` | |

The films in the repo are stand-ins generated with Higgsfield from brand-book stills; the forest's panels are stand-ins generated with Magnific (GPT 2.6, with depth maps by Hi3D Relief).

### The forest's maps

The wall is built from lit images of dense relief panels (16:9, light from the upper left) and a depth map of each (near = bright):

```bash
python3 scripts/relief.py forest public/images/relief/forest \
  b.png:b-depth.png c.png:c-depth.png d.png:d-depth.png a.png:a-depth.png
```

joins the panels top to bottom into one strip that wraps (neighbours overlap, so their figures interleave) and cuts it into tiles: `forest-0.webp` and so on (shading: grey 176 is a flat face in the light, darker is shadow, lighter is light) and `forest-0-h.webp` and so on (height: which forms rise first), each with an `-s` cut for phones and small windows. Four panels make the four tiles `ReliefWall` expects (`FOREST.tiles`). A third part, `a.png:a-depth.png:-4`, shifts a depth map sideways where a tool returned it offset.

The current panels are in the Magnific library: creations `yiQThgcPW9`, `WDSarAHcXe`, `1lX6T5Ar4r` and `rgBiWX1xtc`, with depth maps `fHngzZECDY`, `LwIZ88WswO`, `SyvzhCRUb8` and `LwIZpNGswO` (the last one sits 4 px to the right, hence `:-4`). The maps in the repo were built from their previews (2048 px panels, 1024 px depth); a rebuild from the full-size originals would be a little crisper.

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

Current Chrome, Edge, Safari (15.4+, iOS included) and Firefox. The intro's `:has()` rule degrades on Firefox before 121 (the chrome simply shows during the opening). Films autoplay muted; where a phone blocks autoplay (Low Power Mode) the posters stay. Without WebGL the wall is absent and the Menu falls back to a CSS light that follows the pointer. The sound uses Web Audio, which every current browser has; it has been tested in Chromium (desktop, and phone and tablet emulation), not yet on a real iPhone, in Safari or in Firefox. Without scripts the Sound switch is not shown.

## Phases

0. Foundation — routes, design system, content model, forms, SEO layer. Done.
1. Home scroll. Done.
2. Sanctuary room engine. Done.
3. Menu and Home WebGL relief. Done.
4. Piece pages, Cygnature, Info. Done.
5. Launch pass — audits, analytics, handoff. Done, except what waits on the house: real env vars and mail, the domain, the real films, photography and wordmark, the Chronicle Display licence.
