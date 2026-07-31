import type {
  JagAuditFinding,
  JagComplianceRequirement,
  JagControl,
  JagException,
  JagMitigation,
  JagObligation,
  JagPolicy,
  JagRisk,
  RiskTimelineEntry,
} from "@/lib/risk/types";

type RiskStore = {
  risks: Map<string, JagRisk>;
  controls: Map<string, JagControl>;
  mitigations: Map<string, JagMitigation>;
  requirements: Map<string, JagComplianceRequirement>;
  policies: Map<string, JagPolicy>;
  obligations: Map<string, JagObligation>;
  findings: Map<string, JagAuditFinding>;
  exceptions: Map<string, JagException>;
  timeline: RiskTimelineEntry[];
};

const g = globalThis as typeof globalThis & {
  __jagRiskStore?: RiskStore;
};

function store(): RiskStore {
  if (!g.__jagRiskStore) {
    g.__jagRiskStore = {
      risks: new Map(),
      controls: new Map(),
      mitigations: new Map(),
      requirements: new Map(),
      policies: new Map(),
      obligations: new Map(),
      findings: new Map(),
      exceptions: new Map(),
      timeline: [],
    };
  }
  return g.__jagRiskStore;
}

export function resetRiskStoreForTests(): void {
  g.__jagRiskStore = {
    risks: new Map(),
    controls: new Map(),
    mitigations: new Map(),
    requirements: new Map(),
    policies: new Map(),
    obligations: new Map(),
    findings: new Map(),
    exceptions: new Map(),
    timeline: [],
  };
}

function key(organizationId: string, id: string): string {
  return `${organizationId}::${id}`;
}

export function upsertRisk(risk: JagRisk): JagRisk {
  store().risks.set(key(risk.organizationId, risk.id), risk);
  return risk;
}

export function getRisk(
  organizationId: string,
  riskId: string
): JagRisk | null {
  return store().risks.get(key(organizationId, riskId)) ?? null;
}

export function listRisksForOrganization(
  organizationId: string
): readonly JagRisk[] {
  return Object.freeze(
    [...store().risks.values()]
      .filter((r) => r.organizationId === organizationId)
      .sort((a, b) => b.residualScore - a.residualScore || b.updatedAt.localeCompare(a.updatedAt))
  );
}

export function upsertControl(control: JagControl): JagControl {
  store().controls.set(key(control.organizationId, control.id), control);
  return control;
}

export function getControl(
  organizationId: string,
  controlId: string
): JagControl | null {
  return store().controls.get(key(organizationId, controlId)) ?? null;
}

export function listControlsForOrganization(
  organizationId: string,
  riskId?: string
): readonly JagControl[] {
  return Object.freeze(
    [...store().controls.values()].filter(
      (c) =>
        c.organizationId === organizationId &&
        (riskId == null || c.riskId === riskId)
    )
  );
}

export function upsertMitigation(mitigation: JagMitigation): JagMitigation {
  store().mitigations.set(
    key(mitigation.organizationId, mitigation.id),
    mitigation
  );
  return mitigation;
}

export function getMitigation(
  organizationId: string,
  mitigationId: string
): JagMitigation | null {
  return store().mitigations.get(key(organizationId, mitigationId)) ?? null;
}

export function listMitigationsForOrganization(
  organizationId: string,
  riskId?: string
): readonly JagMitigation[] {
  return Object.freeze(
    [...store().mitigations.values()].filter(
      (m) =>
        m.organizationId === organizationId &&
        (riskId == null || m.riskId === riskId)
    )
  );
}

export function upsertComplianceRequirement(
  req: JagComplianceRequirement
): JagComplianceRequirement {
  store().requirements.set(key(req.organizationId, req.id), req);
  return req;
}

export function getComplianceRequirement(
  organizationId: string,
  requirementId: string
): JagComplianceRequirement | null {
  return store().requirements.get(key(organizationId, requirementId)) ?? null;
}

export function listComplianceRequirements(
  organizationId: string
): readonly JagComplianceRequirement[] {
  return Object.freeze(
    [...store().requirements.values()].filter(
      (r) => r.organizationId === organizationId
    )
  );
}

export function upsertPolicy(policy: JagPolicy): JagPolicy {
  store().policies.set(key(policy.organizationId, policy.id), policy);
  return policy;
}

export function listPolicies(
  organizationId: string
): readonly JagPolicy[] {
  return Object.freeze(
    [...store().policies.values()].filter(
      (p) => p.organizationId === organizationId
    )
  );
}

export function upsertObligation(obligation: JagObligation): JagObligation {
  store().obligations.set(key(obligation.organizationId, obligation.id), obligation);
  return obligation;
}

export function listObligations(
  organizationId: string
): readonly JagObligation[] {
  return Object.freeze(
    [...store().obligations.values()].filter(
      (o) => o.organizationId === organizationId
    )
  );
}

export function upsertAuditFinding(finding: JagAuditFinding): JagAuditFinding {
  store().findings.set(key(finding.organizationId, finding.id), finding);
  return finding;
}

export function listAuditFindings(
  organizationId: string
): readonly JagAuditFinding[] {
  return Object.freeze(
    [...store().findings.values()].filter(
      (f) => f.organizationId === organizationId
    )
  );
}

export function upsertException(exception: JagException): JagException {
  store().exceptions.set(key(exception.organizationId, exception.id), exception);
  return exception;
}

export function listExceptions(
  organizationId: string
): readonly JagException[] {
  return Object.freeze(
    [...store().exceptions.values()].filter(
      (e) => e.organizationId === organizationId
    )
  );
}

export function appendRiskTimeline(
  entry: RiskTimelineEntry
): RiskTimelineEntry {
  store().timeline.push(entry);
  if (store().timeline.length > 8000) {
    store().timeline = store().timeline.slice(-6000);
  }
  return entry;
}

export function listRiskTimeline(
  organizationId: string,
  riskId?: string
): readonly RiskTimelineEntry[] {
  return Object.freeze(
    store()
      .timeline.filter(
        (e) =>
          e.organizationId === organizationId &&
          (riskId == null || e.riskId === riskId)
      )
      .sort((a, b) => b.at.localeCompare(a.at))
  );
}
