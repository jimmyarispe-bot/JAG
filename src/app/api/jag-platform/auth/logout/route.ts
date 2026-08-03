import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { clearJagPlatformSessionCookies } from "@/lib/jag-platform/session";

/**
 * Clears the signed JAG session and the Supabase auth session for this browser.
 * AcademyOS routes remain separately gated; this avoids silent JAG re-entry
 * via a lingering Supabase cookie + establish flow.
 */
export async function POST(request: NextRequest) {
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

  try {
    await supabase.auth.signOut();
  } catch {
    // Still clear JAG cookies even if Supabase sign-out fails.
  }

  const response = NextResponse.json({ ok: true });
  for (const { name, value, options } of cookiesToApply) {
    response.cookies.set(name, value, options);
  }
  clearJagPlatformSessionCookies((name, value, options) => {
    response.cookies.set(name, value, options);
  });
  return response;
}
