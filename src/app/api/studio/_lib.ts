/**
 * JAG Studio API helpers — consume Platform session gates; do not modify Foundation.
 */

import {
  canAccessEvidenceOrganization,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  jsonError,
  jsonOk,
  requireJagApiSession,
  requireOrganizationId,
} from "@/lib/jag-platform/api";
import { JagErrors } from "@/lib/jag-platform/errors";

export { jsonError, jsonOk, JagErrors };

export async function requireStudioOrg(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate;

  const { searchParams } = new URL(request.url);
  const orgGate = requireOrganizationId(
    searchParams.get("organizationId"),
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate;

  return {
    ok: true as const,
    session: gate.session,
    correlationId: gate.correlationId,
    organizationId: orgGate.organizationId,
  };
}

export async function requireStudioOrgBody(body: {
  organizationId?: string;
}) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate;

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate;
  void resolveEvidenceOrganization(gate.session, orgGate.organizationId);

  return {
    ok: true as const,
    session: gate.session,
    correlationId: gate.correlationId,
    organizationId: orgGate.organizationId,
  };
}
