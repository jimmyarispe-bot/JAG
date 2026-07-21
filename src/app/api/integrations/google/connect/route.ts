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
  const useDemo = body.demo === true || !configured;

  if (useDemo) {
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
      message: configured
        ? "Connected (demo mode)."
        : "Connected in demo mode — set GOOGLE_WORKSPACE_CLIENT_ID/SECRET for live OAuth.",
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
