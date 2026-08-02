import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminAccessToken, adminCodeMatches } from "../admin-access";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  let code = "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    code = String(body?.code || "").trim();
  } else {
    const form = await request.formData();
    code = String(form.get("code") || "").trim();
  }

  if (!adminCodeMatches(code)) {
    return NextResponse.json({ unlocked: false }, { status: 401 });
  }

  const response = NextResponse.json({ unlocked: true });
  response.cookies.set(ADMIN_COOKIE, adminAccessToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/os",
  });
  return response;
}
