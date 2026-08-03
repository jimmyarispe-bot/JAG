import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  isPasswordResetExemptPath,
  isPublicApiPath,
  passwordResetRequiredResponse,
  passwordSetupPathForUser,
  userMustResetPassword,
} from "@/lib/auth/must-reset-password";
import { getUserFromAuthClient } from "@/lib/platform/authentication";
import {
  applyTraceHeaders,
  resolveRequestTraceIds,
} from "@/lib/observability/request-ids";
import { ServerTimingCollector } from "@/lib/performance/server-timing";
import {
  decodeJagPlatformSession,
  JAG_PLATFORM_SESSION_COOKIE,
} from "@/lib/jag-platform/session";

function isJagPortalPath(pathname: string): boolean {
  return pathname === "/jag" || pathname.startsWith("/jag/");
}

function isJagPublicPath(pathname: string): boolean {
  return (
    pathname === "/jag/login" ||
    pathname.startsWith("/jag/login/") ||
    pathname.startsWith("/jag/briefings/share/") ||
    pathname === "/api/jag-platform/auth/login" ||
    pathname === "/api/jag-platform/auth/logout" ||
    pathname === "/api/jag-platform/auth/establish" ||
    pathname === "/api/jag-business/provision"
  );
}

function isProtectedPage(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/exec") ||
    pathname.startsWith("/founder") ||
    pathname.startsWith("/decisions") ||
    pathname.startsWith("/cloud") ||
    pathname.startsWith("/operations") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/workspace") ||
    pathname.startsWith("/organizations") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/platform") ||
    pathname.startsWith("/apply/portal")
  );
}

function isProtectedApi(pathname: string): boolean {
  return pathname.startsWith("/api/") && !isPublicApiPath(pathname);
}

/**
 * Sprint P002 — middleware authenticates only (session present).
 * Catalog authorization runs once in RSC layouts via requireAuthorizedRoute /
 * getIdentityContext (request-scoped). Avoids duplicate role/permission I/O.
 */
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const timing = new ServerTimingCollector();
  const middlewareStarted =
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  if (req.nextUrl.search) requestHeaders.set("x-url", `${pathname}${req.nextUrl.search}`);

  // RC-1 — propagate request/trace ids (edge-safe; no Node ALS).
  const traceIds = resolveRequestTraceIds(requestHeaders);
  applyTraceHeaders(requestHeaders, traceIds);

  let res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  applyTraceHeaders(res.headers, traceIds);

  const finish = (response: NextResponse) => {
    const end =
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
    timing.add("mw_total", end - middlewareStarted, "Middleware total");
    timing.apply(response.headers);
    applyTraceHeaders(response.headers, traceIds);
    return response;
  };

  // JAG Platform Portal + public business APIs — separate from AcademyOS session.
  if (
    isJagPortalPath(pathname) ||
    pathname.startsWith("/api/jag-platform/") ||
    pathname.startsWith("/api/jag-business/")
  ) {
    if (!isJagPublicPath(pathname) && isJagPortalPath(pathname)) {
      const session = await decodeJagPlatformSession(
        req.cookies.get(JAG_PLATFORM_SESSION_COOKIE)?.value
      );
      if (!session) {
        const loginUrl = new URL("/jag/login", req.url);
        loginUrl.searchParams.set("next", pathname);
        return finish(NextResponse.redirect(loginUrl));
      }
      requestHeaders.set("x-jag-platform-authenticated", "1");
      requestHeaders.set("x-jag-platform-role", session.role);
      requestHeaders.set("x-jag-platform-user-id", session.userId);
      res = NextResponse.next({ request: { headers: requestHeaders } });
      applyTraceHeaders(res.headers, traceIds);
    }
    return finish(res);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });
          res = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const authUser = await timing.measure(
    "mw_auth_getUser",
    () => getUserFromAuthClient(supabase),
    "Auth session"
  );
  const user = authUser
    ? {
        id: authUser.id,
        user_metadata: authUser.userMetadata,
      }
    : null;

  const protectedPage = isProtectedPage(pathname);
  const protectedApi = isProtectedApi(pathname);

  if ((protectedPage || protectedApi) && !user) {
    if (protectedApi) {
      return finish(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return finish(NextResponse.redirect(loginUrl));
  }

  if (user && userMustResetPassword(user) && !isPasswordResetExemptPath(pathname)) {
    if (protectedApi || protectedPage) {
      if (protectedApi) {
        return finish(passwordResetRequiredResponse());
      }
      const setupUrl = new URL(passwordSetupPathForUser(user), req.url);
      setupUrl.searchParams.set("next", pathname);
      return finish(NextResponse.redirect(setupUrl));
    }
  }

  if (user) {
    requestHeaders.set("x-jag-authenticated", "1");
    requestHeaders.set("x-jag-user-id", user.id);
    const cookies = res.cookies.getAll();
    res = NextResponse.next({ request: { headers: requestHeaders } });
    for (const cookie of cookies) {
      res.cookies.set(cookie.name, cookie.value);
    }
  }

  return finish(res);
}

export const config = {
  matcher: [
    "/jag",
    "/jag/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/exec",
    "/exec/:path*",
    "/founder",
    "/founder/:path*",
    "/decisions",
    "/decisions/:path*",
    "/cloud",
    "/cloud/:path*",
    "/operations",
    "/operations/:path*",
    "/admin",
    "/admin/:path*",
    "/portal",
    "/portal/:path*",
    "/workspace",
    "/organizations",
    "/organizations/:path*",
    "/users",
    "/users/:path*",
    "/settings",
    "/settings/:path*",
    "/platform",
    "/platform/:path*",
    "/apply/portal",
    "/apply/portal/:path*",
    "/api/:path*",
  ],
};
