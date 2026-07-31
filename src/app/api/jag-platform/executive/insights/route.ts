import {
  canAccessEvidenceOrganization,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  createInsightEvaluationService,
  INSIGHT_DOMAINS,
  INSIGHT_SEVERITIES,
  INSIGHT_STATUSES,
  type InsightDomain,
  type InsightSeverity,
  type InsightStatus,
} from "@/lib/executive-intelligence";
import {
  jsonOk,
  requireJagApiSession,
  requireOrganizationId,
} from "@/lib/jag-platform/api";

function asSeverity(value: string | null): InsightSeverity | "" {
  if (!value) return "";
  return (INSIGHT_SEVERITIES as readonly string[]).includes(value)
    ? (value as InsightSeverity)
    : "";
}

function asDomain(value: string | null): InsightDomain | "" {
  if (!value) return "";
  return (INSIGHT_DOMAINS as readonly string[]).includes(value)
    ? (value as InsightDomain)
    : "";
}

function asStatus(value: string | null): InsightStatus | "" {
  if (!value) return "";
  return (INSIGHT_STATUSES as readonly string[]).includes(value)
    ? (value as InsightStatus)
    : "";
}

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

  void resolveEvidenceOrganization(gate.session, orgGate.organizationId);
  const service = createInsightEvaluationService();
  const section = service.evaluate(
    orgGate.organizationId,
    gate.session.userId
  );
  const insightId = searchParams.get("insightId");
  if (insightId) {
    const insight = service.getInsight(orgGate.organizationId, insightId);
    return jsonOk(
      { insight, section },
      { correlationId: gate.correlationId }
    );
  }

  const filtered = service.listAll(orgGate.organizationId, {
    severity: asSeverity(searchParams.get("severity")),
    domain: asDomain(searchParams.get("domain")),
    status: asStatus(searchParams.get("status")),
  });

  return jsonOk(
    {
      insights: filtered,
      section,
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    insightId?: string;
    action?: string;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  const service = createInsightEvaluationService();
  if (body.action === "resolve" && body.insightId) {
    const insight = service.resolve(
      orgGate.organizationId,
      body.insightId,
      gate.session.userId
    );
    return jsonOk({ insight }, { correlationId: gate.correlationId });
  }

  const section = service.evaluate(
    orgGate.organizationId,
    gate.session.userId
  );
  return jsonOk({ section }, { correlationId: gate.correlationId });
}
