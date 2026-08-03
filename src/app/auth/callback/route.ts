import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  exchangeAuthCallbackParams,
  isJagAuthCallbackContext,
  isMagicLinkAuthType,
  resolveAuthCallbackRedirect,
} from "@/lib/auth/auth-callback";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";

/**
 * Supabase SSR auth callback — invite, recovery, magiclink, and PKCE code exchange.
 * Establishes cookie session, then routes by type + explicit `next` context.
 * JAG magic-link failures never dump users onto AcademyOS `/login`.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next");

  const jagMagicLinkFailure =
    isMagicLinkAuthType(type) && isJagAuthCallbackContext(next);

  const loginErrorUrl = new URL(
    jagMagicLinkFailure ? JAG_PLATFORM_LOGIN_PATH : "/login",
    requestUrl.origin
  );
  loginErrorUrl.searchParams.set("error", "auth_callback_failed");

  if (!code && !(tokenHash && type)) {
    return NextResponse.redirect(loginErrorUrl);
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
            request.cookies.set(name, value);
            cookiesToApply.push({ name, value, options });
          });
        },
      },
    }
  );

  const exchanged = await exchangeAuthCallbackParams(supabase, {
    code,
    tokenHash,
    type,
  });

  if (!exchanged.ok) {
    return NextResponse.redirect(loginErrorUrl);
  }

  const redirectPath = resolveAuthCallbackRedirect({
    type,
    next,
    user: exchanged.user,
  });
  const response = NextResponse.redirect(new URL(redirectPath, requestUrl.origin));

  for (const { name, value, options } of cookiesToApply) {
    response.cookies.set(name, value, options);
  }

  return response;
}
