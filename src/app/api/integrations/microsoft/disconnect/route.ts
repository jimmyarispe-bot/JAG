import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { guardApiRoute } from "@/lib/platform/identity/api-guard";
import { getPrimaryOrganizationId } from "@/lib/configuration/context";
import {
  disconnectMicrosoft365,
  getMicrosoft365Status,
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

/** POST /api/integrations/microsoft/disconnect */
export async function POST() {
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

  const result = await disconnectMicrosoft365(supabase, organizationId);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.error }, { status: 400 });
  }

  const status = await getMicrosoft365Status(supabase, organizationId);
  return NextResponse.json({
    ok: true,
    message: "Microsoft 365 disconnected.",
    status,
  });
}
