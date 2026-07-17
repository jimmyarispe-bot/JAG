import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  isPasswordResetExemptPath,
  isPublicApiPath,
  PASSWORD_RESET_PATH,
  passwordResetRequiredResponse,
  userMustResetPassword,
} from "@/lib/auth/must-reset-password";
import { loadAuthzSnapshot } from "@/lib/platform/identity/load-authz-snapshot";
import {
  authorizeRoute,
  requiredPermissionsForRoute,
} from "@/lib/platform/identity/route-authorization";

function isProtectedPage(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/exec") ||
    pathname.startsWith("/cloud") ||
    pathname.startsWith("/operations") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/portal") ||
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

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const search = req.nextUrl.search;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  if (search) requestHeaders.set("x-url", `${pathname}${search}`);

  let res = NextResponse.next({
    request: { headers: requestHeaders },
  });

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedPage = isProtectedPage(pathname);
  const protectedApi = isProtectedApi(pathname);

  if ((protectedPage || protectedApi) && !user) {
    if (protectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && userMustResetPassword(user) && !isPasswordResetExemptPath(pathname)) {
    if (protectedApi || protectedPage) {
      if (protectedApi) {
        return passwordResetRequiredResponse();
      }
      const resetUrl = new URL(PASSWORD_RESET_PATH, req.url);
      resetUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(resetUrl);
    }
  }

  // Centralized catalog authorization for application / module routes
  const required = requiredPermissionsForRoute(pathname, search);
  if (user && required.length > 0) {
    const snapshot = await loadAuthzSnapshot(supabase, user.id);
    const decision = authorizeRoute(snapshot, pathname, search);
    if (!decision.ok) {
      if (protectedApi) {
        return NextResponse.json(
          { error: "Forbidden", missing: decision.missing },
          { status: 403 }
        );
      }
      const redirectUrl = new URL(decision.redirectTo, req.url);
      if (decision.missing === "ACADEMYOS_ACCESS") {
        redirectUrl.searchParams.set("error", "forbidden");
      }
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/exec",
    "/exec/:path*",
    "/cloud",
    "/cloud/:path*",
    "/operations",
    "/operations/:path*",
    "/admin",
    "/admin/:path*",
    "/portal",
    "/portal/:path*",
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
