import { canAccessEvidenceOrganization } from "@/lib/evidence-center";
import {
  createControlService,
  CONTROL_TYPES,
  type ControlType,
} from "@/lib/risk";
import {
  jsonError,
  jsonOk,
  requireJagApiSession,
  requireOrganizationId,
} from "@/lib/jag-platform/api";
import { JagErrors } from "@/lib/jag-platform/errors";

export async function GET(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const orgGate = requireOrganizationId(
    searchParams.get("organizationId"),
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  const riskId = searchParams.get("riskId") ?? undefined;
  return jsonOk(
    {
      controls: createControlService().list(orgGate.organizationId, riskId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    riskId?: string | null;
    name?: string;
    description?: string;
    controlType?: string;
    owner?: string | null;
    frequency?: string;
    effectiveness?: string;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  if (!body.name?.trim()) {
    return jsonError(JagErrors.validation("Control name is required."));
  }

  const controlType = (CONTROL_TYPES as readonly string[]).includes(
    body.controlType ?? ""
  )
    ? (body.controlType as ControlType)
    : "Preventive";

  const result = createControlService().create({
    organizationId: orgGate.organizationId,
    riskId: body.riskId ?? null,
    name: body.name.trim(),
    description: body.description?.trim() ?? "",
    controlType,
    owner: body.owner ?? null,
    frequency: body.frequency,
    effectiveness: body.effectiveness as never,
    createdBy: gate.session.userId,
  });

  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }

  return jsonOk(
    { control: result },
    { correlationId: gate.correlationId, status: 201 }
  );
}
