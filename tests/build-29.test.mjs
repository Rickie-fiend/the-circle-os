import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync(
  new URL("../app/os/circle-os-shell.tsx", import.meta.url),
  "utf8",
);
const pages = readFileSync(
  new URL("../app/os/dreamline-pages.tsx", import.meta.url),
  "utf8",
);
const mirror = readFileSync(
  new URL("../app/os/mirror/page.tsx", import.meta.url),
  "utf8",
);

test("Log keeps one outer SwipeSession and gives Dreamline its own saved journey", () => {
  const log = shell.slice(
    shell.indexOf('<section className="os-log-section"'),
    shell.indexOf("</main>"),
  );
  assert.match(log, /label="Log apps"/);
  assert.match(log, /index=\{logAppIndex\}/);
  assert.match(log, /onIndexChange=\{saveLogAppIndex\}/);
  assert.match(
    shell,
    /setAppSessionIndex\(\s*current,\s*"today-log",\s*logAppVersion,\s*index,?\s*\)/,
  );
  assert.doesNotMatch(log, /rotateMs=/);
  assert.doesNotMatch(pages, /SwipeSession/);
});

test("Dreamline front starts with Setup, then Having, Being, Doing and Income", () => {
  assert.match(shell, /logAppMaxIndex = activeDreamline[\s\S]*?\? 5/);
  const setupAt = shell.indexOf("<DreamlineSetupPage");
  const categoriesAt = shell.indexOf('["having", "being", "doing"]');
  const incomeAt = shell.indexOf("<DreamlineIncomePage");
  assert.ok(setupAt > 0 && categoriesAt > setupAt && incomeAt > categoriesAt);
  assert.match(pages, /headerRight=\{<span className="os-card-label">Setup<\/span>\}/);
  assert.match(pages, /category === "being" \? "Being" : category === "having" \? "Having" : "Doing"/);
  assert.match(pages, /headerRight=\{<span className="os-card-label">Income<\/span>\}/);
});

test("the shared App back contains Now, Tomorrow and Day After only", () => {
  assert.match(shell, /useAppBack<"dream" \| "steps">\("dream"\)/);
  assert.match(shell, /logAppMaxIndex = activeDreamline[\s\S]*?: 3/);
  assert.match(shell, /\["now", "Now"\][\s\S]*?\["tomorrow", "Tomorrow"\][\s\S]*?\["dayAfter", "Day After"\]/);
  assert.match(pages, /Only those take steps/);
});

test("Being names its required Doing and stars are the gate to steps", () => {
  assert.match(pages, /A Being needs the Doing that would make it real\./);
  assert.match(pages, /Becomes Doing/);
  assert.match(pages, /aria-pressed=\{item\.starred\}/);
  assert.match(pages, /items\.length[\s\S]*?DreamlineStepField/);
});

test("legacy declaration Dreamlines remain implemented but leave the Vision deck", () => {
  const declarationPages = mirror.match(/const DECLARATION_PAGES:[\s\S]*?\n\];/)?.[0] || "";
  assert.doesNotMatch(declarationPages, /kind: "dreamline"/);
  assert.match(mirror, /dreamline: "declare-dreamline"/);
});
