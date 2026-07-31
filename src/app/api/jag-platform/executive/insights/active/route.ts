import {
  canAccessEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  createInsightEvaluationService,
  INSIGHT_DOMAINS,
  INSIGHT_SEVERITIES,
  type InsightDomain,
  type InsightSeverity,
} from "@/lib/executive-intelligence";
import {
  jsonOk,
  requireJagApiSession,
  requireOrganizationId,
} from "@/lib/jag-platform/api";

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

  const severity = searchParams.get("severity");
  const domain = searchParams.get("domain");
  const service = createInsightEvaluationService();
  service.evaluate(orgGate.organizationId, gate.session.userId);

  const insights = service.listActive(orgGate.organizationId, {
    severity:
      severity && (INSIGHT_SEVERITIES as readonly string[]).includes(severity)
        ? (severity as InsightSeverity)
        : "",
    domain:
      domain && (INSIGHT_DOMAINS as readonly string[]).includes(domain)
        ? (domain as InsightDomain)
        : "",
  });

  return jsonOk({ insights }, { correlationId: gate.correlationId });
}
