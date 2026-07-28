import Link from "next/link";
import { circleBrand, circleFoundations } from "../brand-system";

const palette = Object.entries(circleBrand.colors).map(([key, color]) => ({
  ...color,
  className: `swatch-${key}`,
}));

export default function BrandGuidelines() {
  return (
    <main className="brand-guide">
      <header className="brand-guide-header">
        <Link href="/" className="brand-back">
          ← Website
        </Link>
        <p>The Circle / Brand System / 2026</p>
      </header>

      <section className="brand-intro">
        <p className="eyebrow">Identity System 02</p>
        <h1>
          The human
          <br />
          circle.
        </h1>
        <p className="brand-intro-copy">
          A living identity for awareness, real experience, and modern masculine
          growth—complete in its unity, human in its imperfection.
        </p>
      </section>

      <section className="brand-rule">
        <div>
          <p className="eyebrow">Brand idea</p>
          <h2>One whole. Never perfect.</h2>
        </div>
        <p>
          The circle represents unity, growth, and oneness. Its hand-drawn line
          keeps it honest: imperfect, alive, and unmistakably human.
        </p>
      </section>

      <section className="brand-showcase foundation-showcase">
        <div className="guide-number">01 / Foundation</div>
        <div className="foundation-heading">
          <h2>Design for how we live.</h2>
          <p>
            The identity comes from The Circle&apos;s purpose—not from the visual
            language of a conventional luxury club.
          </p>
        </div>
        <div className="foundation-grid">
          {circleFoundations.map((foundation, index) => (
            <article key={foundation.title}>
              <span>0{index + 1}</span>
              <h3>{foundation.title}</h3>
              <p>{foundation.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="brand-showcase brand-dark">
        <div className="guide-number">02 / Mark</div>
        <div className="mark-stage">
          <span className="guide-mark" aria-hidden="true" />
          <div>
            <h2>THE CIRCLE</h2>
            <p>MASTERMIND FIGHT CLUB</p>
          </div>
        </div>
        <div className="brand-notes">
          <p>
            <strong>Meaning:</strong> one complete container—unity without
            uniformity.
          </p>
          <p>
            <strong>Clear space:</strong> at least one ring diameter on every side.
          </p>
          <p>
            <strong>Never:</strong> open, perfect, stretch, decorate, or turn the
            mark into a progress percentage.
          </p>
        </div>
      </section>

      <section className="brand-showcase">
        <div className="guide-number">03 / Colour</div>
        <div className="palette-grid">
          {palette.map((color) => (
            <div className={`palette-card ${color.className}`} key={color.name}>
              <span>{color.name}</span>
              <p>{color.role}</p>
              <strong>{color.hex}</strong>
            </div>
          ))}
        </div>
        <div className="brand-notes dark-notes">
          <p>
            <strong>Ink</strong> carries depth and focus without becoming pure black.
          </p>
          <p>
            <strong>Bone</strong> creates calm reading surfaces and human warmth.
          </p>
          <p>
            <strong>Orange</strong> marks action, attention, and identity—not
            decoration.
          </p>
        </div>
      </section>

      <section className="brand-showcase type-showcase">
        <div className="guide-number">04 / Typography</div>
        <div className="type-sample">
          <p className="display-sample">The art of living.</p>
          <p className="sans-sample">CLEAR WORDS. REAL EXPERIENCE.</p>
        </div>
        <div className="type-rules">
          <article>
            <h3>{circleBrand.typography.display}</h3>
            <p>Meaningful headlines, reflections, and moments of pause.</p>
            <p>Use sentence case. Give it room. Never use it for dense interface text.</p>
          </article>
          <article>
            <h3>{circleBrand.typography.functional}</h3>
            <p>Body copy, navigation, controls, data, labels, and functional text.</p>
            <p>Use regular weight for reading and medium weight for clear emphasis.</p>
          </article>
        </div>
      </section>

      <section className="brand-showcase voice-showcase">
        <div className="guide-number">05 / Voice</div>
        <div className="voice-grid">
          <div>
            <p className="eyebrow">We are</p>
            <h2>
              Direct.
              <br />
              Grounded.
              <br />
              Open.
            </h2>
          </div>
          <div>
            <p className="eyebrow">We are not</p>
            <h2>
              Hyped.
              <br />
              Superior.
              <br />
              Over-explained.
            </h2>
          </div>
        </div>
        <p className="voice-note">
          Speak honestly, without performance. Use plain words and leave enough
          space for the person to notice their own experience.
        </p>
      </section>

      <section className="brand-showcase layout-showcase">
        <div className="guide-number">06 / Layout & Motion</div>
        <div className="layout-grid">
          <div className="layout-diagram" aria-label="Layout spacing example">
            <span />
            <span />
            <span />
          </div>
          <div className="layout-copy">
            <h2>Space is part of the message.</h2>
            <p>
              Center the container, keep reading lines measured, and let one dominant
              idea lead each section. Alignment should feel quiet and inevitable.
            </p>
            <ul>
              <li>Content maximum: {circleBrand.spacing.contentMax}</li>
              <li>Body copy: {circleBrand.spacing.readingWidth}</li>
              <li>Section spacing: {circleBrand.spacing.sectionSpace}</li>
              <li>Motion: {circleBrand.motion.duration}, {circleBrand.motion.easing}</li>
              <li>Always respect reduced-motion settings</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="brand-showcase brand-os">
        <div className="guide-number">07 / The Circle OS</div>
        <div className="os-brand-heading">
          <div>
            <p className="eyebrow">Functional expression</p>
            <h2>A mirror, not a dashboard.</h2>
          </div>
          <p>
            The OS should feel quieter and more functional than the public site while
            remaining unmistakably part of The Circle.
          </p>
        </div>

        <div className="os-preview" aria-label="The Circle OS visual direction">
          <div className="os-preview-top">
            <div className="os-mini-brand">
              <span className="os-mini-mark" aria-hidden="true" />
              <span>THE CIRCLE OS</span>
            </div>
            <span>TODAY · MIRROR</span>
          </div>
          <div className="os-preview-body">
            <p className="eyebrow">Tuesday · Morning</p>
            <h3>How is your energy, honestly?</h3>
            <div className="os-energy" aria-hidden="true">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span className="active">4</span>
              <span>5</span>
            </div>
            <div className="os-mirror-line">
              <span>One small move</span>
              <p>Read ten pages before opening another screen.</p>
            </div>
          </div>
        </div>

        <div className="os-rules">
          <article>
            <span>01</span>
            <h3>One action</h3>
            <p>One dominant action at a time. Return the person to life quickly.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Evidence, not scores</h3>
            <p>Show what happened. Never score worth, discipline, or masculinity.</p>
          </article>
          <article>
            <span>03</span>
            <h3>The circle has a job</h3>
            <p>Use it for identity, check-ins, and meaningful state—not decoration.</p>
          </article>
          <article>
            <span>04</span>
            <h3>Orange is scarce</h3>
            <p>Reserve it for the next action, current state, or important insight.</p>
          </article>
        </div>
      </section>

      <section className="brand-showcase asset-showcase">
        <div className="guide-number">08 / Asset Kit</div>
        <div className="asset-heading">
          <h2>Use one source of truth.</h2>
          <p>
            These files are ready for the website, The Circle OS, prototypes, and
            future product surfaces.
          </p>
        </div>
        <div className="asset-links">
          <a href="/brand/the-circle-mark.svg" download>
            Orange mark <span>SVG ↘</span>
          </a>
          <a href="/brand/the-circle-mark-bone.svg" download>
            Bone mark <span>SVG ↘</span>
          </a>
          <a href="/brand/the-circle-brand.css" download>
            Design tokens <span>CSS ↘</span>
          </a>
        </div>
      </section>

      <footer className="brand-guide-footer">
        <p>THE CIRCLE</p>
        <p>{circleBrand.idea}</p>
      </footer>
    </main>
  );
}
