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
            <p>Outer editorial headlines, reflections, and moments of pause.</p>
            <p>Give it room. Never use it inside an app or for interface text.</p>
          </article>
          <article>
            <h3>{circleBrand.typography.functional}</h3>
            <p>Every app interior, plus body copy, navigation, controls, data, and labels.</p>
            <p>One app uses one font. Use regular weight to read and bold weight to act.</p>
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
        <div className="guide-number">07 / Software</div>
        <div className="os-brand-heading">
          <div>
            <p className="eyebrow">Product behavior</p>
            <h2>Sessions hold. Apps move.</h2>
          </div>
          <p>
            Every session has one purpose. Its shell stays stable while simple app
            pages move inside it. Finish a journey once, then live from its useful
            idle state.
          </p>
        </div>

        <div className="os-preview" aria-label="The Circle OS software themes">
          <div className="os-preview-top">
            <div className="os-mini-brand">
              <span className="os-mini-mark" aria-hidden="true" />
              <span>CIRCLE OS</span>
            </div>
            <span>TODAY / VISION</span>
          </div>
          <div className="os-software-stack">
            <article className="os-software-card light">
              <span>CHECK-IN</span>
              <h3>Quiet and primary.</h3>
              <p>White gives reflection the clearest space.</p>
            </article>
            <article className="os-software-card orange">
              <span>HABIT</span>
              <h3>Bold and active.</h3>
              <p>Orange holds identity, missions, and meaningful action.</p>
            </article>
            <article className="os-software-card dark">
              <span>LOG</span>
              <h3>Deep and practical.</h3>
              <p>Dark keeps daily evidence calm and grounded.</p>
            </article>
          </div>
        </div>

        <div className="os-rules">
          <article>
            <span>01</span>
            <h3>Stable session</h3>
            <p>The container stays still. Only the inner app page moves.</p>
          </article>
          <article>
            <span>02</span>
            <h3>One-time journey</h3>
            <p>Surveys end. The final idle app becomes the lasting product.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Tap or swipe</h3>
            <p>A tap acts. A swipe moves. Never open the keyboard without a tap.</p>
          </article>
          <article>
            <span>04</span>
            <h3>Default is not data</h3>
            <p>Suggestions stay faded until the person confirms or changes them.</p>
          </article>
          <article>
            <span>05</span>
            <h3>Guided learning</h3>
            <p>Teach one small idea, let the person try it, then leave a useful app.</p>
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
