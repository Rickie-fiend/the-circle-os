import { readFile } from "node:fs/promises";
import { join } from "node:path";
import variants from "../../imprint-art-variants.json";

export const runtime = "nodejs";

const assets = new Map([
  ["bone", { file: "personal-imprint-color-v1-sori-bone.png", type: "image/png" }],
  ["coordinates", { file: "personal-imprint-color-v1-sori-coordinates.bin", type: "application/octet-stream" }],
]);
for (const { bone, coordinates } of variants) {
  for (const asset of [bone, coordinates]) assets.set(asset.path.split("/").at(-1)!, asset);
}

export async function GET(_request: Request, { params }: { params: Promise<{ asset: string }> }) {
  if (process.env.CIRCLE_IMPRINT_HOSTED_REVIEW !== "enabled" && process.env.NODE_ENV !== "development") {
    return new Response(null, { status: 404 });
  }
  const { asset } = await params;
  const artwork = assets.get(asset);
  if (!artwork) return new Response(null, { status: 404 });
  try {
    const file = await readFile(join(process.cwd(), "docs", "design", artwork.file));
    return new Response(new Uint8Array(file), {
      headers: { "Content-Type": artwork.type, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
