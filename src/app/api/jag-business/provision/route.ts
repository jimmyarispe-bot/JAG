import { NextResponse } from "next/server";
import { provisionOrganization } from "@/lib/jag-business/provision";
import type { PilotWizardInput } from "@/lib/jag-business/types";

export async function POST(request: Request) {
  let body: Partial<PilotWizardInput>;
  try {
    body = (await request.json()) as Partial<PilotWizardInput>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const result = provisionOrganization(body);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        fieldErrors: result.fieldErrors,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    organizationId: result.organization.organizationId,
    organizationName: result.organization.organizationName,
    founderEmail: result.organization.founder.email,
    workspaceId: result.organization.workspace.workspaceId,
    subscription: result.organization.subscription.planName,
  });
}
