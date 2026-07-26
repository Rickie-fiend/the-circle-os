const palette = [
  { name: "Bone", hex: "#F1EFE8", className: "swatch-bone" },
  { name: "Ink", hex: "#191813", className: "swatch-ink" },
  { name: "Orange", hex: "#E36B37", className: "swatch-accent" },
  { name: "Charcoal", hex: "#403E35", className: "swatch-mist" },
];

export default function BrandGuidelines() {
  return (
    <main className="brand-guide">
      <header className="brand-guide-header">
        <a href="/" className="brand-back">
          ← Website
        </a>
        <p>The Circle / Brand Guidelines / 2026</p>
      </header>

      <section className="brand-intro">
        <p className="eyebrow">Identity System 01</p>
        <h1>
          The human
          <br />
          circle.
        </h1>
        <p className="brand-intro-copy">
          A living identity for modern masculine growth—complete in its unity,
          human in its imperfection.
        </p>
      </section>

      <section className="brand-rule">
        <div>
          <p className="eyebrow">Brand idea</p>
          <h2>One whole. Never perfect.</h2>
        </div>
        <p>
          The circle represents unity, growth, and oneness. Its hand-drawn line
          keeps it human: imperfect, alive, and honest without losing elegance.
        </p>
      </section>

      <section className="brand-showcase brand-dark">
        <div className="guide-number">01 / Mark</div>
        <div className="mark-stage">
          <span className="guide-mark" aria-hidden="true" />
          <div>
            <h2>THE CIRCLE</h2>
            <p>MASTERMIND FIGHT CLUB</p>
          </div>
        </div>
        <div className="brand-notes">
          <p>
            <strong>Use:</strong> hand-drawn circle + wordmark whenever space allows.
          </p>
          <p>
            <strong>Clear space:</strong> at least one ring diameter on every side.
          </p>
          <p>
            <strong>Never:</strong> open, perfect, stretch, decorate, or add effects
            to the circle.
          </p>
        </div>
      </section>

      <section className="brand-showcase">
        <div className="guide-number">02 / Colour</div>
        <div className="palette-grid">
          {palette.map((color) => (
            <div className={`palette-card ${color.className}`} key={color.name}>
              <span>{color.name}</span>
              <strong>{color.hex}</strong>
            </div>
          ))}
        </div>
        <div className="brand-notes dark-notes">
          <p>
            <strong>70%</strong> Ink — default reading surface
          </p>
          <p>
            <strong>20%</strong> Bone — contrast and light-theme surface
          </p>
          <p>
            <strong>10%</strong> Orange — action and identity moments
          </p>
        </div>
      </section>

      <section className="brand-showcase type-showcase">
        <div className="guide-number">03 / Typography</div>
        <div className="type-sample">
          <p className="display-sample">The art of living.</p>
          <p className="sans-sample">CLEAR WORDS. REAL EXPERIENCE.</p>
        </div>
        <div className="type-rules">
          <article>
            <h3>Cormorant Garamond</h3>
            <p>Display / headlines / expressive statements</p>
            <p>Use sentence case. Give it room. Never use it for long body copy.</p>
          </article>
          <article>
            <h3>Geist</h3>
            <p>Body / labels / navigation / functional text</p>
            <p>Use regular weight for reading and medium weight for emphasis.</p>
          </article>
        </div>
      </section>

      <section className="brand-showcase voice-showcase">
        <div className="guide-number">04 / Voice</div>
        <div className="voice-grid">
          <div>
            <p className="eyebrow">We are</p>
            <h2>Direct.<br />Grounded.<br />Open.</h2>
          </div>
          <div>
            <p className="eyebrow">We are not</p>
            <h2>Hyped.<br />Exclusive for show.<br />Over-explained.</h2>
          </div>
        </div>
        <p className="voice-note">
          Write like one man speaking honestly to another. Short sentences. Plain
          words. Leave space for the reader to think.
        </p>
      </section>

      <section className="brand-showcase layout-showcase">
        <div className="guide-number">05 / Layout & Motion</div>
        <div className="layout-grid">
          <div className="layout-diagram" aria-label="Layout spacing example">
            <span />
            <span />
            <span />
          </div>
          <div className="layout-copy">
            <h2>Space is part of the message.</h2>
            <p>
              Use wide margins, a strict reading width, and one dominant idea per
              section. Animation should reveal hierarchy—not compete with it.
            </p>
            <ul>
              <li>Desktop content width: 1280px maximum</li>
              <li>Body copy width: 38–65 characters</li>
              <li>Motion: 500–900ms, soft ease, once per element</li>
              <li>Always respect reduced-motion settings</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="brand-guide-footer">
        <p>THE CIRCLE</p>
        <p>Whole. Human. Alive.</p>
      </footer>
    </main>
  );
}
