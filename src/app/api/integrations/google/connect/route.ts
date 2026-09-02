import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { guardApiRoute } from "@/lib/platform/identity/api-guard";
import { getPrimaryOrganizationId } from "@/lib/configuration/context";
import {
  buildGoogleConnectAuthorizeUrl,
  connectGoogleWorkspaceDemo,
  getGoogleWorkspaceStatus,
  googleWorkspaceClientConfig,
} from "@/lib/platform/integrations/connections";

async function guardIntegrations(supabase: Awaited<ReturnType<typeof createAuthClient>>) {
  let gate = await guardApiRoute(supabase, "integration.manage");
  if (gate instanceof NextResponse) {
    gate = await guardApiRoute(supabase, "integration.admin");
  }
  if (gate instanceof NextResponse) {
    gate = await guardApiRoute(supabase, "configuration.manage");
  }
  if (gate instanceof NextResponse) {
    gate = await guardApiRoute(supabase, "configuration.admin");
  }
  return gate;
}

/**
 * POST /api/integrations/google/connect
 * Starts Google OAuth (returns authorizeUrl) or completes a demo connect when
 * Google client credentials are not configured / body.demo === true.
 */
export async function POST(request: NextRequest) {
  const supabase = await createAuthClient();
  const gate = await guardIntegrations(supabase);
  if (gate instanceof NextResponse) return gate;

  const organizationId = await getPrimaryOrganizationId(supabase);
  if (!organizationId) {
    return NextResponse.json(
      { ok: false, message: "Organization not found." },
      { status: 400 }
    );
  }

  let body: { demo?: boolean } = {};
  try {
    body = (await request.json()) as { demo?: boolean };
  } catch {
    body = {};
  }

  const { configured } = googleWorkspaceClientConfig();

  // Missing credentials used to fall through to the demo connect, which wrote
  // status='connected' with a placeholder token and returned ok:true. The
  // settings page then showed a healthy connection that could never sync.
  // Refuse instead, and say what is missing.
  if (!configured && body.demo !== true) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Google Workspace is not configured. Set GOOGLE_WORKSPACE_CLIENT_ID and GOOGLE_WORKSPACE_CLIENT_SECRET in the environment and redeploy. Connecting without them would record a connection that cannot read anything from Google.",
      },
      { status: 400 }
    );
  }

  // Demo remains reachable, but only when a caller asks for it by name.
  if (body.demo === true) {
    const result = await connectGoogleWorkspaceDemo(supabase, {
      organizationId,
      userId: gate.userId,
    });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.error },
        { status: 400 }
      );
    }
    const status = await getGoogleWorkspaceStatus(supabase, organizationId);
    return NextResponse.json({
      ok: true,
      demo: true,
      message:
        "Connected in DEMO MODE. No data will be read from Google — every record this syncs is a fixture.",
      status,
    });
  }

  const auth = buildGoogleConnectAuthorizeUrl({
    organizationId,
    userId: gate.userId,
  });
  if ("error" in auth) {
    return NextResponse.json({ ok: false, message: auth.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    authorizeUrl: auth.authorizeUrl,
    message: "Redirect to Google to authorize.",
  });
}
