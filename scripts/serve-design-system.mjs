// Preview the generated Claude Design bundle locally.
//
//   node scripts/build-design-system.mjs && node scripts/serve-design-system.mjs
//
// Serves design-system/ on http://localhost:4321 with an index of every card,
// so the bundle can be checked before it is pushed to claude.ai/design.

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "design-system");
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

createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
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
