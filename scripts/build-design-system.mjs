// Build the Claude Design bundle from the real design tokens.
//
// Every card is generated from app/tokens.css and the same font files the app
// serves, so the design system cannot drift from the code. Regenerate with:
//
//   node scripts/build-design-system.mjs
//
// Cards are self-contained: tokens and both typefaces are inlined, because a
// design reference that silently falls back to the wrong font is worse than no
// reference at all.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "design-system");

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------
const tokensCss = readFileSync(join(ROOT, "app/tokens.css"), "utf8");

// Latin subsets only (unicode-range U+0-FF). Geist is variable across 100-900.
const fontDir = join(ROOT, ".vinext/fonts");
const findFont = (prefix, file) => {
  const dir = readdirSync(fontDir).find((d) => d.startsWith(prefix));
  if (!dir) throw new Error(`font cache missing for ${prefix}; run npm run dev once`);
  return readFileSync(join(fontDir, dir, file)).toString("base64");
};
const geist = findFont("geist-", "geist-98bbbccb.woff2");
const cormorant = findFont("cormorant-garamond-", "cormorant-garamond-e99b45a2.woff2");

const FONT_FACE = `
@font-face{font-family:Geist;font-style:normal;font-weight:100 900;font-display:swap;
src:url(data:font/woff2;base64,${geist}) format("woff2")}
@font-face{font-family:"Cormorant Garamond";font-style:normal;font-weight:300 700;font-display:swap;
src:url(data:font/woff2;base64,${cormorant}) format("woff2")}`;

// Reuse the token block verbatim so values are literally the app's values.
const TOKENS = tokensCss
  .slice(tokensCss.indexOf(":root {"))
  .replace(/@media[\s\S]*$/, "");

// ---------------------------------------------------------------------------
// Shared chrome
// ---------------------------------------------------------------------------
const BASE = `
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font-family:Geist,system-ui,sans-serif;background:var(--c-bone);
color:var(--c-ink);-webkit-font-smoothing:antialiased;padding:28px}
.sheet{max-width:1000px;margin:0 auto}
.eyebrow{font-size:var(--text-2xs);letter-spacing:.16em;text-transform:uppercase;
font-weight:600;color:var(--c-neutral-600);margin:0 0 6px}
h1.t{font-family:"Cormorant Garamond",Georgia,serif;font-weight:400;
font-size:var(--text-4xl);line-height:1.04;margin:0 0 8px;letter-spacing:-.01em}
.lede{font-size:var(--text-md);line-height:1.5;color:var(--c-neutral-700);
margin:0 0 28px;max-width:56ch}
.rule{height:1px;background:var(--c-neutral-200);border:0;margin:26px 0}
.note{font-size:var(--text-sm);line-height:1.55;color:var(--c-neutral-600);
max-width:60ch;margin:14px 0 0}
.tok{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
font-size:var(--text-2xs);color:var(--c-neutral-600);letter-spacing:.01em}
.grid{display:grid;gap:14px}
/* The App Box: one shape, one owner. */
.box{border-radius:var(--r-box);background:var(--c-warm-50);color:var(--c-ink);
min-height:360px;width:340px;padding:22px;display:flex;flex-direction:column;
overflow:hidden;box-shadow:0 1px 2px rgb(25 24 19/.06),0 12px 32px rgb(25 24 19/.07)}
.box.dark{background:var(--c-ink);color:var(--c-bone)}
.box.orange{background:var(--c-orange);color:var(--c-white)}
.box header{display:flex;justify-content:space-between;align-items:center;
font-size:var(--text-2xs);letter-spacing:.15em;text-transform:uppercase;
font-weight:600;min-height:18px}
.box .body{flex:1;display:flex;flex-direction:column;justify-content:flex-end;
padding:18px 0 0}
.box .main{font-size:var(--text-xl);line-height:1.24;font-weight:600;
letter-spacing:-.01em}
.box .sub{padding-top:12px}
.box footer{padding-top:16px}
.act{display:block;width:100%;border:0;border-radius:var(--r-md);
background:var(--c-ink);color:var(--c-bone);font-family:inherit;
font-size:var(--text-md);font-weight:600;padding:14px;min-height:var(--touch-min);
cursor:pointer;text-align:center}
@media (prefers-color-scheme:dark){
body{background:var(--c-ink);color:var(--c-bone)}
.eyebrow,.note,.lede{color:var(--c-neutral-400)}
.rule{background:var(--c-neutral-900)}
.tok{color:var(--c-neutral-500)}
}
:root[data-theme="dark"] body{background:var(--c-ink);color:var(--c-bone)}
:root[data-theme="light"] body{background:var(--c-bone);color:var(--c-ink)}`;

const page = ({ group, title, name, lede, body, extra = "" }) => `<!-- @dsCard group="${group}" -->
<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>${FONT_FACE}${TOKENS}${BASE}${extra}</style>
</head><body><div class="sheet">
<p class="eyebrow">${name}</p>
<h1 class="t">${title}</h1>
<p class="lede">${lede}</p>
${body}
</div></body></html>`;

const cards = [];
const add = (path, html, meta) => {
  cards.push({ path, html, ...meta });
};

// ---------------------------------------------------------------------------
// Foundations — colour
// ---------------------------------------------------------------------------
// The printed value is read out of tokens.css, never typed here. A swatch used
// to carry a hand-written hex beside a chip painted from the real token, so the
// label could drift from the colour it sat next to and nothing would say so.
const tokenValue = (tok) => {
  const found = tokensCss.match(new RegExp(`${tok}\\s*:\\s*([^;]+);`));
  if (!found) throw new Error(`${tok} is not in tokens.css`);
  const raw = found[1].trim();
  // One level of indirection: --c-neutral-100 is var(--c-bone).
  const alias = raw.match(/^var\((--[a-z0-9-]+)\)$/);
  return alias ? tokenValue(alias[1]) : raw;
};

const swatch = (tok, _legacyHex, role) => `<div class="sw">
<div class="chip" style="background:var(${tok})"></div>
<div class="meta"><b>${tokenValue(tok).toUpperCase()}</b><span class="tok">${tok}</span>
<span class="role">${role}</span></div></div>`;

add(
  "foundations/colour.html",
  page({
    group: "Foundations",
    name: "Foundations",
    title: "Colour",
    lede:
      "Four brand colours, and one warm neutral ramp they sit on. Bone is step 100 and Charcoal is step 800, so the brand is part of the scale rather than an exception to it. Use solid surfaces; avoid gradients and decorative colour noise.",
    extra: `
.sw{display:flex;gap:12px;align-items:center}
.chip{width:56px;height:56px;border-radius:var(--r-sm);flex:none;
box-shadow:inset 0 0 0 1px rgb(25 24 19/.12)}
.meta{display:flex;flex-direction:column;gap:1px;min-width:0}
.meta b{font-size:var(--text-sm);font-weight:600;text-transform:uppercase;
letter-spacing:.04em}
.role{font-size:var(--text-2xs);color:var(--c-neutral-600);line-height:1.35}
.cols{grid-template-columns:repeat(auto-fill,minmax(228px,1fr))}
.ramp{display:flex;border-radius:var(--r-sm);overflow:hidden;height:64px;
box-shadow:inset 0 0 0 1px rgb(25 24 19/.12)}
.ramp div{flex:1}
.rlabels{display:flex;margin-top:6px}
.rlabels span{flex:1;font-size:9px;text-align:center;color:var(--c-neutral-600);
font-family:ui-monospace,monospace}
@media (prefers-color-scheme:dark){.role{color:var(--c-neutral-400)}}`,
    body: `
<p class="eyebrow">Brand</p>
<div class="grid cols">
${swatch("--c-bone", "#F1EFE8", "Reading, openness, calm surfaces")}
${swatch("--c-ink", "#191813", "Foundation, type, focused depth")}
${swatch("--c-orange", "#E36B37", "Identity, action, living attention")}
${swatch("--c-charcoal", "#403E35", "Structure, dividers, secondary text")}
</div>
<hr class="rule">
<p class="eyebrow">Warm neutral ramp</p>
<div class="ramp">
${["--c-white","--c-warm-50","--c-warm-100","--c-warm-200","--c-bone","--c-neutral-200","--c-neutral-300","--c-neutral-400","--c-neutral-500","--c-neutral-600","--c-neutral-700","--c-charcoal","--c-neutral-900","--c-neutral-950","--c-ink","--c-ink-deep"]
  .map((t) => `<div style="background:var(${t})"></div>`).join("")}
</div>
<div class="rlabels">
${["white","50","100","200","bone","200","300","400","500","600","700","char","900","950","ink","deep"]
  .map((l) => `<span>${l}</span>`).join("")}
</div>
<p class="note">This ramp replaced forty-odd hand-picked greys, including five
near-identical variants of one value and seven greys where none was Charcoal.</p>
<hr class="rule">
<p class="eyebrow">Orange states</p>
<div class="grid cols">
${swatch("--c-orange", "#E36B37", "Default identity and action")}
${swatch("--c-orange-600", "#DF642D", "Hover")}
${swatch("--c-orange-700", "#C65225", "Pressed")}
${swatch("--c-orange-800", "#B64C23", "Deep")}
</div>
<hr class="rule">
<p class="eyebrow">Activity categories</p>
<div class="grid cols">
${swatch("--c-activity-focus", "Orange", "Focus — focused time is identity time")}
${swatch("--c-activity-reading", "#E8D8BE", "Reading")}
${swatch("--c-activity-exercise", "#B98B69", "Exercise")}
${swatch("--c-activity-outside", "#A99F79", "Outside")}
${swatch("--c-activity-social", "#9D7F83", "Social")}
${swatch("--c-activity-rest", "#77796F", "Rest")}
${swatch("--c-activity-entertainment", "#635F69", "Entertainment")}
</div>
<p class="note">The hourly timeline palette. Held at low chroma so a whole day
reads as one calm object rather than a chart. Several of these sit close in
value and are a candidate for a proper categorical redesign.</p>`,
  }),
  { name: "Colour", group: "Foundations", subtitle: "Brand, neutral ramp, orange states, activity palette", w: 1060, h: 1500 },
);

// ---------------------------------------------------------------------------
// Foundations — type
// ---------------------------------------------------------------------------
const STEPS = [
  ["--text-7xl", "72px", "Outer editorial only"],
  ["--text-6xl", "52px", ""],
  ["--text-5xl", "40px", ""],
  ["--text-4xl", "32px", ""],
  ["--text-3xl", "28px", ""],
  ["--text-2xl", "24px", ""],
  ["--text-xl", "20px", "Page main text"],
  ["--text-lg", "18px", ""],
  ["--text-base", "16px", "Body"],
  ["--text-md", "14px", ""],
  ["--text-sm", "12px", ""],
  ["--text-xs", "11px", ""],
  ["--text-2xs", "10px", "Micro label — readability floor"],
];

add(
  "foundations/type.html",
  page({
    group: "Foundations",
    name: "Foundations",
    title: "Type",
    lede:
      "Geist for every app interior: labels, prompts, inputs, buttons, data. Cormorant Garamond for outer editorial headings only — never inside an app. Thirteen steps replaced fifty-seven ad-hoc sizes.",
    extra: `
.spec{display:flex;align-items:baseline;gap:16px;padding:9px 0;
border-bottom:1px solid var(--c-neutral-200)}
.spec .lbl{width:150px;flex:none}
.spec .lbl b{display:block;font-size:var(--text-2xs);font-family:ui-monospace,monospace}
.spec .lbl span{font-size:9px;color:var(--c-neutral-600)}
.spec .sample{flex:1;min-width:0;overflow:hidden;white-space:nowrap;
text-overflow:ellipsis;font-weight:500}
.faces{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.face{padding:20px;border-radius:var(--r-lg);background:var(--c-warm-100)}
.face .big{font-size:var(--text-4xl);line-height:1.1;margin:0 0 4px}
.face .cap{font-size:var(--text-2xs);letter-spacing:.14em;text-transform:uppercase;
color:var(--c-neutral-600);font-weight:600}
.face .use{font-size:var(--text-sm);color:var(--c-neutral-700);line-height:1.5;margin:8px 0 0}
@media (prefers-color-scheme:dark){
.spec{border-color:var(--c-neutral-900)}
.face{background:var(--c-neutral-950)}
.face .use,.spec .lbl span,.face .cap{color:var(--c-neutral-400)}}`,
    body: `
<div class="faces">
<div class="face">
<p class="big" style="font-family:Geist">Aa</p>
<p class="cap">Geist</p>
<p class="use">Every app interior. Regular weight to read, bold weight to act.
One app uses one font.</p>
</div>
<div class="face">
<p class="big" style="font-family:'Cormorant Garamond',Georgia,serif">Aa</p>
<p class="cap">Cormorant Garamond</p>
<p class="use">Outer editorial headlines and moments of pause. Give it room.
Never use it inside an app or for interface text.</p>
</div>
</div>
<hr class="rule">
<p class="eyebrow">Scale</p>
${STEPS.map(([tok, px, use]) => `<div class="spec">
<div class="lbl"><b>${tok}</b><span>${px}${use ? " · " + use : ""}</span></div>
<div class="sample" style="font-size:var(${tok})">The art of living</div></div>`).join("")}
<p class="note">Nothing goes below 10px. The standard says never shrink type to
fit content, so the body grows or scrolls instead. Fluid clamp() sizes on outer
editorial pages are intentional and sit outside this scale.</p>`,
  }),
  { name: "Type", group: "Foundations", subtitle: "Two faces, thirteen steps, 10px floor", w: 1060, h: 1250 },
);

// ---------------------------------------------------------------------------
// Foundations — shape and motion
// ---------------------------------------------------------------------------
add(
  "foundations/shape-motion.html",
  page({
    group: "Foundations",
    name: "Foundations",
    title: "Shape and motion",
    lede:
      "The App Box is one shape. Its radius is owned in one place and must not be redefined per feature. One easing curve, with durations named for what they do.",
    extra: `
.shapes{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-end}
.shape{text-align:center}
.shape .b{width:104px;height:82px;background:var(--c-orange);margin-bottom:7px}
.shape b{display:block;font-size:var(--text-2xs);font-family:ui-monospace,monospace}
.shape span{font-size:9px;color:var(--c-neutral-600)}
.mo{display:flex;align-items:center;gap:14px;padding:9px 0;
border-bottom:1px solid var(--c-neutral-200)}
.mo .lbl{width:170px;flex:none}
.mo .lbl b{display:block;font-size:var(--text-2xs);font-family:ui-monospace,monospace}
.mo .lbl span{font-size:9px;color:var(--c-neutral-600)}
.track{flex:1;height:8px;background:var(--c-neutral-200);border-radius:var(--r-full);
overflow:hidden}
.track i{display:block;height:100%;width:34%;background:var(--c-orange);
border-radius:var(--r-full);animation:run 2.6s var(--ease-out) infinite}
@keyframes run{0%{transform:translateX(-100%)}55%,100%{transform:translateX(295%)}}
@media (prefers-reduced-motion:reduce){.track i{animation:none}}
@media (prefers-color-scheme:dark){
.mo{border-color:var(--c-neutral-900)}
.track{background:var(--c-neutral-900)}
.shape span,.mo .lbl span{color:var(--c-neutral-400)}}`,
    body: `
<p class="eyebrow">Radius</p>
<div class="shapes">
${[["--r-sm","8px","inner chips"],["--r-md","12px","fields, actions"],["--r-lg","16px","panels"],["--r-box","28px","THE APP BOX"],["--r-full","999px","pills"]]
  .map(([t,v,u])=>`<div class="shape"><div class="b" style="border-radius:var(${t})"></div>
<b>${t}</b><span>${v} · ${u}</span></div>`).join("")}
</div>
<p class="note">Sixteen radii collapsed to five. About fifteen classes were each
declaring the App Box shape separately, at 24, 26, 27 and 28px.</p>
<hr class="rule">
<p class="eyebrow">Easing</p>
<p class="note" style="margin-top:0">One curve, <span class="tok">--ease-out:
cubic-bezier(0.22, 0.8, 0.22, 1)</span>. It replaced six hand-jittered variants
of itself.</p>
<hr class="rule">
<p class="eyebrow">Duration</p>
${[["--motion-tap","120ms","immediate feedback"],["--motion-quick","200ms","ordinary page travel, consecutive swipes"],["--motion-page","280ms","page change"],["--motion-frame","400ms","App Box height easing, after the transition"],["--motion-fade","560ms","content-layer leave"],["--motion-reveal","720ms","ceremonial cover reveal"],["--motion-settle","900ms","settle"]]
  .map(([t,v,u])=>`<div class="mo"><div class="lbl"><b>${t}</b><span>${v} · ${u}</span></div>
<div class="track"><i></i></div></div>`).join("")}
<p class="note">The page moves; the App Box does not. Reduced motion collapses
every duration to zero in one place, because they are tokens.</p>`,
  }),
  { name: "Shape and motion", group: "Foundations", subtitle: "Five radii, one curve, seven durations", w: 1060, h: 1150 },
);

// ---------------------------------------------------------------------------
// Real app screens
//
// These are not redrawings. `scripts/serve-design-system.mjs` exposes a capture
// endpoint; the running app posts its own rendered markup there, and the
// compiled stylesheets are pulled from the dev server with Tailwind already
// resolved. The markup goes in an iframe so the app's CSS, which sets body and
// element styles globally, cannot fight the card around it.
// ---------------------------------------------------------------------------
const CAPTURED = join(OUT, "_captured");
const captured = (f) => {
  const p = join(CAPTURED, f);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8");
};

// The compiled stylesheet from the production build, not the dev server: Vite
// serves CSS as a JavaScript module in dev, so fetching it over HTTP returns a
// wrapper the CSS parser gives up on after three rules.
const appCss = captured("app.css");

// When a capture was taken, which commit it was taken against, and whether
// app/os has moved since. A stale card that looks fine is the failure mode this
// design system keeps hitting, so the card says it about itself.
const headSha = (() => {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
  } catch {
    return "unknown";
  }
})();

// The last COMMIT that touched app/os, not the newest file mtime. An editor
// save, a checkout or a touch moves an mtime without changing the app, and a
// staleness warning that cries wolf is one nobody reads.
const newestAppChange = (() => {
  try {
    const at = execSync("git log -1 --format=%ct -- app/os", { cwd: ROOT })
      .toString()
      .trim();
    return at ? Number(at) * 1000 : 0;
  } catch {
    return 0;
  }
})();

const staleCaptures = [];
const missingCaptures = [];

const provenanceNote = (capture) => {
  const file = join(CAPTURED, capture);
  if (!existsSync(file)) {
    missingCaptures.push(capture);
    return "";
  }
  const taken = statSync(file).mtimeMs;
  if (newestAppChange > taken) staleCaptures.push(capture);
  const when = new Date(taken).toISOString().slice(0, 16).replace("T", " ");
  const stale = newestAppChange > taken;
  return stale
    ? `<b style="color:var(--c-orange-800)">This capture is out of date.</b> Taken ${when} against <code>${headSha}</code>, and app/os has changed since. Re-capture before trusting it.`
    : `Captured ${when} from the running app, against <code>${headSha}</code>. Not a redrawing \u2014 if the app does not do it, this card cannot show it.`;
};

const screen = (file, capture, title, lede, notes, meta) => {
  const markup = captured(capture);
  if (!markup || !appCss) {
    console.warn(`skipping ${file}: run the capture step first`);
    return;
  }
  // Drop the build's own @font-face rules: their URLs point at hashed asset
  // paths that do not exist inside a standalone card, and because they come
  // later in the cascade they would beat the embedded copies.
  const noFonts = appCss.replace(/@font-face\{[^}]*\}/g, "");

  // next/font puts --font-sans and --font-display on <body> via a generated
  // class. The capture starts at .circle-os, below that, so the variables have
  // to be restored or every rule that reads them falls back to a system face.
  const inner = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<style>${FONT_FACE}${noFonts}
html{--font-sans:Geist;--font-display:"Cormorant Garamond"}
html,body{margin:0;background:var(--c-ink-deep);font-family:Geist,system-ui,sans-serif}
</style></head>
<body>${markup}</body></html>`;
  const srcdoc = inner.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

  add(
    file,
    page({
      group: "The app today",
      name: "Live screen",
      title,
      lede,
      extra: `
.phone{width:375px;height:760px;border:0;border-radius:var(--r-box);
background:var(--c-ink-deep);box-shadow:0 2px 4px rgb(25 24 19/.1),
0 18px 48px rgb(25 24 19/.16);display:block}
.frame{display:flex;gap:26px;flex-wrap:wrap;align-items:flex-start}
.cap{font-size:var(--text-2xs);letter-spacing:.14em;text-transform:uppercase;
font-weight:600;color:var(--c-neutral-600);margin:10px 0 0;text-align:center}
.obs{margin:0 0 8px;padding-left:17px;font-size:var(--text-sm);line-height:1.6;
color:var(--c-neutral-700)}
@media (prefers-color-scheme:dark){.cap,.obs{color:var(--c-neutral-400)}}`,
      body: `<div class="frame">
<div><iframe class="phone" title="${title}" sandbox="allow-same-origin"
srcdoc="${srcdoc}"></iframe><p class="cap">375 × 760 — iPhone width</p></div>
<div style="flex:1;min-width:270px">
<p class="eyebrow">What to look at</p>
${[provenanceNote(capture), ...notes].filter(Boolean).map((n) => `<p class="obs">${n}</p>`).join("")}
</div></div>`,
    }),
    meta,
  );
};

screen(
  "screens/today.html",
  "today.html",
  "Today",
  "The real Today screen, captured from the running app with a seeded profile. This is where the day is written.",
  [
    "The App Box stack: the <b>Note and Thoughts</b> deck, <b>Routine</b> with Protocol, then <b>Log</b>. Each is its own box rather than one scrolling page.",
    "The Note and Thoughts deck is the only session in Circle OS that turns its own Page, on a 30 second dwell. Every other App Box is still.",
    "Routine and Protocol share the orange surface and one placement contract, so a swipe between them never resizes the frame.",
    "The hourly log runs from the recorded wake time to sleep, so the length of the day is the person's own, not a fixed 24 rows.",
    "Log's second Page is the <b>Dreamline</b>: the dream sheet, the steps, then the one thing to do today.",
  ],
  { name: "Today", group: "The app today", subtitle: "Note, Thoughts, Routine, Protocol, Log", w: 1060, h: 900 },
);

screen(
  "screens/reflect.html",
  "reflect.html",
  "Reflect",
  "The Reflect tab, where the day is read rather than written. Four sessions, and nothing on this route turns its own Page.",
  [
    "Four sessions stacked: <b>Vision</b>, <b>Week Review</b>, <b>Athena's Reading</b>, <b>Suggestion</b>. Each is swipeable both ways and keeps a stable height.",
    "<b>Week Review is the mirror.</b> Yesterday opens it, then it widens to the daily pattern, the four periods of the day, and the week that held or did not.",
    "<b>Athena's Reading is the voice.</b> Life overall, and its cover line is written fresh each morning. The two must not blur: if the mirror starts persuading, he is told the same thing twice.",
    "Each session shows a cover first with a <b>Swipe to see</b> cue, so nothing is read before the person asks for it.",
    "Nothing here rotates. A surface that is read must hold still.",
  ],
  { name: "Reflect", group: "The app today", subtitle: "Vision, Week Review, Athena's Reading, Suggestion", w: 1060, h: 900 },
);

screen(
  "screens/today-thoughts.html",
  "today-thoughts.html",
  "Today — Thoughts",
  "The second Page of the check-in deck. This is the only session in Circle OS that turns its own Page, so this is what arrives on its own after thirty seconds.",
  [
    "Thoughts and Note are two Pages of one App Box, not two boxes. The App Label at top left names which one you are on and is the control that flips to Deep Thoughts.",
    "The prompt is the Main Body and carries the full Page-heading treatment; the writing area sits under it.",
    "Compare the box height here against the Note capture. They must measure the same at rest, or a rotation would resize the frame under the reader.",
  ],
  { name: "Thoughts", group: "The app today", subtitle: "Check-in deck, second Page", w: 1060, h: 900 },
);

screen(
  "screens/today-protocol.html",
  "today-protocol.html",
  "Today — Protocol",
  "Protocol with an active run. It is the second Page of the Routine App Box rather than a fourth box in the stack, which is the placement the August proposal argued for and this shipped.",
  [
    "Same box, same surface, same measurements as Routine. Only the Page changed.",
    "The run shown is a real one: Monk Mode, with its phase and its terms.",
    "A protocol is a container of time — it starts, it ends, its terms were agreed before it began. Missing a non-negotiable is recorded and costs nothing; there is no reset and no failure state.",
  ],
  { name: "Protocol", group: "The app today", subtitle: "Routine box, second Page, active run", w: 1060, h: 900 },
);

screen(
  "screens/today-back.html",
  "today-back.html",
  "Today — a card back",
  "The Routine App Box flipped to its Record back. Every App Box has exactly one back, and the App Label at top left is what flips it.",
  [
    "The label reads <b>Record</b> here and <b>Routine</b> on the front. The label is the control; there is no separate button.",
    "The back is the record: what was completed today, and what was completed yesterday.",
    "The box does not resize across the flip. A back that measured differently would make the whole stack jump.",
  ],
  { name: "A card back", group: "The app today", subtitle: "Routine flipped to Record", w: 1060, h: 900 },
);

screen(
  "screens/today-dreamline.html",
  "today-dreamline.html",
  "Today — Dreamline",
  "Log's second Page. The dream sheet: setup, Having, Being, Doing and the income they add up to, on one Page that scrolls, because a worksheet is a sheet rather than five cards.",
  [
    "The right-hand label reads <b>The dream</b>. Its siblings are <b>Steps</b> and, once the steps are saved, <b>Today</b>.",
    "A one-time cost shows both numbers — what it costs and what it costs per month across the timeline — because an inflated target makes the dream feel further away, which is the opposite of the point.",
    "Only starred lines enter the income and only starred lines take steps. That is where 80/20 stops being a slogan in this app.",
  ],
  { name: "Dreamline", group: "The app today", subtitle: "Log box, second Page", w: 1060, h: 900 },
);

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------
// A design system that has quietly aged is the failure this project keeps
// hitting, so say it out loud at the end of every build. `--check` turns the
// warning into a non-zero exit for anything that wants to gate on it; the
// ordinary build only warns, because the app must stay deployable whether or
// not its design reference has been re-captured.
const reportCaptureAge = () => {
  const checking = process.argv.includes("--check");
  if (missingCaptures.length) {
    console.warn(`\nmissing captures: ${missingCaptures.join(", ")}`);
    console.warn("run the capture step, then build again.");
  }
  if (staleCaptures.length) {
    console.warn(`\n${staleCaptures.length} capture(s) older than the last app/os commit:`);
    for (const c of staleCaptures) console.warn(`  ${c}`);
    console.warn("those cards say so on their own face. re-capture to clear it.");
  }
  if (!missingCaptures.length && !staleCaptures.length) {
    console.log("every capture is newer than the last app/os commit.");
  }
  if (checking && (missingCaptures.length || staleCaptures.length)) process.exit(1);
};

for (const c of cards) {
  const full = join(OUT, c.path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, c.html, "utf8");
}
reportCaptureAge();
// The Design pane indexes cards from this manifest. It is compiled by the app's
// own self-check, which does not re-run for an incremental push, so cards can
// upload successfully and still never appear. Emit it here and push it with the
// bundle so the index always matches what was uploaded.
writeFileSync(
  join(OUT, "_ds_manifest.json"),
  JSON.stringify({
    namespace: "TheCircleOS_d1c2ec",
    components: [], startingPoints: [],
    cards: cards.map(({ path, group }) => ({ path, group })),
    templates: [], hasThumbnailHtml: false, globalCssPaths: [],
    tokens: [], themes: [], fonts: [], brandFonts: [], source: "spa",
  }),
  "utf8",
);

writeFileSync(
  join(OUT, "_manifest.json"),
  JSON.stringify(
    cards.map(({ path, name, group, subtitle, w, h }) => ({
      path, name, group, subtitle, viewport: { width: w, height: h },
    })),
    null,
    2,
  ),
  "utf8",
);

const kb = (n) => `${Math.round(n / 1024)}KB`;
console.log(`${cards.length} cards -> design-system/`);
for (const c of cards) console.log(`  ${c.path.padEnd(34)} ${kb(c.html.length)}`);
console.log(`total ${kb(cards.reduce((s, c) => s + c.html.length, 0))}`);
