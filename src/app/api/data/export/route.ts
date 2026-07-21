import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  requireOrganizationAccess,
  requireSchoolAccess,
} from "@/lib/platform/identity/tenant-access";
import { canExportData } from "@/lib/enterprise-data/access";
import { getPrimaryOrganizationId } from "@/lib/enterprise-data/context";
import { runExport } from "@/lib/enterprise-data/export-engine";
import type { EdpExportFormat } from "@/lib/enterprise-data/types";

export async function GET(request: Request) {
  const ctx = await getIdentityContext();
  if (!ctx || !canExportData(ctx)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const exportType = searchParams.get("type") ?? "students";
  const exportFormat = (searchParams.get("format") ?? "csv") as EdpExportFormat;
  const schoolId = searchParams.get("schoolId");

  const supabase = await createAuthClient();
  const orgId = await getPrimaryOrganizationId(supabase);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  // RC-3 — confirm primary org membership; optional school filter must be in scope.
  const orgScope = await requireOrganizationAccess(supabase, ctx.effectiveUserId, orgId);
  if (orgScope !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (schoolId) {
    const schoolScope = requireSchoolAccess(ctx, schoolId);
    if (schoolScope !== true) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const result = await runExport(supabase, {
    organizationId: orgId,
    exportType,
    exportFormat,
    schoolId: schoolId ?? undefined,
    exportedBy: ctx.effectiveUserId,
  });

  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  if (!("csv" in result)) {
    return NextResponse.json({ error: "Export failed" }, { status: 400 });
  }

  return new NextResponse(result.csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${exportType}-export.csv"`,
    },
  });
}
