import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminAccessToken,
  adminCodeMatches,
  configuredAdminCode,
} from "../admin-access";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  let code = "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    code = typeof body?.code === "string" ? body.code : "";
  } else {
    const form = await request.formData();
    const value = form.get("code");
    code = typeof value === "string" ? value : "";
  }

  if (!configuredAdminCode()) {
    return NextResponse.json(
      { unlocked: false, reason: "not_configured" },
      { status: 503 },
    );
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
