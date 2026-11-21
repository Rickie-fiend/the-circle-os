import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ asset: string }> }) {
  if (process.env.CIRCLE_IMPRINT_HOSTED_REVIEW !== "enabled" && process.env.NODE_ENV !== "development") {
    return new Response(null, { status: 404 });
  }
  const { asset } = await params;
  const assetName = asset === "bone" ? "bone.png" : asset === "coordinates" ? "coordinates.bin" : null;
  if (!assetName) return new Response(null, { status: 404 });
  try {
    const file = await readFile(join(process.cwd(), "docs", "design", `personal-imprint-color-v1-sori-${assetName}`));
    return new Response(new Uint8Array(file), {
      headers: { "Content-Type": asset === "bone" ? "image/png" : "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
