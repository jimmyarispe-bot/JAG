/**
 * Root Cause Engine — diagnosis from diagnostic signals + knowledge hits.
 */

import { listRegisteredWalkthroughs } from "../../../tutorials/registry";
import type { HelpEvidence } from "../../../types";
import type {
  DiagnosisConfidence,
  DiagnosticBundle,
  RootCauseDiagnosis,
} from "../types";

function confidenceFrom(
  failingWeight: number,
  hitCount: number
): DiagnosisConfidence {
  if (failingWeight >= 5 && hitCount >= 2) return "High";
  if (failingWeight >= 3 || hitCount >= 1) return "Medium";
  return "Low";
}

export function analyzeRootCause(input: {
  diagnostics: DiagnosticBundle & { intent: string };
}): RootCauseDiagnosis {
  const { diagnostics } = input;
  const intent = diagnostics.intent;
  const failing = diagnostics.signals.filter((s) => !s.ok);
  const failingWeight = failing.reduce((a, s) => a + s.weight, 0);
  const evidence: HelpEvidence[] = [
    ...diagnostics.searchHits.slice(0, 6),
    ...failing.map((s) => ({
      source: "operations" as const,
      id: s.id,
      title: s.category,
      excerpt: s.detail,
      path: s.evidence[0],
    })),
  ];

  let rootCause: string;
  let recommendedFix: string;
  let preventative: string[];
  let problem = diagnostics.question.trim();

  switch (intent) {
    case "invite_teacher":
      rootCause = failing.some((s) => s.id === "diag.config.email")
        ? "Email/invite delivery configuration is incomplete or permission gates block workforce invites."
        : "Invite workflow is blocked by permissions, configuration, or missing onboarding steps.";
      recommendedFix =
        "Verify RESEND_API_KEY, confirm the actor can manage workforce invites, then resend the invitation.";
      preventative = [
        "Keep invite email secrets in the host secret store.",
        "Grant least-privilege workforce invite permissions before go-live.",
      ];
      break;
    case "payroll_issue":
      rootCause =
        "Payroll processing depends on timesheet completion, certifications, and finance/HR configuration readiness.";
      recommendedFix =
        "Validate open timesheets, employee certifications, and HR payroll preparation status; re-run payroll prep.";
      preventative = [
        "Require certification checks before payroll export.",
        "Monitor HR ops diagnostics before each pay cycle.",
      ];
      break;
    case "invoices_missing":
      rootCause =
        "Invoice visibility is usually filtered by organization/campus or family-account linkage — not hard deletion.";
      recommendedFix =
        "Clear campus filters, confirm family account student links, then re-open Finance invoices.";
      preventative = [
        "Train Finance users on org/campus filters.",
        "Alert when invoices generate with unlinked students.",
      ];
      break;
    case "google_workspace_sync":
      rootCause = failing.some((s) => s.category === "connector")
        ? "Google Workspace connector authorization or sync health has degraded."
        : "Workspace sync stopped — typically OAuth expiry or connector misconfiguration.";
      recommendedFix =
        "Re-authorize the Google Workspace connector and inspect the latest connector sync status.";
      preventative = [
        "Monitor connector health in operations dashboards.",
        "Rotate OAuth credentials before expiry.",
      ];
      break;
    case "permissions":
      rootCause =
        "The current role lacks a required permission for the requested action.";
      recommendedFix =
        "Review role permissions against the security baseline and grant the missing capability.";
      preventative = [
        "Use least-privilege role templates.",
        "Validate permissions in staging before production role changes.",
      ];
      break;
    default:
      rootCause =
        failing.length > 0
          ? failing.map((s) => s.detail).join(" ")
          : "Insufficient failing signals — issue likely procedural or context-specific.";
      recommendedFix =
        evidence[0]?.excerpt ??
        "Review the top evidence items and related tutorial for the affected workflow.";
      preventative = [
        "Capture the resolution in Mr. JAG knowledge once verified.",
      ];
  }

  const walks = listRegisteredWalkthroughs({
    persona: diagnostics.persona,
  });
  const tutorial =
    evidence.find((e) => e.source === "tutorial")?.id ??
    null;
  const walk =
    walks.find((w) => tutorial && w.pageId === tutorial)?.id ??
    walks[0]?.id ??
    null;

  return {
    problem,
    rootCause,
    confidence: confidenceFrom(failingWeight, diagnostics.searchHits.length),
    evidence: Object.freeze(evidence.slice(0, 10)),
    recommendedFix,
    preventativeGuidance: Object.freeze(preventative),
    relatedTutorialId: tutorial,
    relatedWalkthroughId: walk,
    intent,
  };
}
