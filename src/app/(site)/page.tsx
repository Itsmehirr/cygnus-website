import type { Metadata } from "next";
import Link from "next/link";
import fs from "node:fs";
import path from "node:path";
import { site } from "@/content/site";
import { collections } from "@/content/collections";
import { piecesByCollection } from "@/content/pieces";
import { pageMeta } from "@/lib/seo";
import { Hero } from "@/components/home/Hero";
import { Statement } from "@/components/home/Statement";
import { Reveal, Drift } from "@/components/motion/Reveal";
import { Loader } from "@/components/chrome/Loader";
import { SoundToggle } from "@/components/chrome/SoundToggle";
import { Clip } from "@/components/Clip";
import { Picture } from "@/components/Picture";
import { ButtonLink } from "@/components/Button";

export const metadata: Metadata = pageMeta({
  title: "Cygnus — Contemporary High Jewellery, Engineered from Grown Carbon",
  description: site.definition,
  path: "/",
});

/* Home: one continuous scroll on plain Warm Beige, no textures (the sitemap's
   "no bg effects"). Order: story video → the house's statement → the making →
   the first collection → Cygnature → closing line. */
export default function HomePage() {
  const inPublic = (p: string) => fs.existsSync(path.join(process.cwd(), "public", p));
  const videoReady = site.storyVideo.ready || inPublic(site.storyVideo.src);
  const posterReady = inPublic(site.storyVideo.poster);
  const featured = collections[0];
  const featuredPieces = piecesByCollection(featured.slug).slice(0, 3);
  const [makingA, makingB] = site.home.making;

  return (
    <>
      <Loader />

      <Hero
        ready={videoReady}
        posterReady={posterReady}
        src={site.storyVideo.src}
        poster={site.storyVideo.poster}
        line={site.home.line}
        founded={site.founded}
      />

      {/* The house, pressed into the ground */}
      <section className="pressed" aria-labelledby="house">
        <div className="container">
          <Statement as="h2" text={site.home.pressed} className="pressed__line display-1" />
          <p className="sr-only" id="house">
            The house
          </p>
        </div>
      </section>

      <section className="approach" aria-label="Approach">
        <div className="container--narrow center">
          <p className="approach__label">{site.home.approachLabel}</p>
          <Statement text={site.home.approach} className="approach__text" />
        </div>
      </section>

      {/* The making: two films, captions offset, Immersive Garden's rhythm */}
      <section className="making" aria-labelledby="making">
        <div className="container">
          <h2 id="making" className="sr-only">
            The making
          </h2>

          <div className="band">
            <Reveal className="band__media band__media--left">
              <div className="card">
                <Clip src="/media/making-01.mp4" ratio="landscape" label="The making, I" />
              </div>
            </Reveal>
            <div className="band__text band__text--right">
              <h3 className="display-3">{makingA.title}</h3>
              <p className="measure muted">{makingA.text}</p>
            </div>
          </div>

          <div className="band band--reverse">
            <Reveal className="band__media band__media--right">
              <div className="card">
                <Clip src="/media/making-02.mp4" ratio="portrait" label="The making, II" />
              </div>
            </Reveal>
            <div className="band__text band__text--left">
              <h3 className="display-3">{makingB.title}</h3>
              <p className="measure muted">{makingB.text}</p>
              <p>
                <Link href="/design" className="link" data-cursor="Read">
                  The thinking behind the house
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The first collection: three frames stepping down the page */}
      <section className="teaser" aria-labelledby="sanctuary">
        <div className="container">
          <div className="teaser__frames">
            {featuredPieces.map((p, i) => (
              <Drift key={p.slug} speed={[0.06, 0.16, 0.1][i]} className={`teaser__frame teaser__frame--${i + 1}`}>
                <Reveal delay={i * 0.12}>
                  <Link href={`/sanctuary/pieces/${p.slug}`} className="card tile" data-cursor="View">
                    <Picture
                      src={p.images[0].src}
                      alt={p.images[0].alt}
                      ratio="portrait"
                      sizes="(min-width: 880px) 28vw, 70vw"
                      label={p.name}
                    />
                  </Link>
                </Reveal>
              </Drift>
            ))}
          </div>
          <div className="teaser__text">
            <h2 id="sanctuary" className="display-2">
              {featured.name}, the first collection.
            </h2>
            <p className="lede">{featured.description}</p>
            <ButtonLink href="/sanctuary">Enter the Sanctuary</ButtonLink>
          </div>
        </div>
      </section>

      {/* Cygnature: one video, one picture, one text */}
      <section className="bespoke" aria-labelledby="cygnature">
        <div className="container">
          <div className="bespoke__grid">
            <Reveal className="bespoke__video">
              <div className="card">
                <Clip src="/media/atelier.mp4" ratio="landscape" label="The atelier" />
              </div>
            </Reveal>
            <Reveal className="bespoke__picture" delay={0.15}>
              <div className="card">
                <Picture
                  src="/images/cygnature/hands.jpg"
                  alt="A Cygnus commission in the making"
                  ratio="tall"
                  sizes="(min-width: 880px) 24vw, 60vw"
                  label="Presence"
                />
              </div>
            </Reveal>
            <div className="bespoke__text">
              <h2 id="cygnature" className="display-2">
                Bespoke, by Cygnus.
              </h2>
              <p className="measure muted">
                A commission designed around one person, from geometry to finished
                piece. It begins with a registration and a note from the house.
              </p>
              <ButtonLink href="/cygnature" ghost>
                Begin with a registration
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="closing" aria-label="Closing">
        <div className="container center">
          <Statement text={site.home.closing} className="closing__line display-2 italic" />
        </div>
      </section>

      <Link href="/sanctuary" className="see-all" data-cursor="Enter">
        Enter the Sanctuary
        <span className="see-all__dot" aria-hidden="true" />
      </Link>
      <SoundToggle />
    </>
  );
}
