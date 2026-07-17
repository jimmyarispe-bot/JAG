import { GOVERNANCE_CHECKLISTS } from "@/lib/certification/release-governance/checklists";
import { getReleaseStateDefinition, nextReleaseStates } from "@/lib/certification/release-governance/lifecycle";
import type { ReleaseGovernanceStore } from "@/lib/certification/release-governance/store";
import type {
  DomainStatus,
  GateDomain,
  ReleaseDashboardSnapshot,
} from "@/lib/certification/release-governance/types";

export function computeChecklistCompletionPercent(store: ReleaseGovernanceStore): number {
  const release = store.getRelease();
  let total = 0;
  let done = 0;
  for (const checklist of GOVERNANCE_CHECKLISTS) {
    const rows = release.checklistProgress[checklist.id] ?? [];
    for (const item of checklist.items) {
      if (!item.required) continue;
      total += 1;
      const row = rows.find((r) => r.itemId === item.id);
      if (row && (row.status === "complete" || row.status === "waived" || row.status === "na")) {
        done += 1;
      }
    }
  }
  if (total === 0) return 0;
  return Math.round((done / total) * 1000) / 10;
}

export function buildReleaseDashboard(store: ReleaseGovernanceStore): ReleaseDashboardSnapshot {
  const release = store.getRelease();
  const stateDefinition = getReleaseStateDefinition(release.currentState);
  const checklistCompletionPercent = computeChecklistCompletionPercent(store);

  const requiredForms = [
    "engineering_approval",
    "rc1_sign_off",
    "operations_approval",
    "rc2_sign_off",
    "pilot_approval",
    "rc3_sign_off",
    "dress_rehearsal_approval",
    "go_no_go",
    "executive_approval",
    "rc4_sign_off",
  ];

  const completedApprovals = release.approvals
    .filter((a) => a.decision === "approved" || a.decision === "conditional")
    .map((a) => a.formId);
  const openApprovals = requiredForms.filter((f) => !completedApprovals.includes(f));

  const gates: { domain: GateDomain; status: DomainStatus }[] = release.domainStatuses.map((d) => ({
    domain: d.domain,
    status: d.status,
  }));

  const criticalOpen = release.defectCounts.critical > 0;
  const goNoGoEligible =
    release.currentState === "rc4" &&
    !criticalOpen &&
    checklistCompletionPercent >= 95 &&
    openApprovals.filter((f) => f.startsWith("rc1") || f.startsWith("rc2") || f.startsWith("rc3") || f.startsWith("dress")).length === 0;

  return {
    release,
    stateDefinition,
    checklistCompletionPercent,
    openApprovals,
    completedApprovals: [...new Set(completedApprovals)],
    auditEventCount: store.audit.count(release.id),
    nextAllowedStates: nextReleaseStates(release.currentState),
    gates,
    goNoGoEligible,
  };
}

export interface DecisionMatrixRow {
  criterion: string;
  required: string;
  actual: string;
  pass: boolean;
}

export function buildGoNoGoDecisionMatrix(store: ReleaseGovernanceStore): DecisionMatrixRow[] {
  const dash = buildReleaseDashboard(store);
  const r = dash.release;
  return [
    {
      criterion: "RC1 signed",
      required: "Approved",
      actual: r.approvals.some((a) => a.formId === "rc1_sign_off" && a.decision === "approved")
        ? "Approved"
        : "Not signed",
      pass: r.approvals.some((a) => a.formId === "rc1_sign_off" && a.decision === "approved"),
    },
    {
      criterion: "RC2 signed",
      required: "Approved",
      actual: r.approvals.some((a) => a.formId === "rc2_sign_off" && a.decision === "approved")
        ? "Approved"
        : "Not signed",
      pass: r.approvals.some((a) => a.formId === "rc2_sign_off" && a.decision === "approved"),
    },
    {
      criterion: "RC3 signed",
      required: "Approved",
      actual: r.approvals.some((a) => a.formId === "rc3_sign_off" && a.decision === "approved")
        ? "Approved"
        : "Not signed",
      pass: r.approvals.some((a) => a.formId === "rc3_sign_off" && a.decision === "approved"),
    },
    {
      criterion: "RC3.5 dress rehearsal",
      required: "Approved",
      actual: r.approvals.some((a) => a.formId === "dress_rehearsal_approval" && a.decision === "approved")
        ? "Approved"
        : "Not signed",
      pass: r.approvals.some((a) => a.formId === "dress_rehearsal_approval" && a.decision === "approved"),
    },
    {
      criterion: "Critical defects",
      required: "Zero",
      actual: String(r.defectCounts.critical),
      pass: r.defectCounts.critical === 0,
    },
    {
      criterion: "Production readiness %",
      required: "≥ 85",
      actual: String(r.productionReadinessPercent),
      pass: r.productionReadinessPercent >= 85,
    },
    {
      criterion: "Checklist completion",
      required: "≥ 95%",
      actual: `${dash.checklistCompletionPercent}%`,
      pass: dash.checklistCompletionPercent >= 95,
    },
  ];
}
