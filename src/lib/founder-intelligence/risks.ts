import type { EiEventSignal } from "./events";
import { domainForEvent } from "./events";
import type { FounderRisk, InsightSeverity } from "./types";

function idFor(prefix: string, key: string): string {
  return `${prefix}-${key.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
}

function severityFrom(probability: number, impact: number): InsightSeverity {
  const score = (probability + impact) / 2;
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 55) return "medium";
  if (score >= 40) return "low";
  return "info";
}

export function detectRisks(signals: EiEventSignal[], now = new Date()): FounderRisk[] {
  const risks: FounderRisk[] = [];
  const nowIso = now.toISOString();

  const overdue = signals.filter(
    (s) =>
      s.eventType.includes("overdue") ||
      s.eventType === "invoice.overdue" ||
      s.eventType.includes("payment.failed")
  );
  if (overdue.length) {
    risks.push({
      id: idFor("risk", "cash-flow"),
      title: "Cash flow / late invoice risk",
      summary: `${overdue.length} overdue or failed payment signal(s) in the analysis window.`,
      domain: "finance",
      probability: Math.min(95, 55 + overdue.length * 8),
      impact: 80,
      severity: severityFrom(55 + overdue.length * 8, 80),
      recommendedAction: "Escalate overdue invoices and review collection workflows.",
      explainability: {
        why: "Finance EI events indicate delayed or failed collections.",
        evidence: overdue.slice(0, 5).map((s) => `${s.eventType}: ${s.title}`),
        relatedEventIds: overdue.slice(0, 10).map((s) => s.id),
        confidence: Math.min(0.92, 0.6 + overdue.length * 0.05),
        lastUpdated: nowIso,
      },
    });
  }

  const certs = signals.filter((s) => s.eventType.includes("certification.expiring"));
  if (certs.length) {
    risks.push({
      id: idFor("risk", "cert-expiration"),
      title: "Certification expiration risk",
      summary: `${certs.length} credential(s) approaching expiration.`,
      domain: "human_capital",
      probability: Math.min(90, 60 + certs.length * 5),
      impact: 75,
      severity: severityFrom(60 + certs.length * 5, 75),
      recommendedAction: "Renew Teacher / staff credentials before they lapse.",
      explainability: {
        why: "HCM certification.expiring events were detected.",
        evidence: certs.slice(0, 5).map((s) => s.title),
        relatedEventIds: certs.map((s) => s.id),
        confidence: 0.88,
        lastUpdated: nowIso,
      },
    });
  }

  const workflowFails = signals.filter(
    (s) => s.eventType.includes("workflow.failed") || s.eventType === "workflow.failed"
  );
  if (workflowFails.length) {
    risks.push({
      id: idFor("risk", "workflow-failures"),
      title: "Workflow automation failures",
      summary: `${workflowFails.length} workflow failure(s) may create operational bottlenecks.`,
      domain: "workflows",
      probability: Math.min(85, 50 + workflowFails.length * 10),
      impact: 65,
      severity: severityFrom(50 + workflowFails.length * 10, 65),
      recommendedAction: "Inspect failed workflow runs and archive inactive definitions.",
      explainability: {
        why: "Workflow Engine reported failed executions.",
        evidence: workflowFails.slice(0, 5).map((s) => s.title),
        relatedEventIds: workflowFails.map((s) => s.id),
        confidence: 0.85,
        lastUpdated: nowIso,
      },
    });
  }

  const terms = signals.filter(
    (s) =>
      s.eventType === "employee.terminated" || s.eventType === "employee.deactivated"
  );
  const hires = signals.filter((s) => s.eventType === "employee.hired");
  if (terms.length > hires.length && terms.length >= 2) {
    risks.push({
      id: idFor("risk", "staff-shortage"),
      title: "Staffing shortage risk",
      summary: `Separations (${terms.length}) outpace hires (${hires.length}) in the window.`,
      domain: "human_capital",
      probability: 70,
      impact: 78,
      severity: "high",
      recommendedAction: "Accelerate recruiting for critical roles and review capacity.",
      explainability: {
        why: "Net workforce change is negative based on HCM EI events.",
        evidence: [
          `${terms.length} terminations/deactivations`,
          `${hires.length} hires`,
        ],
        relatedEventIds: [...terms, ...hires].slice(0, 10).map((s) => s.id),
        confidence: 0.72,
        lastUpdated: nowIso,
      },
    });
  }

  const attendance = signals.filter((s) => s.eventType.includes("attendance"));
  const attendanceAlerts = attendance.filter(
    (s) =>
      s.eventType.includes("threshold") ||
      (s.summary ?? "").toLowerCase().includes("absent")
  );
  if (attendanceAlerts.length >= 2) {
    risks.push({
      id: idFor("risk", "attendance"),
      title: "Attendance concern",
      summary: `${attendanceAlerts.length} attendance alert signal(s) detected.`,
      domain: "students",
      probability: 62,
      impact: 70,
      severity: "medium",
      recommendedAction: "Follow up with families on attendance and academic risk.",
      explainability: {
        why: "Student attendance EI thresholds or alerts fired.",
        evidence: attendanceAlerts.slice(0, 5).map((s) => s.title),
        relatedEventIds: attendanceAlerts.map((s) => s.id),
        confidence: 0.68,
        lastUpdated: nowIso,
      },
    });
  }

  const comms = signals.filter((s) => domainForEvent(s.eventType, s.moduleKey) === "communications");
  const failedComms = comms.filter(
    (s) => s.eventType.includes("failed") || s.eventType.includes("bounced")
  );
  if (failedComms.length >= 3) {
    risks.push({
      id: idFor("risk", "comms-bottleneck"),
      title: "Communication bottleneck",
      summary: `${failedComms.length} failed/bounced communication events may hurt retention outreach.`,
      domain: "communications",
      probability: 58,
      impact: 55,
      severity: "medium",
      recommendedAction: "Audit delivery channels and retry critical family outreach.",
      explainability: {
        why: "Communications platform failure signals clustered in the window.",
        evidence: failedComms.slice(0, 5).map((s) => s.title),
        relatedEventIds: failedComms.map((s) => s.id),
        confidence: 0.64,
        lastUpdated: nowIso,
      },
    });
  }

  const enrollDown = signals.filter(
    (s) =>
      s.eventType === "student.archived" ||
      s.eventType === "student.deleted" ||
      s.eventType.includes("withdraw")
  );
  const enrollUp = signals.filter(
    (s) =>
      s.eventType === "enrollment.accepted" ||
      s.eventType === "student.created" ||
      s.eventType === "lead.created"
  );
  if (enrollDown.length > enrollUp.length && enrollDown.length >= 2) {
    risks.push({
      id: idFor("risk", "enrollment-decline"),
      title: "Enrollment decline risk",
      summary: `Withdrawals/archives (${enrollDown.length}) exceed new enrollment signals (${enrollUp.length}).`,
      domain: "enrollment",
      probability: 66,
      impact: 85,
      severity: "high",
      recommendedAction: "Increase enrollment outreach in underfilled programs.",
      explainability: {
        why: "Admissions/SIS EI mix shows net negative enrollment momentum.",
        evidence: [
          `${enrollDown.length} decline signals`,
          `${enrollUp.length} growth signals`,
        ],
        relatedEventIds: [...enrollDown, ...enrollUp].slice(0, 10).map((s) => s.id),
        confidence: 0.7,
        lastUpdated: nowIso,
      },
    });
  }

  return risks.sort(
    (a, b) => b.probability * b.impact - a.probability * a.impact
  );
}
