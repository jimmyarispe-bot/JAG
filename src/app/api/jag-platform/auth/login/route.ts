import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authenticateJagPlatformLogin } from "@/lib/jag-platform/login";
import { GENERIC_JAG_AUTH_FAILURE } from "@/lib/jag-platform/auth";
import {
  encodeJagPlatformSession,
  JAG_PLATFORM_SESSION_COOKIE,
  jagPlatformSessionCookieOptions,
} from "@/lib/jag-platform/session";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; next?: string };
  try {
    body = (await request.json()) as {
      email?: string;
      password?: string;
      next?: string;
    };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const cookiesToApply: {
    name: string;
    value: string;
    options: Parameters<NextResponse["cookies"]["set"]>[2];
  }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookiesToApply.push({ name, value, options });
          });
        },
      },
    }
  );

  const result = await authenticateJagPlatformLogin(
    supabase,
    {
      email: body.email ?? "",
      password: body.password ?? "",
    },
    { nextPath: body.next }
  );

  if (!result.ok) {
    const response = NextResponse.json(
      { ok: false, error: result.error },
      { status: 401 }
    );
    for (const { name, value, options } of cookiesToApply) {
      response.cookies.set(name, value, options);
    }
    return response;
  }

  if ("requiresPasswordReset" in result && result.requiresPasswordReset) {
    const response = NextResponse.json({
      ok: true,
      requiresPasswordReset: true,
      redirectTo: result.redirectTo,
    });
    for (const { name, value, options } of cookiesToApply) {
      response.cookies.set(name, value, options);
    }
    return response;
  }

  if (result.requiresMfa) {
    const response = NextResponse.json({
      ok: true,
      requiresMfa: true,
      redirectTo: result.redirectTo,
    });
    for (const { name, value, options } of cookiesToApply) {
      response.cookies.set(name, value, options);
    }
    return response;
  }

  const token = await encodeJagPlatformSession(result.session);
  if (!token) {
    return NextResponse.json(
      { ok: false, error: GENERIC_JAG_AUTH_FAILURE },
      { status: 503 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    role: result.session.role,
    displayName: result.session.displayName,
  });
  for (const { name, value, options } of cookiesToApply) {
    response.cookies.set(name, value, options);
  }
  response.cookies.set(
    JAG_PLATFORM_SESSION_COOKIE,
    token,
    jagPlatformSessionCookieOptions()
  );
  return response;
}
