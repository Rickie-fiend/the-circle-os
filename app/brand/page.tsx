const palette = [
  { name: "Bone", hex: "#F1EFE8", className: "swatch-bone" },
  { name: "Ink", hex: "#121210", className: "swatch-ink" },
  { name: "Vermilion", hex: "#D85A36", className: "swatch-accent" },
  { name: "Mist", hex: "#D9D7D0", className: "swatch-mist" },
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
          The open
          <br />
          circle.
        </h1>
        <p className="brand-intro-copy">
          A living identity for modern masculine growth—clear enough to trust,
          open enough to evolve.
        </p>
      </section>

      <section className="brand-rule">
        <div>
          <p className="eyebrow">Brand idea</p>
          <h2>Growth is not a closed loop.</h2>
        </div>
        <p>
          The open circle represents entry, exchange, and continuous growth. It
          avoids the visual language of traditional luxury clubs: less status,
          more substance.
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
            <strong>Use:</strong> open ring + wordmark whenever space allows.
          </p>
          <p>
            <strong>Clear space:</strong> at least one ring diameter on every side.
          </p>
          <p>
            <strong>Never:</strong> close, stretch, decorate, or add effects to the
            ring.
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
            <strong>60%</strong> Bone — primary reading surface
          </p>
          <p>
            <strong>30%</strong> Ink — type and high-contrast sections
          </p>
          <p>
            <strong>10%</strong> Vermilion — action and identity moments
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
        <p>Simple. Honest. Alive.</p>
      </footer>
    </main>
  );
}
