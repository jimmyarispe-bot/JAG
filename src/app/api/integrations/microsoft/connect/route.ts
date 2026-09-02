import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { guardApiRoute } from "@/lib/platform/identity/api-guard";
import { getPrimaryOrganizationId } from "@/lib/configuration/context";
import {
  buildMicrosoftConnectAuthorizeUrl,
  connectMicrosoft365Demo,
  getMicrosoft365Status,
  microsoft365ClientConfig,
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
 * POST /api/integrations/microsoft/connect
 * Starts Microsoft Entra OAuth or completes a demo connect when credentials
 * are not configured / body.demo === true.
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

  const { configured } = microsoft365ClientConfig();

  // Same silent fallback the Google route had: no credentials meant a recorded
  // "connected" state backed by a placeholder token. Refuse and say why.
  if (!configured && body.demo !== true) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Microsoft 365 is not configured. Set MICROSOFT_365_CLIENT_ID and MICROSOFT_365_CLIENT_SECRET in the environment and redeploy. Connecting without them would record a connection that cannot read anything from Microsoft.",
      },
      { status: 400 }
    );
  }

  if (body.demo === true) {
    const result = await connectMicrosoft365Demo(supabase, {
      organizationId,
      userId: gate.userId,
    });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.error },
        { status: 400 }
      );
    }
    const status = await getMicrosoft365Status(supabase, organizationId);
    return NextResponse.json({
      ok: true,
      demo: true,
      message:
        "Connected in DEMO MODE. No data will be read from Microsoft — every record this syncs is a fixture.",
      status,
    });
  }

  const auth = buildMicrosoftConnectAuthorizeUrl({
    organizationId,
    userId: gate.userId,
  });
  if ("error" in auth) {
    return NextResponse.json({ ok: false, message: auth.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    authorizeUrl: auth.authorizeUrl,
    message: "Redirect to Microsoft to authorize.",
  });
}
