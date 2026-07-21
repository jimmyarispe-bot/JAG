import type { EiEventSignal } from "./events";
import { countByDomain, domainForEvent } from "./events";
import type { FounderOpportunity } from "./types";

function idFor(key: string): string {
  return `opp-${key}`;
}

export function detectOpportunities(
  signals: EiEventSignal[],
  now = new Date()
): FounderOpportunity[] {
  const opps: FounderOpportunity[] = [];
  const nowIso = now.toISOString();
  const counts = countByDomain(signals);

  const leads = signals.filter(
    (s) => s.eventType === "lead.created" || s.eventType.includes("lead.")
  );
  const accepts = signals.filter((s) => s.eventType === "enrollment.accepted");
  if (leads.length >= 3 && accepts.length < leads.length / 2) {
    opps.push({
      id: idFor("enrollment-conversion"),
      title: "Enrollment conversion opportunity",
      summary: `${leads.length} leads vs ${accepts.length} accepts — conversion lift available.`,
      domain: "admissions",
      estimatedValue: leads.length * 2500,
      confidence: 0.74,
      recommendedAction: "Increase enrollment follow-up for open pipeline leads.",
      explainability: {
        why: "Admissions pipeline volume exceeds acceptance throughput.",
        evidence: [`${leads.length} lead signals`, `${accepts.length} acceptances`],
        relatedEventIds: [...leads, ...accepts].slice(0, 8).map((s) => s.id),
        confidence: 0.74,
        lastUpdated: nowIso,
      },
    });
  }

  const paid = signals.filter(
    (s) => s.eventType === "payment.received" || s.eventType === "invoice.paid"
  );
  const scholarships = signals.filter((s) => s.eventType.includes("scholarship"));
  if (paid.length >= 2) {
    opps.push({
      id: idFor("revenue-momentum"),
      title: "Revenue momentum",
      summary: `${paid.length} successful payment/settlement events — extend collection cadence.`,
      domain: "finance",
      estimatedValue: paid.length * 1200,
      confidence: 0.7,
      recommendedAction: "Promote payment plans to families with remaining balances.",
      explainability: {
        why: "Positive finance EI events indicate collection capacity.",
        evidence: paid.slice(0, 5).map((s) => s.title),
        relatedEventIds: paid.slice(0, 8).map((s) => s.id),
        confidence: 0.7,
        lastUpdated: nowIso,
      },
    });
  }

  if (scholarships.length === 0 && counts.finance > 5) {
    opps.push({
      id: idFor("grant-scholarship"),
      title: "Grant / scholarship utilization opportunity",
      summary: "Finance activity is high but scholarship EI signals are quiet.",
      domain: "finance",
      estimatedValue: 10000,
      confidence: 0.55,
      recommendedAction: "Review unused awards and promote available aid to families.",
      explainability: {
        why: "Cross-check of finance vs scholarship event volume.",
        evidence: [`${counts.finance} finance events`, "0 scholarship signals"],
        relatedEventIds: [],
        confidence: 0.55,
        lastUpdated: nowIso,
      },
    });
  }

  const workflowOk = signals.filter((s) => s.eventType === "workflow.completed");
  const manualish = signals.filter(
    (s) =>
      domainForEvent(s.eventType, s.moduleKey) === "documents" ||
      s.eventType.includes("task")
  );
  if (workflowOk.length < 2 && manualish.length >= 4) {
    opps.push({
      id: idFor("automation"),
      title: "Workflow automation candidate",
      summary: "Document/task volume is high relative to completed automations.",
      domain: "workflows",
      estimatedValue: 5000,
      confidence: 0.62,
      recommendedAction: "Automate document request + reminder workflows.",
      explainability: {
        why: "Operational EI volume suggests repeatable processes.",
        evidence: [
          `${manualish.length} document/task-like events`,
          `${workflowOk.length} workflow completions`,
        ],
        relatedEventIds: manualish.slice(0, 6).map((s) => s.id),
        confidence: 0.62,
        lastUpdated: nowIso,
      },
    });
  }

  const hires = signals.filter((s) => s.eventType === "employee.hired");
  const assigns = signals.filter((s) => s.eventType === "employee.assigned");
  if (hires.length && assigns.length < hires.length) {
    opps.push({
      id: idFor("staff-optimization"),
      title: "Staff assignment optimization",
      summary: "Recent hires may be under-assigned across schools/programs.",
      domain: "human_capital",
      estimatedValue: 0,
      confidence: 0.6,
      recommendedAction: "Balance class/program assignments for new hires.",
      explainability: {
        why: "Hire events without matching assignment events.",
        evidence: [`${hires.length} hires`, `${assigns.length} assignments`],
        relatedEventIds: hires.slice(0, 5).map((s) => s.id),
        confidence: 0.6,
        lastUpdated: nowIso,
      },
    });
  }

  const calendar = signals.filter(
    (s) => domainForEvent(s.eventType, s.moduleKey) === "calendar"
  );
  if (calendar.length === 0 && counts.students > 3) {
    opps.push({
      id: idFor("unused-capacity"),
      title: "Unused scheduling / capacity signal",
      summary: "Student activity without recent calendar/class scheduling events.",
      domain: "calendar",
      estimatedValue: 0,
      confidence: 0.5,
      recommendedAction: "Review class capacity and open seats across schools.",
      explainability: {
        why: "Cross-domain gap between students and calendar EI.",
        evidence: [`${counts.students} student events`, "0 calendar events"],
        relatedEventIds: [],
        confidence: 0.5,
        lastUpdated: nowIso,
      },
    });
  }

  if (counts.admissions > 0 && counts.finance > 0) {
    opps.push({
      id: idFor("cross-school-revenue"),
      title: "Cross-school enrollment ↔ revenue opportunity",
      summary: "Admissions and finance signals co-occur — align offers with tuition capacity.",
      domain: "organization",
      estimatedValue: 7500,
      confidence: 0.58,
      recommendedAction: "Coordinate admissions offers with available tuition seats.",
      explainability: {
        why: "Cross-domain correlation between admissions and finance activity.",
        evidence: [
          `${counts.admissions} admissions events`,
          `${counts.finance} finance events`,
        ],
        relatedEventIds: [],
        confidence: 0.58,
        lastUpdated: nowIso,
      },
    });
  }

  return opps.sort((a, b) => b.estimatedValue - a.estimatedValue || b.confidence - a.confidence);
}
