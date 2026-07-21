import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  requireOrganizationAccess,
  requireSchoolAccess,
} from "@/lib/platform/identity/tenant-access";
import { canImportData } from "@/lib/enterprise-data/access";
import { getPrimaryOrganizationId } from "@/lib/enterprise-data/context";
import { createImportBatch, parseAndStageImport, commitImportBatch } from "@/lib/enterprise-data/import-engine";
import { getDefaultMappings } from "@/lib/enterprise-data/mapping-engine";
import { validateImportBatch } from "@/lib/enterprise-data/validation-engine";
import { COMMITTABLE_IMPORT_TYPES, type EdpImportType, type EdpSourceFormat } from "@/lib/enterprise-data/types";

export async function POST(request: Request) {
  const ctx = await getIdentityContext();
  if (!ctx || !canImportData(ctx)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const supabase = await createAuthClient();
  const orgId = (typeof body.organizationId === "string" && body.organizationId) ||
    (await getPrimaryOrganizationId(supabase));
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  // RC-3 — enforce org membership; school membership when schoolId supplied.
  const orgScope = await requireOrganizationAccess(supabase, ctx.effectiveUserId, orgId);
  if (orgScope !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const schoolId = typeof body.schoolId === "string" ? body.schoolId : undefined;
  if (schoolId) {
    const schoolScope = requireSchoolAccess(ctx, schoolId);
    if (schoolScope !== true) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const importType = (body.importType ?? "student") as EdpImportType;
  const sourceFormat = (body.sourceFormat ?? "csv") as EdpSourceFormat;
  const content = body.content ?? "";

  const batch = await createImportBatch(supabase, {
    organizationId: orgId,
    importType,
    sourceFormat,
    fileName: body.fileName,
    importedBy: ctx.effectiveUserId,
    schoolId,
  });

  if (batch.error || !batch.batchId) {
    return NextResponse.json({ error: batch.error }, { status: 400 });
  }

  const mappings = body.fieldMappings ?? getDefaultMappings(importType);
  await parseAndStageImport(supabase, batch.batchId, content, mappings);
  await validateImportBatch(supabase, batch.batchId, importType, mappings);

  if (body.commit) {
    if (!COMMITTABLE_IMPORT_TYPES.includes(importType)) {
      return NextResponse.json(
        {
          error: `Import type "${importType}" does not support commit in v1.0. Supported: ${COMMITTABLE_IMPORT_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }
    await commitImportBatch(supabase, batch.batchId, importType);
  }

  return NextResponse.json({ batchId: batch.batchId });
}
