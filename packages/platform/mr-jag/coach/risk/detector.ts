/**
 * Risk detection — incomplete onboarding, backups, training, incidents, etc.
 */

import { randomUUID } from "node:crypto";
import { getAcademyProgress } from "../../academy/store";
import { listIncidents } from "../../help/intelligence";
import { normalizePersona } from "../../personas";
import { onboardingCompletionPercent } from "../milestones";
import { hasEventKind, listEvents, listRisks, upsertRisk } from "../store";
import type { CoachRisk, CoachRiskKind, CoachRiskSeverity } from "../types";

function severityFor(kind: CoachRiskKind): CoachRiskSeverity {
  switch (kind) {
    case "unapproved_payroll":
    case "connector_failures":
    case "expired_certifications":
      return "critical";
    case "missing_backups":
    case "unresolved_incidents":
    case "configuration_issues":
      return "high";
    case "incomplete_onboarding":
    case "low_training_completion":
    case "repeated_help_requests":
      return "medium";
    default:
      return "low";
  }
}

function upsertDetected(
  risk: Omit<CoachRisk, "id" | "detectedAt"> & { id?: string }
): CoachRisk {
  const existing = listRisks({
    organizationId: risk.organizationId,
    userId: risk.userId,
    openOnly: true,
  }).find((r) => r.kind === risk.kind);
  if (existing) {
    return upsertRisk({
      ...existing,
      ...risk,
      id: existing.id,
      detectedAt: existing.detectedAt,
      open: true,
    });
  }
  return upsertRisk({
    ...risk,
    id: risk.id ?? `risk:${randomUUID()}`,
    detectedAt: new Date().toISOString(),
  });
}

export function detectCoachRisks(input: {
  organizationId: string;
  userId: string;
  persona?: string | null;
  signals?: {
    missingBackups?: boolean;
    unusedFeatureIds?: readonly string[];
    configurationIssue?: boolean;
    inactiveWorkflowIds?: readonly string[];
    unapprovedPayroll?: boolean;
    connectorFailure?: boolean;
    expiredCertificationIds?: readonly string[];
  };
}): readonly CoachRisk[] {
  const persona = normalizePersona(input.persona);
  const detected: CoachRisk[] = [];
  const onboarding = onboardingCompletionPercent({
    organizationId: input.organizationId,
    userId: input.userId,
    persona,
  });

  if (onboarding < 60) {
    detected.push(
      upsertDetected({
        kind: "incomplete_onboarding",
        severity: severityFor("incomplete_onboarding"),
        title: "Incomplete onboarding",
        body: `Onboarding is ${onboarding}% complete for ${persona}. Finish milestone coaching to reduce operational risk.`,
        organizationId: input.organizationId,
        userId: input.userId,
        persona,
        open: true,
        relatedEventKinds: Object.freeze(["first_login"]),
      })
    );
  }

  const needsBackupPersona =
    persona === "Founder" || persona === "Executive" || persona === "Support";
  if (
    input.signals?.missingBackups === true ||
    (needsBackupPersona &&
      input.signals?.missingBackups !== false &&
      !hasEventKind(input.organizationId, input.userId, "first_backup"))
  ) {
    detected.push(
      upsertDetected({
        kind: "missing_backups",
        severity: severityFor("missing_backups"),
        title: "Missing backups",
        body: "No backup milestone observed. Schedule and verify a recovery point.",
        organizationId: input.organizationId,
        userId: input.userId,
        persona,
        open: true,
        relatedEventKinds: Object.freeze(["first_backup"]),
      })
    );
  }

  if ((input.signals?.unusedFeatureIds?.length ?? 0) > 0) {
    detected.push(
      upsertDetected({
        kind: "unused_features",
        severity: severityFor("unused_features"),
        title: "Unused features",
        body: `Features unused: ${input.signals!.unusedFeatureIds!.slice(0, 3).join(", ")}. Consider training or automation.`,
        organizationId: input.organizationId,
        userId: input.userId,
        persona,
        open: true,
        relatedEventKinds: Object.freeze([]),
      })
    );
  }

  const academy = getAcademyProgress(input.organizationId, input.userId);
  if (!academy || academy.pathCompletionPercent < 40) {
    detected.push(
      upsertDetected({
        kind: "low_training_completion",
        severity: severityFor("low_training_completion"),
        title: "Low training completion",
        body: `Academy path completion is ${academy?.pathCompletionPercent ?? 0}%. Continue recommended lessons.`,
        organizationId: input.organizationId,
        userId: input.userId,
        persona,
        open: true,
        relatedEventKinds: Object.freeze(["first_certification"]),
      })
    );
  }

  const helpEvents = listEvents({
    organizationId: input.organizationId,
    userId: input.userId,
    limit: 100,
  }).filter(
    (e) => e.kind === "help_request" || e.metadata?.helpRepeat === true
  );
  const incidents = listIncidents({
    organizationId: input.organizationId,
    limit: 20,
  });
  if (helpEvents.length >= 3 || incidents.length >= 3) {
    detected.push(
      upsertDetected({
        kind: "repeated_help_requests",
        severity: severityFor("repeated_help_requests"),
        title: "Repeated help requests",
        body: "Multiple help/incident signals detected. Pair Coach guidance with Help Center resolution.",
        organizationId: input.organizationId,
        userId: input.userId,
        persona,
        open: true,
        relatedEventKinds: Object.freeze(["first_login"]),
      })
    );
  }

  if (input.signals?.configurationIssue) {
    detected.push(
      upsertDetected({
        kind: "configuration_issues",
        severity: severityFor("configuration_issues"),
        title: "Configuration issues",
        body: "Configuration problems were reported. Review settings before continuing high-impact workflows.",
        organizationId: input.organizationId,
        userId: input.userId,
        persona,
        open: true,
        relatedEventKinds: Object.freeze([]),
      })
    );
  }

  if ((input.signals?.inactiveWorkflowIds?.length ?? 0) > 0) {
    detected.push(
      upsertDetected({
        kind: "inactive_workflows",
        severity: severityFor("inactive_workflows"),
        title: "Inactive workflows",
        body: `Inactive workflows: ${input.signals!.inactiveWorkflowIds!.slice(0, 3).join(", ")}.`,
        organizationId: input.organizationId,
        userId: input.userId,
        persona,
        open: true,
        relatedEventKinds: Object.freeze([]),
      })
    );
  }

  if (input.signals?.unapprovedPayroll) {
    detected.push(
      upsertDetected({
        kind: "unapproved_payroll",
        severity: severityFor("unapproved_payroll"),
        title: "Unapproved payroll",
        body: "Payroll is pending approval. Validate timesheets and certifications before export.",
        organizationId: input.organizationId,
        userId: input.userId,
        persona,
        open: true,
        relatedEventKinds: Object.freeze(["first_payroll"]),
      })
    );
  }

  const unresolved = incidents.filter(
    (i) => i.status === "Open" || i.status === "Diagnosed"
  );
  if (unresolved.length > 0) {
    detected.push(
      upsertDetected({
        kind: "unresolved_incidents",
        severity: severityFor("unresolved_incidents"),
        title: "Unresolved incidents",
        body: `${unresolved.length} Help Center incident(s) still need attention.`,
        organizationId: input.organizationId,
        userId: input.userId,
        persona,
        open: true,
        relatedEventKinds: Object.freeze([]),
      })
    );
  }

  if (input.signals?.connectorFailure) {
    detected.push(
      upsertDetected({
        kind: "connector_failures",
        severity: severityFor("connector_failures"),
        title: "Connector failures",
        body: "A connector failure was reported. Re-run diagnostics and verify credentials.",
        organizationId: input.organizationId,
        userId: input.userId,
        persona,
        open: true,
        relatedEventKinds: Object.freeze(["first_connector"]),
      })
    );
  }

  if ((input.signals?.expiredCertificationIds?.length ?? 0) > 0) {
    detected.push(
      upsertDetected({
        kind: "expired_certifications",
        severity: severityFor("expired_certifications"),
        title: "Expired certifications",
        body: `Expired: ${input.signals!.expiredCertificationIds!.slice(0, 3).join(", ")}. Renew before compliance deadlines.`,
        organizationId: input.organizationId,
        userId: input.userId,
        persona,
        open: true,
        relatedEventKinds: Object.freeze(["first_certification"]),
      })
    );
  }

  return Object.freeze(detected);
}

export function closeCoachRisk(riskId: string): CoachRisk | null {
  const all = listRisks({});
  const hit = all.find((r) => r.id === riskId);
  if (!hit) return null;
  return upsertRisk({ ...hit, open: false });
}
