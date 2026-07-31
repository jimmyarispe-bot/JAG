import { NextResponse } from "next/server";
import { authenticateJagPlatform } from "@/lib/jag-platform/auth";
import {
  encodeJagPlatformSession,
  JAG_PLATFORM_SESSION_COOKIE,
  jagPlatformSessionCookieOptions,
} from "@/lib/jag-platform/session";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const result = authenticateJagPlatform({
    email: body.email ?? "",
    password: body.password ?? "",
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    role: result.session.role,
    displayName: result.session.displayName,
  });
  response.cookies.set(
    JAG_PLATFORM_SESSION_COOKIE,
    encodeJagPlatformSession(result.session),
    jagPlatformSessionCookieOptions()
  );
  return response;
}
