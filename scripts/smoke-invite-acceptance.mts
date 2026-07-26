/**
 * End-to-end smoke: invite token → verifyOtp session → password setup → flag clear.
 * Uses service role + anon key against the configured Supabase project.
 *
 * Usage: npx tsx --env-file=.env.local scripts/smoke-invite-acceptance.mts
 */
import { createClient } from "@supabase/supabase-js";
import {
  authCallbackRedirectTo,
  buildEmailAuthCallbackLink,
  exchangeAuthCallbackParams,
  resolveAuthCallbackRedirect,
} from "../src/lib/auth/auth-callback.ts";
import { PASSWORD_RESET_PATH } from "../src/lib/auth/must-reset-password.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);

if (!url || !anon || !service) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, or SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const browserish = createClient(url, anon, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = `invite-smoke-${Date.now()}@example.com`;
const password = `Smoke-Invite-${Date.now()}!aA1`;

let userId: string | undefined;

try {
  console.log("1) create invited user with must_reset_password");
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: false,
    user_metadata: { must_reset_password: true, full_name: "Invite Smoke" },
  });
  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "createUser failed");
  }
  userId = created.data.user.id;

  console.log("2) generateLink(invite) redirectTo=/auth/callback");
  const link = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: authCallbackRedirectTo(appUrl) },
  });
  if (link.error || !link.data.properties?.hashed_token) {
    throw new Error(link.error?.message ?? "generateLink missing hashed_token");
  }

  const emailLink = buildEmailAuthCallbackLink({
    appUrl,
    tokenHash: link.data.properties.hashed_token,
    type: "invite",
  });
  const parsed = new URL(emailLink);
  if (parsed.pathname !== "/auth/callback") {
    throw new Error(`Unexpected email link path: ${parsed.pathname}`);
  }

  console.log("3) exchange token_hash via verifyOtp (SSR callback exchange)");
  const exchanged = await exchangeAuthCallbackParams(browserish, {
    code: null,
    tokenHash: parsed.searchParams.get("token_hash"),
    type: parsed.searchParams.get("type"),
  });
  if (!exchanged.ok) throw new Error(exchanged.error);

  const redirect = resolveAuthCallbackRedirect({
    type: "invite",
    next: "/dashboard",
    user: exchanged.user,
  });
  if (!redirect.startsWith(PASSWORD_RESET_PATH)) {
    throw new Error(`Expected password setup redirect, got ${redirect}`);
  }
  if (exchanged.user.user_metadata?.must_reset_password !== true) {
    throw new Error("must_reset_password flag missing after invite accept");
  }

  console.log("4) set password and clear must_reset_password");
  const updated = await browserish.auth.updateUser({
    password,
    data: { must_reset_password: false },
  });
  if (updated.error) throw new Error(updated.error.message);

  const { data: after } = await browserish.auth.getUser();
  if (after.user?.user_metadata?.must_reset_password === true) {
    throw new Error("must_reset_password still true after password setup");
  }

  console.log("5) password sign-in works");
  await browserish.auth.signOut();
  const signedIn = await browserish.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.user) {
    throw new Error(signedIn.error?.message ?? "signInWithPassword failed");
  }

  console.log("OK invite acceptance smoke passed for", email);
  process.exitCode = 0;
} catch (error) {
  console.error("FAIL", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (userId) {
    await admin.auth.admin.deleteUser(userId);
  }
}
