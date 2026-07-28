import Link from "next/link";
import { MotionProvider } from "./motion-provider";
import { ThemeToggle } from "./theme-toggle";

const values = [
  {
    name: "Authenticity",
    lines: (
      <>
        Truth. <strong>Being Honest.</strong>
        <br />
        Uniqueness.
      </>
    ),
  },
  {
    name: "Openness",
    lines: (
      <>
        Freedom. <strong>Being Free.</strong>
        <br />
        Trusting Life.
      </>
    ),
  },
  {
    name: "Growth",
    lines: (
      <>
        Change. <strong>Being Vulnerable.</strong>
        <br />
        Giving Love.
      </>
    ),
  },
  {
    name: "Purpose",
    lines: (
      <>
        Knowing. <strong>Being Happy.</strong>
        <br />
        Meaning of Life.
      </>
    ),
  },
];

const principles = [
  {
    title: "Contribution over consumption.",
    text: "Giving is the path. The superior man's life is an offering to all.",
  },
  {
    title: "Share truth by living it.",
    text: "Waste no more time arguing about what a good man should be. Be one.",
  },
  {
    title: "Presence over performance.",
    text: "The moment is the point. Every experience is the practice.",
  },
  {
    title: "Awareness is the goal.",
    text: "To become conscious of what is actually happening - within and around you.",
  },
  {
    title: "Teach what you know. Learn what you don't.",
    text: "The one who thinks he has nothing to learn has already stopped growing. Every man is both teacher and student.",
  },
  {
    title: "A living culture.",
    text: "The culture grows, adapts, and is shaped by community.",
  },
];

const topics = [
  "Masculinity",
  "Spiritual / God",
  "Life",
  "Love",
  "Truth",
  "Belief",
  "Communications",
  "Awareness",
  "Self Improvement",
  "Growth",
  "Purpose",
  "Power",
  "Business",
  "Relationships",
  "Joy & Happiness",
  "Fitness & Wellbeing",
  "Books",
  "Art",
  "Lust",
  "Drugs",
  "Money",
  "Women",
  "Everything",
];

const questions = [
  {
    question: "Membership or Mastermind?",
    answer:
      "You apply for membership. You will be invited to a private mastermind event once you are a member. Mastermind events are for members only.",
  },
  {
    question: "What is the price of membership?",
    answer:
      "You don't pay for membership. You pay for a seat at a two-day mastermind event, if you are invited. You become a member once you attend one of our gatherings. Details will be in your invitation.",
  },
  {
    question: "Who is this for?",
    answer:
      "Those seeking purpose, depth, and real connection. Entrepreneurs, leaders, artists, builders, and thinkers who value truth.",
  },
  {
    question: "Where do gatherings happen?",
    answer: "Currently Myanmar and Thailand, but we are going global.",
  },
  {
    question: "Is this a self-help group or a business mastermind?",
    answer:
      "Neither. And both. The Circle exists where personal depth and professional ambition meet. Men who grow on the inside tend to build better on the outside. We are not here to separate the two.",
  },
  {
    question: "How is this different from a networking event?",
    answer:
      "Common networking events and masterminds are transactional — you learn from people who walk the path, you get value from a speaker's experience and keynotes on certain topics. Here, you learn from your own experience in the moment and get a chance to observe how others actually live.",
  },
];

function Mark({ small = false }: { small?: boolean }) {
  return <span className={small ? "mark mark-small" : "mark"} aria-hidden="true" />;
}

export default function Home() {
  return (
    <MotionProvider>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="The Circle — home">
          <Mark small />
          <span>THE CIRCLE</span>
        </a>
        <div className="nav-actions">
          <ThemeToggle />
          <Link className="nav-os" href="/os">
            Open OS
          </Link>
          <a className="nav-apply" href="#join">
            Apply Now <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero-orbit" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <span className="orbit-dot" />
          </div>
          <p className="eyebrow hero-eyebrow">theonecircle.club</p>
          <div className="hero-copy">
            <h1>
              THE
              <br />
              CIRCLE
            </h1>
            <div className="hero-meta">
              <p className="kicker">MASTERMIND FIGHT CLUB</p>
              <p>
                An Exclusive Community for Modern Masculine Growth and One Truth.
              </p>
              <a className="text-link" href="#join">
                Apply for Membership <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <p className="scroll-note">Scroll to enter the circle</p>
        </section>

        <section className="editorial-section" id="purpose" data-reveal>
          <div className="section-label">
            <span>01</span>
            <p>Our Vision</p>
          </div>
          <div className="section-content">
            <h2>The art of living.</h2>
            <div className="two-column-copy vision-copy">
              <p className="lead">
                Making men more conscious of what&apos;s really happening - creating
                real growth, expanding masculine collective consciousness, and
                realizing the Truth.
              </p>
              <div>
                <h3>Go for the Real Thing.</h3>
                <p className="aside">Unapplied knowledge is no knowledge at all.</p>
                <p>
                  The Circle provides real Community, Exposure, Network, Mentorship,
                  and Opportunities. However, only your experience is your true
                  teacher - you are here to realize what&apos;s true by being yourself.
                </p>
                <p className="closing-line">This is a way of being.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="editorial-section" id="why" data-reveal>
          <div className="section-label">
            <span>02</span>
            <p>Why We Build The Circle</p>
          </div>
          <div className="section-content">
            <p className="why-intro">
              We exist to be a light for younger entrepreneurs in the modern world.
            </p>
            <div className="why-stack">
              <h2>
                Stop learning from screens. Start living your life.
                <br />
                Self-education doesn&apos;t have to be lonely or boring. It should be
                challenging and fun.
              </h2>
              <h3>
                We create connections with elite minds for the next generation of
                entrepreneurs and provide opportunities to present themselves.
              </h3>
            </div>
          </div>
        </section>

        <section className="event-section" id="network">
          <div className="event-top" data-reveal>
            <div className="section-label light">
              <span>03</span>
              <p>Our Event</p>
            </div>
            <div className="event-copy">
              <h2>Private events like no others.</h2>
              <div className="event-narrative">
                <p className="event-lead">
                  We host private networking events offering global experience and
                  exclusive opportunities for members to be with entrepreneurs from
                  all over the world.
                </p>
                <p className="event-note">
                  Invite-only in-person gatherings with the most elite minds.
                </p>
              </div>
            </div>
          </div>
          <div className="stats" data-reveal>
            <div className="stat">
              <strong>10 – 30</strong>
              <span>Entrepreneurs per gathering</span>
            </div>
            <div className="stat">
              <strong>Myanmar</strong>
              <span>to Global</span>
            </div>
            <div className="stat">
              <strong>Invite Only</strong>
              <span>Carefully curated membership</span>
            </div>
          </div>
        </section>

        <section className="values-section" id="values" data-reveal>
          <div className="section-label">
            <span>04</span>
            <p>Core Principles</p>
          </div>
          <div className="section-content">
            <h2>What we stand for.</h2>
            <div className="value-grid">
              {values.map((value, index) => (
                <article className="value-card" key={value.name}>
                  <span>0{index + 1}</span>
                  <h3>{value.name}</h3>
                  <p>{value.lines}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="editorial-section living-section" id="howwelive" data-reveal>
          <div className="section-label">
            <span>05</span>
            <p>How We Live</p>
          </div>
          <div className="section-content">
            <h2>
              More than a standard.
              <br />
              A way of being.
            </h2>
            <div className="principle-grid">
              {principles.map((principle, index) => (
                <article key={principle.title}>
                  <span>0{index + 1}</span>
                  <h3>{principle.title}</h3>
                  <p>{principle.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="topics-section" id="topics" data-reveal>
          <div className="section-label">
            <span>06</span>
            <p>We Talk About</p>
          </div>
          <div className="topic-cloud">
            {topics.map((topic) => (
              <span key={topic}>{topic}</span>
            ))}
          </div>
        </section>

        <section className="join-section" id="join">
          <div className="join-ring" aria-hidden="true" />
          <div className="join-content" data-reveal>
            <p className="eyebrow">Join The Circle</p>
            <h2>The room is waiting.</h2>
            <p>
              Our masterminds are invitation only. Only for those who are ready for
              real growth.
            </p>
            <a
              className="button"
              href="https://horse-bagpipe-1c4.notion.site/11dc862518784802a2dab12b6ab6e63f?pvs=105"
              target="_blank"
              rel="noreferrer"
            >
              Register Now <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        <section className="faq-section" id="faq" data-reveal>
          <div className="section-label">
            <span>07</span>
            <p>FAQ</p>
          </div>
          <div className="section-content">
            <h2>Questions.</h2>
            <div className="faq-list">
              {questions.map((item) => (
                <details key={item.question}>
                  <summary>
                    <span>{item.question}</span>
                    <i aria-hidden="true" />
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-brand">
          <Mark />
          <p>THE CIRCLE</p>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <a href="#purpose">Vision</a>
          <a href="#why">Why</a>
          <a href="#network">Events</a>
          <a href="#values">Values</a>
          <a href="#howwelive">How We Live</a>
          <a href="#join">Apply</a>
          <a href="#faq">FAQ</a>
        </nav>
        <small>© 2025 The Circle · theonecircle.club</small>
      </footer>
    </MotionProvider>
  );
}
