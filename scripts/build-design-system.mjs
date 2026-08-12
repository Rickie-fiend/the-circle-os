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

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
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
const swatch = (tok, hex, role) => `<div class="sw">
<div class="chip" style="background:var(${tok})"></div>
<div class="meta"><b>${hex}</b><span class="tok">${tok}</span>
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
// App Box anatomy
// ---------------------------------------------------------------------------
add(
  "components/app-box.html",
  page({
    group: "App Box",
    name: "Structure",
    title: "The App Box",
    lede:
      "The App Box is the stable rounded frame. A Page is the sheet that moves inside it. The box owns radius, clipping, border, shadow, theme and height change. Pages never add a second outer card.",
    extra: `
.row{display:flex;gap:26px;flex-wrap:wrap}
.anat{position:relative}
.reg{outline:1px dashed rgb(227 107 55/.55);outline-offset:2px;position:relative}
/* Region labels sit on the dashed edge like a fieldset legend, so they never
 * land on top of the content they are pointing at. */
.reg::after{content:attr(data-r);position:absolute;top:-7px;right:6px;
font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--c-orange);
font-weight:700;background:var(--c-warm-50);padding:0 4px;line-height:1}
.cap{font-size:var(--text-2xs);letter-spacing:.14em;text-transform:uppercase;
font-weight:600;color:var(--c-neutral-600);margin:10px 0 0;text-align:center}
@media (prefers-color-scheme:dark){.cap{color:var(--c-neutral-400)}}`,
    body: `
<div class="row">
<div class="anat">
<div class="box">
<header class="reg" data-r="header"><span>Habit</span><span>2 / 5</span></header>
<div class="body">
<div class="reg" data-r="main body" style="flex:2;display:flex;align-items:flex-end">
<p class="main" style="margin:0">Your habit today</p></div>
<div class="reg sub" data-r="sub body" style="flex:1">
<p style="margin:0;font-size:var(--text-md);line-height:1.5">Walk before the
first screen.</p></div>
</div>
<footer class="reg" data-r="footer"><button class="act">Add task</button></footer>
</div>
<p class="cap">Anatomy</p>
</div>

<div><div class="box"><header><span>Note</span><span></span></header>
<div class="body"><p class="main">A calm editorial object that happens to be
useful.</p></div><footer><button class="act">Save</button></footer></div>
<p class="cap">Light</p></div>

<div><div class="box orange"><header><span>Vision</span><span></span></header>
<div class="body"><p class="main">Name the life you are actually building.</p></div>
<footer><button class="act" style="background:var(--c-ink);color:var(--c-bone)">Continue</button></footer></div>
<p class="cap">Orange</p></div>

<div><div class="box dark"><header><span>Log</span><span>Today</span></header>
<div class="body"><p class="main">Six hours awake. Two recorded.</p></div>
<footer><button class="act" style="background:var(--c-bone);color:var(--c-ink)">Add an hour</button></footer></div>
<p class="cap">Dark</p></div>
</div>
<p class="note">Main Body takes about two parts of the body space and anchors to
its lower edge; Sub Body takes about one and follows directly beneath. Empty
optional regions collapse cleanly and leave no dead gap. Theme changes preserve
the same geometry and hierarchy.</p>`,
  }),
  { name: "App Box", group: "App Box", subtitle: "Anatomy and the three themes", w: 1060, h: 900 },
);

// ---------------------------------------------------------------------------
// Page types
// ---------------------------------------------------------------------------
const pageCard = (file, title, lede, inner, note, meta) =>
  add(
    file,
    page({
      group: "Page types",
      name: "Page type",
      title,
      lede,
      extra: `.row{display:flex;gap:26px;flex-wrap:wrap}
.cap{font-size:var(--text-2xs);letter-spacing:.14em;text-transform:uppercase;
font-weight:600;color:var(--c-neutral-600);margin:10px 0 0;text-align:center}
.cue{font-size:var(--text-sm);opacity:.62;text-align:right}
.centred .body{justify-content:center}
.opt{border:0;background:var(--c-warm-100);border-radius:var(--r-md);
font-family:inherit;font-size:var(--text-md);padding:13px 15px;width:100%;
text-align:left;min-height:var(--touch-min);cursor:pointer;display:block;
margin-bottom:8px;color:inherit;box-shadow:inset 0 0 0 1px rgb(25 24 19/.09)}
.opt.on{background:var(--c-ink);color:var(--c-bone);box-shadow:none}
.edit{outline:0;border-bottom:1px solid transparent}
@media (prefers-color-scheme:dark){.cap{color:var(--c-neutral-400)}}`,
      body: `<div class="row">${inner}</div><p class="note">${note}</p>`,
    }),
    meta,
  );

pageCard(
  "components/page-cover.html",
  "Cover Page",
  "One main hook, one optional short subtitle, one swipe cue. No header labels, never editable. A Cover never shows an App Label.",
  `<div><div class="box centred"><header></header>
<div class="body"><p class="main">You have recorded four days this week.</p>
<p class="sub" style="margin:0;font-size:var(--text-md);opacity:.7">That is enough to see a shape.</p></div>
<footer><p class="cue" style="margin:0">Swipe to begin</p></footer></div>
<p class="cap">Light</p></div>
<div><div class="box orange centred"><header></header>
<div class="body"><p class="main">Seven days of your real life.</p></div>
<footer><p class="cue" style="margin:0">Swipe to see</p></footer></div>
<p class="cap">Orange</p></div>`,
  `Main text uses the shared Info Page token and centre anchor, so it looks identical to Main text on Note and Thoughts Pages. A new cover reveal is ceremonial: the old page fades, the solid surface settles, then text arrives in sequence — and the cover cannot be swiped until that reveal completes.`,
  { name: "Cover Page", group: "Page types", subtitle: "Hook, optional subtitle, swipe cue", w: 1060, h: 800 },
);

pageCard(
  "components/page-chapter.html",
  "Chapter Page",
  "One question or lesson in Main Body, one interaction in Sub Body, one full-width action in the Footer. Header carries progress on the right only — no left label.",
  `<div><div class="box"><header><span></span><span>3 / 7</span></header>
<div class="body"><p class="main">How much of today felt like your own?</p>
<div class="sub"><button class="opt on">Most of it</button>
<button class="opt">About half</button><button class="opt">Very little</button></div></div>
<footer><button class="act">Continue</button></footer></div>
<p class="cap">Choice</p></div>
<div><div class="box"><header><span></span><span>5 / 7</span></header>
<div class="body"><p class="main">What took the most out of you?</p>
<div class="sub"><p class="edit" style="margin:0;font-size:var(--text-md);
line-height:1.5;opacity:.45">Answer in your own words…</p></div></div>
<footer><button class="act">Confirm</button></footer></div>
<p class="cap">Short answer</p></div>`,
  `Choice options stack one full-width row at a time so authoring preview and published behaviour cannot diverge on a phone. A choice, slider or short answer stays at the default App Box height — grow only for real content such as a paragraph, never for empty form space. Answers are borderless editable typography: no field box, no underline.`,
  { name: "Chapter Page", group: "Page types", subtitle: "Choice and short answer", w: 1060, h: 820 },
);

pageCard(
  "components/page-note.html",
  "Note Page",
  "An editable Info Page with an app action label. Text is edited directly in its display typography — no separate edit box, no Save-message step, no swipe cue.",
  `<div><div class="box centred"><header><span>Note</span><span></span></header>
<div class="body"><p class="main edit">Small things, kept honestly, become
evidence.</p></div><footer></footer></div>
<p class="cap">Idle</p></div>
<div><div class="box centred"><header><span>Note</span><span>Recall</span></header>
<div class="body"><p class="main edit" style="opacity:.42">Write something worth
keeping…</p></div><footer></footer></div>
<p class="cap">Empty</p></div>`,
  `Note is the one deliberate, recallable destination. Its idle Page stays visible until the person taps the Note mode label, and that label can recall the newest unfinished or dismissed Note chapter. Dismissing means not now; it never deletes delivery. Main text keeps the same centre anchor as a Cover Page, and optional Sub text begins beneath that anchor without pushing Main up.`,
  { name: "Note Page", group: "Page types", subtitle: "Idle and empty states", w: 1060, h: 800 },
);

pageCard(
  "components/page-thoughts.html",
  "Thoughts Page",
  "Info Page geometry with inviting editable typography and one full-width black Send action in the Footer.",
  `<div><div class="box centred"><header><span>Thoughts</span><span></span></header>
<div class="body"><p class="main edit" style="opacity:.42">What is actually on
your mind?</p></div><footer><button class="act">Send</button></footer></div>
<p class="cap">Thoughts</p></div>
<div><div class="box centred"><header><span>Deep Thoughts</span><span></span></header>
<div class="body"><p class="main edit">I keep choosing the easier room.</p></div>
<footer><button class="act">Send</button></footer></div>
<p class="cap">Deep Thoughts</p></div>`,
  `The placeholder uses the same size, weight, line-height and centre anchor as Cover and Note Main text. Thoughts to Deep Thoughts is the reference in-place mode change: it reuses the ceremonial reveal rather than swapping instantly. The top-left label is a mode control, not navigation.`,
  { name: "Thoughts Page", group: "Page types", subtitle: "Thoughts and Deep Thoughts", w: 1060, h: 800 },
);

pageCard(
  "components/page-blog.html",
  "Blog Page",
  "A reading page: title, divider, and short paragraph sections. Athena Reading is the reference. Reading rhythm matters more than packing information into one viewport.",
  `<div><div class="box" style="width:392px;min-height:430px">
<header><span>Athena</span><span>Reading</span></header>
<div class="body" style="justify-content:flex-start">
<h2 style="font-size:var(--text-2xl);line-height:1.2;margin:0;font-weight:600;
letter-spacing:-.01em">What your Tuesdays show</h2>
<hr style="height:1px;background:currentColor;opacity:.16;border:0;margin:14px 0">
<p style="margin:0 0 12px;font-size:var(--text-md);line-height:1.62">You recorded
four Tuesdays this month. Three of them began with a screen.</p>
<p style="margin:0;font-size:var(--text-md);line-height:1.62">That is not a
verdict. It is a pattern with four pieces of evidence behind it, and you can
open every one.</p>
</div><footer></footer></div>
<p class="cap">Athena Reading</p></div>`,
  `Athena observes evidence, expresses uncertainty, and helps the person notice a gap. Athena does not give life advice. Every AI conclusion must be editable, dismissible, and grounded in the person's own records — weekly views show real recorded life, and interpretation stays clearly separated from observed data.`,
  { name: "Blog Page", group: "Page types", subtitle: "Athena Reading reference", w: 1060, h: 760 },
);

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
add(
  "components/actions.html",
  page({
    group: "Components",
    name: "Components",
    title: "Actions",
    lede:
      "Full-width actions use the same black button language across apps. Minimum touch target 44px. Every swipe also has a button or keyboard path.",
    extra: `
.row{display:flex;gap:26px;flex-wrap:wrap;align-items:flex-start}
.stack{width:340px;padding:22px;border-radius:var(--r-box);background:var(--c-warm-50)}
.stack.dark{background:var(--c-ink)}
.stack.orange{background:var(--c-orange)}
.cap{font-size:var(--text-2xs);letter-spacing:.14em;text-transform:uppercase;
font-weight:600;color:var(--c-neutral-600);margin:10px 0 0;text-align:center}
.act{margin-bottom:10px;transition:background var(--motion-tap) var(--ease-out)}
.act.ghost{background:transparent;color:var(--c-ink);
box-shadow:inset 0 0 0 1px rgb(25 24 19/.22)}
.act[disabled]{opacity:.34;cursor:not-allowed}
.cue{font-size:var(--text-sm);opacity:.62;text-align:right;margin:0}
@media (prefers-color-scheme:dark){.cap{color:var(--c-neutral-400)}}`,
    body: `
<div class="row">
<div><div class="stack">
<button class="act">Continue</button>
<button class="act ghost">Later</button>
<button class="act" disabled>Confirm</button>
<p class="cue">Swipe to begin</p>
</div><p class="cap">Light</p></div>

<div><div class="stack dark">
<button class="act" style="background:var(--c-bone);color:var(--c-ink)">Add an hour</button>
<button class="act ghost" style="color:var(--c-bone);box-shadow:inset 0 0 0 1px rgb(241 239 232/.28)">Not now</button>
<p class="cue" style="color:var(--c-bone)">Swipe to see</p>
</div><p class="cap">Dark</p></div>

<div><div class="stack orange">
<button class="act" style="background:var(--c-ink);color:var(--c-bone)">Begin</button>
<button class="act ghost" style="color:var(--c-white);box-shadow:inset 0 0 0 1px rgb(255 255 255/.42)">Skip</button>
<p class="cue" style="color:var(--c-white)">Swipe to begin</p>
</div><p class="cap">Orange</p></div>
</div>
<p class="note">Required-input feedback uses a brief, clear head shake of the
text layer rather than an error message. A tap never becomes a swipe, and text
fields never focus because of a swipe.</p>`,
  }),
  { name: "Actions", group: "Components", subtitle: "Full-width, ghost, disabled, swipe cue", w: 1060, h: 640 },
);

// ---------------------------------------------------------------------------
// Habit stack
// ---------------------------------------------------------------------------
add(
  "components/habit-stack.html",
  page({
    group: "Components",
    name: "Components",
    title: "Habit stack",
    lede:
      "Repeated habits form one continuous Sub Body stack: one quiet divider and one row rhythm per habit, with no nested card and no doubled spacing.",
    extra: `
.row{display:flex;gap:26px;flex-wrap:wrap;align-items:flex-start}
.cap{font-size:var(--text-2xs);letter-spacing:.14em;text-transform:uppercase;
font-weight:600;color:var(--c-neutral-600);margin:10px 0 0;text-align:center}
.hrow{display:flex;align-items:center;gap:11px;padding:11px 0;
border-top:1px solid rgb(25 24 19/.11);font-size:var(--text-md);
min-height:var(--touch-min)}
.tick{width:19px;height:19px;border-radius:var(--r-full);flex:none;
box-shadow:inset 0 0 0 1.5px rgb(25 24 19/.3)}
.tick.on{background:var(--c-orange);box-shadow:none;position:relative}
.tick.on::after{content:"";position:absolute;left:6px;top:3.5px;width:5px;
height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(43deg)}
.done{opacity:.44;text-decoration:line-through}
@media (prefers-color-scheme:dark){.cap{color:var(--c-neutral-400)}}`,
    body: `
<div class="row">
<div><div class="box">
<header><span>Habit</span><span></span></header>
<div class="body">
<p class="eyebrow" style="margin:0 0 6px;color:inherit;opacity:.55">Your habit today</p>
<p class="main" style="margin:0">Walk before the first screen.</p>
<div class="sub">
<div class="hrow"><span class="tick on"></span><span class="done">Drink water</span></div>
<div class="hrow"><span class="tick"></span><span>Read ten pages</span></div>
<div class="hrow"><span class="tick"></span><span>Call one person</span></div>
</div></div>
<footer><button class="act">Add task</button></footer></div>
<p class="cap">With tasks</p></div>

<div><div class="box">
<header><span>Habit</span><span></span></header>
<div class="body">
<p class="eyebrow" style="margin:0 0 6px;color:inherit;opacity:.55">Your habit today</p>
<p class="main" style="margin:0">Walk before the first screen.</p>
</div>
<footer><button class="act">Add task</button></footer></div>
<p class="cap">Empty</p></div>
</div>
<p class="note">The divider appears only when Sub Body has an item. When Habit
has no tasks that region collapses so the main action meets the Add task Footer
without a dead gap — and the empty state stays at the same default App Box
height as Note, Thoughts and a short Chapter. A feature does not invent its own
empty-state height. Tasks stay visible in one continuous Sub Body rather than an
inner scrolling panel.</p>`,
  }),
  { name: "Habit stack", group: "Components", subtitle: "Continuous rows, filled and empty", w: 1060, h: 800 },
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
${notes.map((n) => `<p class="obs">${n}</p>`).join("")}
</div></div>`,
    }),
    meta,
  );
};

screen(
  "screens/today.html",
  "today.html",
  "Today",
  "The real Today screen, captured from the running app with a seeded profile. This is the surface used every day: check-in, habit, tasks, and the hourly log.",
  [
    "The App Box stack: Check-in, Habit, Habits, Tasks, then Log. Each is its own box rather than one scrolling page.",
    "The hourly log runs from the recorded wake time to sleep, so the length of the day is the person's own, not a fixed 24 rows.",
    "Empty hours still offer <b>Add main activity</b>. Most rows on a normal day are empty, which is worth designing for rather than around.",
    "Filled hours carry an activity colour from the categorical palette. Several of those colours sit close in value, which is easiest to judge here.",
    "Every row has a <b>+</b> affordance. On a full day that is a lot of repeated controls competing for attention.",
  ],
  { name: "Today", group: "The app today", subtitle: "Check-in, habit, tasks, hourly log", w: 1060, h: 900 },
);

screen(
  "screens/reflect.html",
  "reflect.html",
  "Reflect",
  "The Reflect tab, which holds Vision, the last seven days, and Athena. Vision remains the inner white app about the life the person wants.",
  [
    "Three library sessions stacked: <b>Vision</b>, <b>Last seven days</b>, <b>Athena</b>. Each is swipeable in both directions and keeps a stable height.",
    "Each session shows a cover first with a <b>Swipe to see</b> cue, so nothing is read before the person asks for it.",
    "Athena observes evidence and expresses uncertainty. It never gives life advice, and every conclusion must stay editable and dismissible.",
    "This is the surface where interpretation lives, deliberately separated from the observed data on Today.",
  ],
  { name: "Reflect", group: "The app today", subtitle: "Vision, seven days, Athena", w: 1060, h: 900 },
);

// ---------------------------------------------------------------------------
// Protocol — proposed
// ---------------------------------------------------------------------------
const PROTOCOL_EXTRA = `
.row{display:flex;gap:26px;flex-wrap:wrap;align-items:flex-start}
.cap{font-size:var(--text-2xs);letter-spacing:.14em;text-transform:uppercase;
font-weight:600;color:var(--c-neutral-600);margin:10px 0 0;text-align:center}
.box.tall{min-height:430px}
.kind{font-size:var(--text-2xs);letter-spacing:.14em;text-transform:uppercase;
font-weight:600;opacity:.72;margin:0 0 8px}
.runname{font-size:var(--text-2xl);font-weight:700;letter-spacing:-.015em;margin:0 0 14px}
/* A protocol item is a block, and the block is the button. Terms are locked
 * while a run is going, so nothing inside needs to be tapped for editing. */
.blk{display:flex;align-items:center;justify-content:space-between;gap:12px;
width:100%;text-align:left;font-family:inherit;color:inherit;cursor:pointer;
border-radius:var(--r-md);padding:14px 15px;margin-bottom:9px;min-height:56px;
background:rgb(255 248 241 / 0.14);border:2px solid var(--c-ink);
font-size:var(--text-lg);font-weight:640;line-height:1.25;
box-shadow:0 3px 0 var(--c-orange-900);transform:translateY(-3px)}
.blk .t{flex:1;min-width:0}
.blk .dot{width:24px;height:24px;border-radius:var(--r-full);flex:none;
box-shadow:inset 0 0 0 2px rgb(25 24 19 / 0.5)}
/* Negotiable: same block, lighter commitment. */
.blk.nego{border-style:dashed;border-color:rgb(25 24 19 / 0.5);
font-size:var(--text-md);font-weight:540;min-height:48px;
box-shadow:0 2px 0 rgb(159 63 30 / 0.55);transform:translateY(-2px)}
/* Done: the block fills in. */
.blk.done{background:var(--c-ink);color:var(--c-warm-50);box-shadow:none;
transform:translateY(0)}
.blk.done .t{opacity:.62;text-decoration:line-through;text-decoration-thickness:1.5px}
.blk.done .dot{background:var(--c-warm-50);box-shadow:none;position:relative}
.blk.done .dot::after{content:"";position:absolute;left:8.5px;top:5px;width:6px;
height:11px;border:solid var(--c-ink);border-width:0 2.5px 2.5px 0;transform:rotate(43deg)}
.obs{margin:0 0 8px;padding-left:17px;font-size:var(--text-sm);line-height:1.6;
color:var(--c-neutral-700)}
@media (prefers-color-scheme:dark){.cap,.obs{color:var(--c-neutral-400)}}`;

add(
  "components/protocol.html",
  page({
    group: "Protocol",
    name: "Proposed",
    title: "Protocol",
    lede:
      "A habit is open-ended. A protocol is a container of time: it starts, it ends, and the terms were agreed at the start. Same orange App Box as Habit, but the rows become blocks — a list of lines against a stack of blocks, legible without being explained.",
    extra: PROTOCOL_EXTRA,
    body: `<div class="row">
<div><div class="box tall orange">
<header><span>Protocol</span><span>Day 3 of 7</span></header>
<div class="body" style="justify-content:flex-start">
<p class="runname">Monk Mode</p>
<p class="kind">Non-negotiable</p>
<button class="blk done"><span class="t">Journaling 1 line</span><span class="dot"></span></button>
<button class="blk"><span class="t">Working out 5 min</span><span class="dot"></span></button>
<button class="blk"><span class="t">Meditation 5 min</span><span class="dot"></span></button>
<p class="kind" style="margin-top:16px">Negotiable</p>
<button class="blk nego"><span class="t">Read 1 chapter</span><span class="dot"></span></button>
</div><footer></footer></div>
<p class="cap">Day 3 of a run</p></div>

<div style="flex:1;min-width:260px">
<p class="eyebrow">How it reads</p>
<p class="obs">A solid block must happen. A dashed block is one you can negotiate. That is the entire visual language, and it works for an eight year old.</p>
<p class="obs">The block is the button. Habit rows keep a tick beside them because their text is edited in place; a protocol's terms are locked while it runs, so the whole block can be pressed and there is nothing to conflict with.</p>
<p class="obs">Pressing fills the block in. Each day you fill your blocks.</p>
<p class="obs">Missing one is recorded and punished with nothing. No reset, no failure screen. The day shows what happened, which is the point of the app.</p>
<p class="obs">Terms cannot be edited mid-run. A run can be ended early and that is recorded honestly, because otherwise "non-negotiable" is a word with no meaning.</p>
<p class="obs">Progress sits in the Header right slot, the same place a Chapter Page puts it.</p>
</div></div>`,
  }),
  { name: "Protocol", group: "Protocol", subtitle: "Blocks, non-negotiable and negotiable", w: 1060, h: 860 },
);

// ---------------------------------------------------------------------------
// Today — proposed
// ---------------------------------------------------------------------------
add(
  "screens/today-proposed.html",
  page({
    group: "The app today",
    name: "Proposed",
    title: "Today, proposed",
    lede:
      "The whole doing surface, with the combined Habit app and the new Protocol app in place. Every App Box keeps one shape and one radius; only the theme and the contents change.",
    extra: `
.phone{width:375px;background:var(--c-ink-deep);border-radius:34px;padding:14px 12px 20px;
box-shadow:0 2px 4px rgb(25 24 19/.1),0 18px 48px rgb(25 24 19/.18)}
.chrome{display:flex;justify-content:space-between;align-items:center;
padding:6px 8px 12px;color:var(--c-bone);font-size:var(--text-2xs);
letter-spacing:.15em;text-transform:uppercase;font-weight:700}
.tabs{display:flex;background:rgb(255 248 241/.09);border-radius:var(--r-full);
padding:4px;margin-bottom:16px}
.tabs span{flex:1;text-align:center;padding:9px;border-radius:var(--r-full);
font-size:var(--text-md);font-weight:600;color:rgb(255 248 241/.6)}
.tabs span.on{background:var(--c-bone);color:var(--c-ink)}
.date{color:var(--c-orange);font-size:var(--text-2xs);letter-spacing:.15em;
text-transform:uppercase;font-weight:700;margin:0 0 4px;padding:0 4px}
.hello{color:var(--c-bone);font-size:var(--text-2xl);font-weight:700;
letter-spacing:-.02em;margin:0 0 16px;padding:0 4px}
.app{border-radius:var(--r-box);padding:20px;margin-bottom:14px}
.app.note{background:var(--c-bone);color:var(--c-ink)}
.app.orange{background:var(--c-orange);color:var(--c-warm-50)}
.app.dark{background:var(--c-ink);color:var(--c-bone)}
.ahead{display:flex;justify-content:space-between;align-items:center;
font-size:var(--text-2xs);letter-spacing:.15em;text-transform:uppercase;
font-weight:700;margin-bottom:14px;opacity:.9}
.pill{background:var(--c-ink);color:var(--c-bone);border-radius:var(--r-full);
padding:7px 13px;font-size:var(--text-2xs);letter-spacing:.06em;text-transform:none;
font-weight:600}
.hrow{display:flex;align-items:center;gap:12px;min-height:44px;padding:7px 0}
.hrow .t{flex:1;font-size:var(--text-2xl);font-weight:700;line-height:1.2;
letter-spacing:-.015em}
.hrow.task .t{font-size:var(--text-lg);font-weight:540}
.tick{width:42px;height:42px;border-radius:var(--r-full);flex:none;
background:rgb(255 248 241/.17);box-shadow:inset 0 1px 0 rgb(255 248 241/.4),
0 4px 0 var(--c-orange-900);transform:translateY(-4px);position:relative}
.hrow.task .tick{width:30px;height:30px;box-shadow:inset 0 1px 0 rgb(255 248 241/.34),
0 3px 0 var(--c-orange-900);transform:translateY(-3px)}
.tick.done{background:var(--c-ink);box-shadow:inset 0 1px 3px rgb(25 24 19/.55);
transform:translateY(0)}
.tick.done::after{content:"";position:absolute;left:16px;top:12px;width:7px;height:15px;
border:solid var(--c-warm-50);border-width:0 2.5px 2.5px 0;transform:rotate(43deg)}
.hrow.task .tick.done::after{left:11px;top:8px;width:5px;height:11px;border-width:0 2px 2px 0}
.seam{height:2px;background:var(--c-ink);margin:12px 0;border:0}
.kind{font-size:var(--text-2xs);letter-spacing:.14em;text-transform:uppercase;
font-weight:700;opacity:.72;margin:0 0 8px}
.blk{display:flex;align-items:center;justify-content:space-between;gap:12px;
border-radius:var(--r-md);padding:13px 14px;margin-bottom:9px;min-height:54px;
background:rgb(255 248 241/.14);border:2px solid var(--c-ink);
font-size:var(--text-lg);font-weight:640;box-shadow:0 3px 0 var(--c-orange-900);
transform:translateY(-3px)}
.blk.nego{border-style:dashed;border-color:rgb(25 24 19/.5);font-size:var(--text-md);
font-weight:540;min-height:46px;box-shadow:0 2px 0 rgb(159 63 30/.55);transform:translateY(-2px)}
.blk.done{background:var(--c-ink);color:var(--c-warm-50);box-shadow:none;transform:translateY(0)}
.blk.done .t{opacity:.6;text-decoration:line-through}
.dot{width:24px;height:24px;border-radius:var(--r-full);flex:none;
box-shadow:inset 0 0 0 2px rgb(25 24 19/.5);position:relative}
.blk.done .dot{background:var(--c-warm-50);box-shadow:none}
.blk.done .dot::after{content:"";position:absolute;left:8.5px;top:5px;width:6px;height:11px;
border:solid var(--c-ink);border-width:0 2.5px 2.5px 0;transform:rotate(43deg)}
.addrow{border:1px dashed rgb(25 24 19/.45);border-radius:var(--r-md);text-align:center;
padding:12px;font-size:var(--text-md);font-weight:600;margin-top:4px}
.hour{display:flex;align-items:center;gap:14px;padding:11px 0;
border-top:1px solid rgb(255 248 241/.09);font-size:var(--text-sm)}
.hour b{width:44px;font-weight:600;opacity:.9}
.hour span{flex:1;opacity:.45}
.hour i{color:var(--c-orange);font-style:normal;font-weight:700}
.frame{display:flex;gap:28px;flex-wrap:wrap;align-items:flex-start}
.obs{margin:0 0 8px;padding-left:17px;font-size:var(--text-sm);line-height:1.6;
color:var(--c-neutral-700)}
@media (prefers-color-scheme:dark){.obs{color:var(--c-neutral-400)}}`,
    body: `<div class="frame">
<div class="phone">
<div class="chrome"><span>Circle OS</span><span style="opacity:.5">Synced</span></div>
<div class="tabs"><span class="on">Today</span><span>Reflect</span></div>
<p class="date">Wednesday</p>
<p class="hello">Good morning, Sai.</p>

<div class="app note">
<div class="ahead"><span>Note</span><span></span></div>
<p style="font-size:var(--text-2xl);font-weight:700;line-height:1.22;margin:0 0 8px;
letter-spacing:-.02em">Small things, kept honestly, become evidence.</p>
<p style="font-size:var(--text-sm);opacity:.55;margin:0">Tap the label to change mode</p>
</div>

<div class="app orange">
<div class="ahead"><span>Habit</span><span class="pill">New habit</span></div>
<div class="hrow"><span class="t">Walk before the first screen</span><span class="tick done"></span></div>
<div class="hrow"><span class="t">Read ten pages</span><span class="tick"></span></div>
<hr class="seam">
<p class="kind">Tasks</p>
<div class="hrow task"><span class="t">Call the venue</span><span class="tick done"></span></div>
<div class="hrow task"><span class="t">Book the room</span><span class="tick"></span></div>
<div class="addrow">+ Add task</div>
</div>

<div class="app orange">
<div class="ahead"><span>Protocol</span><span style="opacity:.85">Day 3 of 7</span></div>
<p style="font-size:var(--text-2xl);font-weight:700;letter-spacing:-.015em;margin:0 0 14px">Monk Mode</p>
<p class="kind">Non-negotiable</p>
<div class="blk done"><span class="t">Journaling 1 line</span><span class="dot"></span></div>
<div class="blk"><span class="t">Working out 5 min</span><span class="dot"></span></div>
<div class="blk"><span class="t">Meditation 5 min</span><span class="dot"></span></div>
<p class="kind" style="margin-top:15px">Negotiable</p>
<div class="blk nego"><span class="t">Read 1 chapter</span><span class="dot"></span></div>
</div>

<div class="app dark">
<div class="ahead"><span>Log</span><span></span></div>
<p style="font-size:var(--text-xl);font-weight:700;margin:0 0 6px">Your day, hour by hour</p>
<div class="hour"><b>07:00</b><span style="opacity:.9">Wake up</span><i>+</i></div>
<div class="hour"><b>08:00</b><span>Add main activity</span><i>+</i></div>
<div class="hour"><b>09:00</b><span style="opacity:.9">Read ten pages</span><i>+</i></div>
<div class="hour"><b>10:00</b><span>Add main activity</span><i>+</i></div>
<div class="hour"><b>11:00</b><span>Add main activity</span><i>+</i></div>
</div>
</div>

<div style="flex:1;min-width:280px">
<p class="eyebrow">What changed</p>
<p class="obs"><b>Habit is one page.</b> Today so far and Your week are gone. Tapping the Habit label switches to Yesterday, the same in-place mode change Thoughts uses for Deep Thoughts.</p>
<p class="obs"><b>Protocol is new.</b> Same orange App Box and the same radius, but blocks instead of lines. Solid means must; dashed means negotiable.</p>
<p class="obs"><b>Habit rows keep a tick beside them</b> because their text is edited in place. Tap the text to edit, tap the tick to complete.</p>
<p class="obs"><b>A protocol block is the button.</b> Terms are locked while a run is going, so there is nothing to edit and the whole block can be pressed.</p>
<p class="obs">Four apps, one shape. Only theme and content change between them, which is what keeps a stack this tall calm.</p>
</div></div>`,
  }),
  { name: "Today, proposed", group: "The app today", subtitle: "Habit combined, Protocol added", w: 1060, h: 1200 },
);

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------
for (const c of cards) {
  const full = join(OUT, c.path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, c.html, "utf8");
}
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
