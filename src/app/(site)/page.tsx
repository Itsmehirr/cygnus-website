import type { Metadata } from "next";
import Link from "next/link";
import fs from "node:fs";
import path from "node:path";
import { site } from "@/content/site";
import { collections } from "@/content/collections";
import { piecesByCollection } from "@/content/pieces";
import { pageMeta } from "@/lib/seo";
import { Hero } from "@/components/home/Hero";
import { Dissolve, Paragraph } from "@/components/motion/Paragraph";
import { ScrollTilt } from "@/components/motion/ScrollTilt";
import { Reveal, Drift } from "@/components/motion/Reveal";
import { SoundToggle } from "@/components/chrome/SoundToggle";
import { Clip } from "@/components/Clip";
import { Picture } from "@/components/Picture";
import { ButtonLink } from "@/components/Button";

export const metadata: Metadata = pageMeta({
  title: "Cygnus — Contemporary High Jewellery, Engineered from Grown Carbon",
  description: site.definition,
  path: "/",
});

/* Home, in Immersive Garden's grammar on the house's stone: the axis (which is
   also the opening), the statement, the story film as the showreel, the house
   in a centred paragraph, then media and large captions alternating, and the
   way into the Sanctuary. Nothing is pinned; the page keeps flowing. */
export default function HomePage() {
  const inPublic = (p: string) => fs.existsSync(path.join(process.cwd(), "public", p));
  const videoReady = site.storyVideo.ready || inPublic(site.storyVideo.src);
  const posterReady = inPublic(site.storyVideo.poster);
  const featured = collections[0];
  const featuredPieces = piecesByCollection(featured.slug).slice(0, 3);
  const [makingA, makingB] = site.home.making;

  return (
    <>
      <Hero line={site.home.line} founded={site.founded} />

      {/* The statement, surfacing letter by letter (the reference's H1). */}
      <section className="pressed" aria-labelledby="house">
        <div className="container">
          <Dissolve as="h2" id="house" text={site.home.pressed} className="pressed__line" />
        </div>
      </section>

      {/* The story film, as the reference's showreel: one wide frame, a label inside. */}
      <section className="reel" aria-label="The story of Cygnus">
        <Reveal className="reel__frame" data-tilt="">
          <div className="reel__media" data-cursor={videoReady ? "Watch" : undefined}>
            <Clip src={site.storyVideo.src} poster={posterReady ? site.storyVideo.poster : undefined} ratio="landscape" label="The story of Cygnus" story sizes="(min-width: 880px) 65vw, 100vw" />
            <span className="reel__label">
              <span className="reel__play" aria-hidden="true" />
              The story
            </span>
          </div>
        </Reveal>
      </section>

      <section className="approach" aria-labelledby="approach">
        <div className="container--narrow center">
          <Paragraph as="p" className="approach__label" id="approach">
            {site.home.approachLabel}
          </Paragraph>
          <Paragraph as="p" className="approach__text">
            {site.home.approach}
          </Paragraph>
        </div>
      </section>

      {/* The making: media and a large caption, alternating, as the project blocks. */}
      <section className="making" aria-labelledby="making">
        <h2 id="making" className="sr-only">
          The making
        </h2>
        <div className="container">
          <div className="band">
            <Reveal className="band__media band__media--left" data-tilt="">
              <div className="band__frame" data-cursor="Discover">
                <Clip src="/media/making-01.mp4" ratio="landscape" label="The making, I" />
              </div>
            </Reveal>
            <div className="band__text band__text--right">
              <Paragraph as="p" className="band__caption">
                {makingA.text}
              </Paragraph>
              <p className="band__title">{makingA.title}</p>
            </div>
          </div>

          <div className="band band--reverse">
            <Reveal className="band__media band__media--right" data-tilt="">
              <div className="band__frame" data-cursor="Discover">
                <Clip src="/media/making-02.mp4" ratio="portrait" label="The making, II" />
              </div>
            </Reveal>
            <div className="band__text band__text--left">
              <Paragraph as="p" className="band__caption">
                {makingB.text}
              </Paragraph>
              <p className="band__title">
                <Link href="/design" className="link" data-cursor="Read">
                  {makingB.title}
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
                <Reveal delay={i * 0.12} data-tilt="">
                  <Link href={`/sanctuary/pieces/${p.slug}`} className="tile tile--bare" data-cursor="Discover">
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
            <Paragraph as="h2" className="band__caption" id="sanctuary">
              {featured.name}, the first collection. {featured.description}
            </Paragraph>
            <ButtonLink href="/sanctuary">Enter the Sanctuary</ButtonLink>
          </div>
        </div>
      </section>

      {/* Cygnature: one video, one picture, one text */}
      <section className="bespoke" aria-labelledby="cygnature">
        <div className="container">
          <div className="bespoke__grid">
            <Reveal className="bespoke__video" data-tilt="">
              <div className="band__frame" data-cursor="Discover">
                <Clip src="/media/atelier.mp4" ratio="landscape" label="The atelier" />
              </div>
            </Reveal>
            <Reveal className="bespoke__picture" delay={0.15} data-tilt="">
              <div className="band__frame">
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
              <Paragraph as="h2" className="band__caption" id="cygnature">
                Bespoke, by Cygnus: a commission designed around one person, from geometry to finished piece.
              </Paragraph>
              <ButtonLink href="/cygnature" ghost>
                Begin with a registration
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="closing" aria-label="Closing">
        <div className="container center">
          <Dissolve as="p" text={site.home.closing} className="closing__line" />
        </div>
      </section>

      <ScrollTilt />

      <Link href="/sanctuary" className="see-all" aria-label="Enter the Sanctuary">
        {["Enter", "the", "Sanctuary"].map((w, i, all) => (
          <span key={w} className="see-all__w" style={{ ["--d" as string]: all.length - 1 - i }} aria-hidden="true">
            {w}
          </span>
        ))}
        <span className="see-all__dot" aria-hidden="true" />
      </Link>
      <SoundToggle />
    </>
  );
}
