import type { NormalizedEvent, Anomaly } from "../types";

function sev(
  confidence: number,
  impact: number
): Anomaly["severity"] {
  const s = (confidence + impact) / 2;
  if (s >= 0.85) return "critical";
  if (s >= 0.7) return "high";
  if (s >= 0.55) return "medium";
  if (s >= 0.4) return "low";
  return "info";
}

/** Stage 6 — Anomaly Detection */
export function stageAnomalyDetection(events: NormalizedEvent[], now = new Date()): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const byDomain = new Map<string, NormalizedEvent[]>();
  for (const e of events) {
    const list = byDomain.get(e.domain) ?? [];
    list.push(e);
    byDomain.set(e.domain, list);
  }

  const enrollDown = events.filter(
    (e) =>
      e.eventType.includes("archived") ||
      e.eventType.includes("withdraw") ||
      e.eventType === "student.deleted"
  );
  const enrollUp = events.filter(
    (e) =>
      e.eventType.includes("lead.") ||
      e.eventType === "enrollment.accepted" ||
      e.eventType === "student.created"
  );
  if (enrollDown.length >= 2 && enrollDown.length > enrollUp.length) {
    anomalies.push({
      id: "anom-enrollment-drop",
      title: "Sudden enrollment drop signal",
      summary: `Decline signals (${enrollDown.length}) exceed growth (${enrollUp.length}).`,
      severity: sev(0.72, 0.85),
      confidence: 0.72,
      evidence: enrollDown.slice(0, 5).map((e) => e.title),
      relatedEntities: enrollDown
        .filter((e) => e.entityId)
        .slice(0, 5)
        .map((e) => ({
          type: e.entityType ?? "student",
          id: e.entityId!,
        })),
      relatedEventIds: enrollDown.map((e) => e.id),
      domain: "enrollment",
    });
  }

  const overdue = events.filter(
    (e) => e.eventType.includes("overdue") || e.eventType.includes("payment.failed")
  );
  if (overdue.length >= 2) {
    anomalies.push({
      id: "anom-overdue-spike",
      title: "Spike in overdue invoices / failed payments",
      summary: `${overdue.length} collection stress signals detected.`,
      severity: sev(0.8, 0.8),
      confidence: 0.8,
      evidence: overdue.slice(0, 5).map((e) => e.title),
      relatedEntities: overdue
        .filter((e) => e.entityId)
        .slice(0, 5)
        .map((e) => ({ type: e.entityType ?? "invoice", id: e.entityId! })),
      relatedEventIds: overdue.map((e) => e.id),
      domain: "finance",
    });
  }

  const wfFail = events.filter((e) => e.eventType.includes("workflow.failed"));
  if (wfFail.length >= 2) {
    anomalies.push({
      id: "anom-workflow-failures",
      title: "Increased workflow failures",
      summary: `${wfFail.length} workflow failure events.`,
      severity: sev(0.75, 0.65),
      confidence: 0.75,
      evidence: wfFail.slice(0, 5).map((e) => e.title),
      relatedEntities: [],
      relatedEventIds: wfFail.map((e) => e.id),
      domain: "workflows",
    });
  }

  const attendance = events.filter((e) => e.eventType.includes("attendance"));
  if (attendance.length >= 3) {
    anomalies.push({
      id: "anom-attendance",
      title: "Attendance anomaly cluster",
      summary: `${attendance.length} attendance-related signals.`,
      severity: sev(0.66, 0.7),
      confidence: 0.66,
      evidence: attendance.slice(0, 5).map((e) => e.title),
      relatedEntities: [],
      relatedEventIds: attendance.map((e) => e.id),
      domain: "students",
    });
  }

  const terms = events.filter(
    (e) =>
      e.eventType === "employee.terminated" || e.eventType === "employee.deactivated"
  );
  const hires = events.filter((e) => e.eventType === "employee.hired");
  if (terms.length > hires.length && terms.length >= 2) {
    anomalies.push({
      id: "anom-staffing-shortage",
      title: "Staffing shortage anomaly",
      summary: `Separations (${terms.length}) outpace hires (${hires.length}).`,
      severity: sev(0.7, 0.78),
      confidence: 0.7,
      evidence: [`${terms.length} separations`, `${hires.length} hires`],
      relatedEntities: terms
        .filter((e) => e.entityId)
        .map((e) => ({ type: "employee", id: e.entityId! })),
      relatedEventIds: [...terms, ...hires].map((e) => e.id),
      domain: "human_capital",
    });
  }

  const compliance = events.filter(
    (e) => e.eventType.includes("certification.expiring") || e.eventType.includes("compliance")
  );
  if (compliance.length >= 1) {
    anomalies.push({
      id: "anom-compliance-gap",
      title: "Compliance gap signals",
      summary: `${compliance.length} compliance/credential alert(s).`,
      severity: sev(0.78, 0.75),
      confidence: 0.78,
      evidence: compliance.slice(0, 5).map((e) => e.title),
      relatedEntities: [],
      relatedEventIds: compliance.map((e) => e.id),
      domain: "human_capital",
    });
  }

  const comms = byDomain.get("communications") ?? [];
  if (comms.length === 0 && events.length >= 10) {
    anomalies.push({
      id: "anom-comms-inactivity",
      title: "Communication inactivity",
      summary: "No communication EI events despite overall organizational activity.",
      severity: "medium",
      confidence: 0.55,
      evidence: [`${events.length} total events`, "0 communications domain events"],
      relatedEntities: [],
      relatedEventIds: [],
      domain: "communications",
    });
  }

  void now;
  return anomalies.sort((a, b) => b.confidence - a.confidence);
}
