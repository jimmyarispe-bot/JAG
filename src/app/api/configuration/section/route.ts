import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { guardApiRoute } from "@/lib/platform/identity/api-guard";
import { getPrimaryOrganizationId } from "@/lib/configuration/context";
import { getConfigSection, saveConfigSection } from "@/lib/configuration/sections";
import { mergeConfigFieldsFromFormData } from "@/lib/configuration/form-fields";
import { canManageConfiguration } from "@/lib/configuration/access";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { requireOrganizationAccess } from "@/lib/platform/identity/tenant-access";
import { logSecurityEvent } from "@/lib/platform/identity/security";
import type { ConfigSectionKey } from "@/lib/configuration/types";

export async function POST(request: NextRequest) {
  const supabase = await createAuthClient();
  let gate = await guardApiRoute(supabase, "configuration.manage");
  if (gate instanceof NextResponse) {
    gate = await guardApiRoute(supabase, "configuration.admin");
    if (gate instanceof NextResponse) {
      gate = await guardApiRoute(supabase, "SYSTEM_ADMIN_ACCESS");
      if (gate instanceof NextResponse) return gate;
    }
  }

  const ctx = await getIdentityContext();
  if (!ctx || !canManageConfiguration(ctx)) {
    return NextResponse.json(
      { ok: false, message: "You do not have permission to save configuration." },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const orgId =
    formData.get("organization_id")?.toString() || (await getPrimaryOrganizationId(supabase));
  const sectionKey = formData.get("section_key")?.toString() as ConfigSectionKey | undefined;

  if (!orgId) {
    return NextResponse.json({ ok: false, message: "Organization not found." }, { status: 400 });
  }
  if (!sectionKey) {
    return NextResponse.json({ ok: false, message: "Missing configuration section." }, { status: 400 });
  }

  const orgScope = await requireOrganizationAccess(supabase, ctx.effectiveUserId, orgId);
  if (orgScope !== true) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const existing = await getConfigSection(supabase, orgId, sectionKey);
  const { configData, fieldKeys } = mergeConfigFieldsFromFormData(formData, existing);

  const result = await saveConfigSection(supabase, {
    organizationId: orgId,
    sectionKey,
    configData,
    userId: ctx.effectiveUserId,
  });

  if ("error" in result && result.error) {
    return NextResponse.json({ ok: false, message: result.error }, { status: 400 });
  }

  await logSecurityEvent(supabase, {
    eventType: "school_config_change",
    summary: `Configuration fields saved: ${sectionKey}`,
    actorUserId: ctx.effectiveUserId,
    userId: ctx.effectiveUserId,
    metadata: { organizationId: orgId, sectionKey, fields: fieldKeys },
  });

  revalidatePath("/dashboard/admin", "layout");

  return NextResponse.json({ ok: true, message: "Configuration saved." });
}
