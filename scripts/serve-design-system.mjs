// Preview the generated Claude Design bundle locally.
//
//   node scripts/build-design-system.mjs && node scripts/serve-design-system.mjs
//
// Serves design-system/ on http://localhost:4321 with an index of every card,
// so the bundle can be checked before it is pushed to claude.ai/design.

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "design-system");
const CAPTURES = join(HERE, "..", "design-system", "_captured");
const PORT = 4321;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

const index = () => {
  const cards = JSON.parse(readFileSync(join(ROOT, "_manifest.json"), "utf8"));
  const groups = [...new Set(cards.map((c) => c.group))];
  return `<!doctype html><meta charset="utf-8"><title>Circle design system</title>
<style>body{font-family:system-ui,sans-serif;background:#191813;color:#f1efe8;
margin:0;padding:40px;line-height:1.5}h1{font-weight:400;font-size:28px;margin:0 0 4px}
p.l{color:#918c81;margin:0 0 32px;font-size:14px}h2{font-size:11px;
letter-spacing:.16em;text-transform:uppercase;color:#e36b37;margin:32px 0 10px}
a{display:block;padding:12px 14px;background:#24231d;border-radius:12px;
margin-bottom:7px;color:#f1efe8;text-decoration:none;max-width:620px}
a:hover{background:#302f28}b{display:block;font-size:15px}
span{color:#918c81;font-size:12px}</style>
<h1>Circle design system</h1>
<p class="l">${cards.length} cards, generated from app/tokens.css</p>
${groups
  .map(
    (g) => `<h2>${g}</h2>` +
      cards.filter((c) => c.group === g)
        .map((c) => `<a href="/${c.path}"><b>${c.name}</b><span>${c.subtitle}</span></a>`)
        .join(""),
  )
  .join("")}`;
};

// Capture endpoint. The running app posts its rendered markup here so the
// screen cards show what the app actually is, rather than a redrawing of it.
// Kept out of the app itself: this is a local authoring tool, not a feature.
const capture = (req, res, name) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    mkdirSync(CAPTURES, { recursive: true });
    writeFileSync(join(CAPTURES, `${name}.html`), body, "utf8");
    console.log(`captured ${name} (${Math.round(body.length / 1024)}KB)`);
    res.writeHead(200, {
      "content-type": "text/plain",
      "access-control-allow-origin": "*",
    });
    res.end(`saved ${body.length}`);
  });
};

createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    return res.end();
  }
  if (req.method === "POST" && url.startsWith("/_capture/")) {
    const name = url.slice("/_capture/".length).replace(/[^a-z0-9-]/gi, "");
    if (!name) {
      res.writeHead(400, { "access-control-allow-origin": "*" });
      return res.end("bad name");
    }
    return capture(req, res, name);
  }

  if (url === "/" || url === "/index.html") {
    res.writeHead(200, { "content-type": TYPES[".html"] });
    return res.end(index());
  }
  const file = join(ROOT, url);
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { "content-type": "text/plain" });
    return res.end("not found");
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(PORT, () => {
  console.log(`design system: http://localhost:${PORT}`);
});
