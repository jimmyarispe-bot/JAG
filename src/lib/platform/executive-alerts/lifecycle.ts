import type { ExecutiveAlert } from "@/lib/platform/executive-alerts/types";

/**
 * In-memory lifecycle helpers for the composed alert stream.
 * Persistence remains on Mission Control / domain producers — this is not a second queue.
 */

export function acknowledgeAlert(
  alert: ExecutiveAlert,
  at: string = new Date().toISOString()
): ExecutiveAlert {
  if (alert.status === "dismissed") return alert;
  return {
    ...alert,
    status: "acknowledged",
    acknowledgedAt: at,
    dismissedAt: null,
  };
}

export function dismissAlert(
  alert: ExecutiveAlert,
  at: string = new Date().toISOString()
): ExecutiveAlert {
  return {
    ...alert,
    status: "dismissed",
    dismissedAt: at,
  };
}

export function reopenAlert(alert: ExecutiveAlert): ExecutiveAlert {
  return {
    ...alert,
    status: "open",
    acknowledgedAt: null,
    dismissedAt: null,
  };
}

/** Link an existing Workflow Engine instance — does not create a parallel workflow store. */
export function linkWorkflowReference(
  alert: ExecutiveAlert,
  workflowInstanceId: string
): ExecutiveAlert {
  return {
    ...alert,
    workflowReference: workflowInstanceId,
  };
}

/** Link an existing JAG Work item — does not create a second work queue. */
export function linkJagWorkReference(
  alert: ExecutiveAlert,
  jagWorkId: string
): ExecutiveAlert {
  return {
    ...alert,
    jagWorkReference: jagWorkId,
  };
}

/** Link the canonical Mission Control item. */
export function linkMissionControlReference(
  alert: ExecutiveAlert,
  missionControlItemId: string
): ExecutiveAlert {
  return {
    ...alert,
    missionControlReference: missionControlItemId,
  };
}

export function attachActivityReferences(
  alert: ExecutiveAlert,
  activityIds: string[]
): ExecutiveAlert {
  const seen = new Set(alert.activityReferences);
  const next = [...alert.activityReferences];
  for (const id of activityIds) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return { ...alert, activityReferences: next };
}
