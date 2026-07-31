import { NextResponse } from "next/server";
import { JAG_PLATFORM_SESSION_COOKIE } from "@/lib/jag-platform/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(JAG_PLATFORM_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
