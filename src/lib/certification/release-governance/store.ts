import { AuditTrail } from "@/lib/certification/release-governance/audit-trail";
import { GOVERNANCE_CHECKLISTS } from "@/lib/certification/release-governance/checklists";
import { canTransition, getReleaseStateDefinition } from "@/lib/certification/release-governance/lifecycle";
import type {
  ApprovalDecision,
  ApprovalRecord,
  ChecklistItemRecord,
  ChecklistItemStatus,
  ReleaseRecord,
  ReleaseState,
} from "@/lib/certification/release-governance/types";

const ACADEMYOS_1_RELEASE_ID = "academyos-1.0";

function seedAcademyOs10(): ReleaseRecord {
  const now = "2026-07-17T00:00:00.000Z";
  const checklistProgress: Record<string, ChecklistItemRecord[]> = {};
  for (const checklist of GOVERNANCE_CHECKLISTS) {
    checklistProgress[checklist.id] = checklist.items.map((item) => {
      // RC1 quality items that passed local engineering gates
      const passedRc1 = new Set([
        "rc1.quality",
        "rc1.build",
        "rc1.test", // unit/integration only — E2E still open via rc1.e2e
      ]);
      if (checklist.id === "rc1_engineering" && passedRc1.has(item.id)) {
        return {
          itemId: item.id,
          status: "complete" as const,
          completedAt: now,
          completedBy: "phase-g-rc1",
          evidenceRef: "docs/launch/phase-g/artifacts/11_FINAL_TEST_RESULTS.md",
          notes: item.id === "rc1.test" ? "Unit+integration 890 pass; authenticated E2E still open" : undefined,
        };
      }
      return { itemId: item.id, status: "pending" as const };
    });
  }

  return {
    id: ACADEMYOS_1_RELEASE_ID,
    name: "AcademyOS",
    version: "1.0.0",
    currentState: "rc1",
    startedAt: now,
    updatedAt: now,
    productionReadinessPercent: 52,
    riskLevel: "critical",
    defectCounts: { critical: 7, high: 4, medium: 2, low: 1 },
    domainStatuses: [
      { domain: "architecture", status: "conditional", score: 75, notes: "A.1 complete" },
      { domain: "security", status: "conditional", score: 72, notes: "B.1; live RLS open" },
      { domain: "performance", status: "fail", score: 41, notes: "Phase C" },
      { domain: "accessibility", status: "conditional", score: 68, notes: "D.1; AA open" },
      { domain: "testing", status: "fail", score: 58, notes: "Phase E" },
      { domain: "documentation", status: "conditional", score: 64, notes: "Phase F" },
      { domain: "operations", status: "pending", notes: "RC2/RC3 not executed" },
      { domain: "support", status: "pending" },
      { domain: "monitoring", status: "fail", notes: "APM open" },
      { domain: "disaster_recovery", status: "fail", notes: "Restore not evidenced" },
      { domain: "backups", status: "pending" },
      { domain: "restore", status: "fail" },
      { domain: "deployment", status: "not_executed" },
      { domain: "rollback", status: "not_executed" },
    ],
    checklistProgress,
    approvals: [],
    risks: [
      {
        id: "R-MT-01",
        title: "Cross-tenant leakage undetected",
        severity: "critical",
        likelihood: "medium",
        impact: "critical",
        mitigation: "Complete live RLS soak before multi-org GA",
        residual: "High until closed",
        status: "open",
      },
      {
        id: "R-E2E-01",
        title: "Authenticated E2E missing",
        severity: "critical",
        likelihood: "high",
        impact: "high",
        mitigation: "Playwright role journeys",
        residual: "High",
        status: "open",
      },
    ],
    knownIssuesRef: "docs/launch/phase-g/artifacts/02_KNOWN_ISSUES_REGISTER.md",
    documentationRoot: "docs/launch/phase-g1/",
  };
}

export class ReleaseGovernanceStore {
  private release: ReleaseRecord;
  readonly audit: AuditTrail;

  constructor(seed?: ReleaseRecord) {
    this.release = structuredClone(seed ?? seedAcademyOs10());
    this.audit = new AuditTrail();
    this.audit.append({
      type: "report_published",
      actor: "system",
      releaseId: this.release.id,
      summary: "Seeded AcademyOS 1.0 release governance snapshot from Phase G evidence",
      payload: { state: this.release.currentState, readiness: this.release.productionReadinessPercent },
    });
  }

  getRelease(): ReleaseRecord {
    return structuredClone(this.release);
  }

  updateChecklistItem(input: {
    checklistId: string;
    itemId: string;
    status: ChecklistItemStatus;
    actor: string;
    evidenceRef?: string;
    notes?: string;
    waiverReason?: string;
  }): ChecklistItemRecord {
    const rows = this.release.checklistProgress[input.checklistId];
    if (!rows) throw new Error(`Unknown checklist ${input.checklistId}`);
    const idx = rows.findIndex((r) => r.itemId === input.itemId);
    if (idx < 0) throw new Error(`Unknown item ${input.itemId}`);
    const next: ChecklistItemRecord = {
      ...rows[idx]!,
      status: input.status,
      completedAt: input.status === "complete" || input.status === "waived" ? new Date().toISOString() : rows[idx]!.completedAt,
      completedBy: input.actor,
      evidenceRef: input.evidenceRef ?? rows[idx]!.evidenceRef,
      notes: input.notes ?? rows[idx]!.notes,
      waiverReason: input.waiverReason,
    };
    rows[idx] = next;
    this.release.updatedAt = new Date().toISOString();
    this.audit.append({
      type: "checklist_update",
      actor: input.actor,
      releaseId: this.release.id,
      summary: `Checklist ${input.checklistId}/${input.itemId} → ${input.status}`,
      payload: { checklistId: input.checklistId, itemId: input.itemId, status: input.status },
    });
    return structuredClone(next);
  }

  recordApproval(input: {
    formId: string;
    phase: string;
    approverName: string;
    approverRole: string;
    evidenceReviewed: string[];
    decision: ApprovalDecision;
    digitalSignature: string;
    conditions?: string;
    comments?: string;
    previousApprovalId?: string | null;
  }): ApprovalRecord {
    if (!input.digitalSignature.trim()) {
      throw new Error("digitalSignature is required");
    }
    const record: ApprovalRecord = {
      id: `apr_${this.release.approvals.length + 1}_${Date.now()}`,
      formId: input.formId,
      releaseId: this.release.id,
      phase: input.phase,
      approverName: input.approverName,
      approverRole: input.approverRole,
      date: new Date().toISOString(),
      evidenceReviewed: [...input.evidenceReviewed],
      decision: input.decision,
      conditions: input.conditions,
      comments: input.comments,
      digitalSignature: input.digitalSignature,
      previousApprovalId: input.previousApprovalId ?? null,
    };
    this.release.approvals.push(record);
    this.release.updatedAt = record.date;
    this.audit.append({
      type: "approval_recorded",
      actor: input.approverName,
      releaseId: this.release.id,
      summary: `${input.formId}: ${input.decision} by ${input.approverRole}`,
      payload: { approvalId: record.id, decision: input.decision, phase: input.phase },
    });
    return structuredClone(record);
  }

  transitionState(to: ReleaseState, actor: string, reason: string): ReleaseRecord {
    const from = this.release.currentState;
    if (!canTransition(from, to)) {
      throw new Error(`Illegal transition ${from} → ${to}`);
    }
    this.release.currentState = to;
    this.release.updatedAt = new Date().toISOString();
    this.audit.append({
      type: "state_transition",
      actor,
      releaseId: this.release.id,
      summary: `State ${from} → ${to}: ${reason}`,
      payload: { from, to, reason },
    });
    return this.getRelease();
  }

  setProductionReadiness(percent: number, actor: string): void {
    this.release.productionReadinessPercent = Math.max(0, Math.min(100, percent));
    this.release.updatedAt = new Date().toISOString();
    this.audit.append({
      type: "risk_decision",
      actor,
      releaseId: this.release.id,
      summary: `Production readiness set to ${this.release.productionReadinessPercent}%`,
    });
  }
}

let singleton: ReleaseGovernanceStore | null = null;

export function getReleaseGovernanceStore(): ReleaseGovernanceStore {
  if (!singleton) singleton = new ReleaseGovernanceStore();
  return singleton;
}

/** Test helper — resets process singleton. */
export function resetReleaseGovernanceStoreForTests(seed?: ReleaseRecord): ReleaseGovernanceStore {
  singleton = new ReleaseGovernanceStore(seed);
  return singleton;
}

export function getDefaultReleaseId(): string {
  return ACADEMYOS_1_RELEASE_ID;
}

export { getReleaseStateDefinition };
