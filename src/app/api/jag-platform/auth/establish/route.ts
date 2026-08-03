import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  completeJagAuthorization,
  JAG_SESSION_ESTABLISH_PATH,
} from "@/lib/jag-platform/login";
import {
  JAG_PLATFORM_HOME_PATH,
  JAG_PLATFORM_LOGIN_PATH,
} from "@/lib/jag-platform/auth";
import {
  encodeJagPlatformSession,
  JAG_PLATFORM_SESSION_COOKIE,
  jagPlatformSessionCookieOptions,
} from "@/lib/jag-platform/session";

/**
 * Issues the signed JAG session after Supabase identity + MFA are satisfied.
 * Used as the MFA `next` target — never trusts browser-supplied role claims.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextParam = requestUrl.searchParams.get("next");
  const nextPath =
    nextParam && nextParam.startsWith("/jag") && !nextParam.startsWith("//")
      ? nextParam
      : JAG_PLATFORM_HOME_PATH;

  // Prevent open redirect loops through establish itself.
  const safeNext =
    nextPath.startsWith(JAG_SESSION_ESTABLISH_PATH) ||
    nextPath.startsWith("/api/")
      ? JAG_PLATFORM_HOME_PATH
      : nextPath;

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const failRedirect = () => {
    const response = NextResponse.redirect(
      new URL(JAG_PLATFORM_LOGIN_PATH, requestUrl.origin)
    );
    for (const { name, value, options } of cookiesToApply) {
      response.cookies.set(name, value, options);
    }
    return response;
  };

  if (!user) {
    return failRedirect();
  }

  const result = await completeJagAuthorization(supabase, user, {
    nextPath: safeNext,
  });

  if (!result.ok) {
    // Entitlement failure: clear Supabase session — magic-link/password
    // identity alone must not leave an AcademyOS-usable cookie.
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore — still deny JAG
    }
    return failRedirect();
  }

  if (result.requiresMfa) {
    const response = NextResponse.redirect(
      new URL(result.redirectTo, requestUrl.origin)
    );
    for (const { name, value, options } of cookiesToApply) {
      response.cookies.set(name, value, options);
    }
    return response;
  }

  const token = await encodeJagPlatformSession(result.session);
  if (!token) {
    return failRedirect();
  }

  const response = NextResponse.redirect(
    new URL(safeNext, requestUrl.origin)
  );
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
