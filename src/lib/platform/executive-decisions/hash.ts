import {
  hashString,
  normalizeToken,
} from "@/lib/platform/executive-alerts/hash";

export { hashString, normalizeToken };

/**
 * Merge key for decisions:
 * prefer entity identity when present, else signal within scope + type.
 *
 * Mission Control / Workflow / JAG Work ids are globally unique — keyed by
 * organization (not campus) so schoolId/campusId aliases still merge.
 */
export function buildDecisionMergeKey(parts: {
  schoolId?: string | null;
  campusId?: string | null;
  organizationId?: string | null;
  decisionType: string;
  entityType?: string | null;
  entityId?: string | null;
  signalKey: string;
  missionControlId?: string | null;
  workflowId?: string | null;
  jagWorkId?: string | null;
}): string {
  const orgScope = parts.organizationId ?? "global";
  const siteScope =
    parts.campusId ?? parts.schoolId ?? parts.organizationId ?? "global";

  // Prefer canonical operator / workflow / work identities when present.
  if (parts.missionControlId) {
    return `ed_mc_${hashString(
      [normalizeToken(orgScope), normalizeToken(parts.missionControlId)].join("|")
    )}`;
  }
  if (parts.workflowId) {
    return `ed_wf_${hashString(
      [normalizeToken(orgScope), normalizeToken(parts.workflowId)].join("|")
    )}`;
  }
  if (parts.jagWorkId) {
    return `ed_jag_${hashString(
      [normalizeToken(orgScope), normalizeToken(parts.jagWorkId)].join("|")
    )}`;
  }

  const payload = [
    normalizeToken(siteScope),
    normalizeToken(parts.decisionType),
    normalizeToken(parts.entityType ?? "none"),
    normalizeToken(parts.entityId ?? "none"),
    normalizeToken(parts.signalKey),
  ].join("|");
  return `ed_${hashString(payload)}`;
}

export function decisionIdFromMergeKey(mergeKey: string): string {
  return `decision_${hashString(mergeKey)}`;
}
