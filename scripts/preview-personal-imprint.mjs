import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { pathToFileURL } from "node:url";

export async function startImprintPreview(port = 3024) {
  const entry = 'import React from "react";import {createRoot} from "react-dom/client";import Preview from "/app/os/home/imprint-preview.tsx";createRoot(document.getElementById("root")).render(React.createElement(Preview));';
  const server = await createServer({ configFile: false, plugins: [react(), {
    name: "imprint-review-entry",
    resolveId(id) { if (id === "/imprint-entry.jsx") return id; },
    load(id) { if (id === "/imprint-entry.jsx") return entry; },
    configureServer(server) { server.middlewares.use((request, response, next) => {
      if (request.url?.split("?")[0] !== "/") return next();
      void server.transformIndexHtml("/", '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0}</style></head><body><div id="root"></div><script type="module" src="/imprint-entry.jsx"></script></body></html>').then(html => { response.setHeader("Content-Type", "text/html"); response.end(html); }).catch(next);
    }); },
  }], server: { host: "127.0.0.1", port, strictPort: true, watch: { ignored: ["**/.next/**", "**/outputs/**"] } } });
  await server.listen();
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await startImprintPreview();
  console.log("Synthetic artwork preview: http://127.0.0.1:3024");
}
