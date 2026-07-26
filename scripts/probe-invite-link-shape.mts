/**
 * Show exact invite URL shapes: legacy action_link vs SSR callback link.
 * Usage: npx tsx --env-file=.env.local scripts/probe-invite-link-shape.mts
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = `prod-verify-invite-${Date.now()}@example.com`;

const created = await admin.auth.admin.createUser({
  email,
  email_confirm: false,
  user_metadata: { role: "EXECUTIVE_DIRECTOR" },
});
if (created.error || !created.data.user) {
  throw new Error(created.error?.message ?? "createUser failed");
}
const userId = created.data.user.id;

try {
  // Match production (e79a0f6): redirectTo=/login, email action_link
  const legacy = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: `${appUrl}/login` },
  });
  if (legacy.error || !legacy.data.properties) {
    throw new Error(legacy.error?.message ?? "legacy generateLink failed");
  }

  // Match committed 905e709: redirectTo=/auth/callback, email hashed_token URL
  const modern = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: `${appUrl}/auth/callback` },
  });
  if (modern.error || !modern.data.properties?.hashed_token) {
    throw new Error(modern.error?.message ?? "modern generateLink failed");
  }

  const action = legacy.data.properties.action_link;
  const actionUrl = new URL(action);
  const custom = `${appUrl}/auth/callback?token_hash=${encodeURIComponent(
    modern.data.properties.hashed_token
  )}&type=invite`;

  console.log(JSON.stringify({
    APP_URL: appUrl,
    productionDeployId: "dpl_6R4GXUmWLpsEPqn6trrJQfAKSEC3",
    productionCreatedEdt: "2026-07-25 21:43:21",
    productionRouteProbe: {
      "GET /login": 200,
      "GET /login/reset-required": 200,
      "GET /login/activate": 404,
      "GET /auth/callback": 404,
      loginHtmlContainsFoundersEdition: true,
    },
    legacyEmailUrl_asOnProduction: action,
    legacyRedirectTo: actionUrl.searchParams.get("redirect_to"),
    legacyType: actionUrl.searchParams.get("type"),
    legacyHost: actionUrl.host,
    modernEmailUrl_asInCommit905e709: custom,
    note: "Production build predates 905e709; emails still use action_link.",
  }, null, 2));
} finally {
  await admin.auth.admin.deleteUser(userId);
}
