/**
 * Board & Governance Intelligence — BoardQueries (Sprint 029).
 */

import type { BoardQueries as BoardQueriesContract } from "@/lib/platform/intelligence/board-governance/contracts";
import { levelFromValue } from "@/lib/platform/intelligence/board-governance/models";
import type {
  BoardQueryRequest,
  BoardQueryResult,
  GovernanceResult,
} from "@/lib/platform/intelligence/board-governance/types";

/**
 * BoardQueries — deterministic Q&A over governance results.
 */
export class BoardQueriesEngine implements BoardQueriesContract {
  ask(
    result: GovernanceResult,
    request: BoardQueryRequest
  ): BoardQueryResult {
    const focus = request.focus ?? inferFocus(request.question);
    const max = request.maxResults ?? 3;
    const references: string[] = [];
    let answer: string;

    switch (focus) {
      case "packet": {
        const packets = request.packetKind
          ? result.packets.filter((p) => p.kind === request.packetKind)
          : result.packets;
        answer =
          packets.length > 0
            ? `Packets: ${packets
                .slice(0, max)
                .map((p) => `${p.title} — ${p.summary.slice(0, 120)}`)
                .join(" | ")}`
            : "No board packets generated.";
        references.push(...packets.slice(0, max).map((p) => p.id));
        break;
      }
      case "risk": {
        const risks = result.risks.slice(0, max);
        answer =
          risks.length > 0
            ? `Risk register: ${risks.map((r) => `${r.title} (${r.heat})`).join("; ")}.`
            : "No risks on the register.";
        references.push(...risks.map((r) => r.id));
        break;
      }
      case "compliance": {
        const items = result.compliance.slice(0, max);
        answer =
          items.length > 0
            ? `Compliance: ${items.map((c) => `${c.area} is ${c.status}`).join("; ")}.`
            : "No compliance items.";
        references.push(...items.map((c) => c.id));
        break;
      }
      case "initiative": {
        const initiatives = result.initiatives.slice(0, max);
        answer =
          initiatives.length > 0
            ? `Initiatives: ${initiatives
                .map((i) => `${i.title} ${i.progressPct}% (${i.status})`)
                .join("; ")}.`
            : "No strategic initiatives tracked.";
        references.push(...initiatives.map((i) => i.id));
        break;
      }
      case "resolution": {
        const resolutions = result.resolutions.slice(0, max);
        answer =
          resolutions.length > 0
            ? `Resolutions: ${resolutions
                .map((r) => `${r.title} (${r.status})`)
                .join("; ")}.`
            : "No board resolutions tracked.";
        references.push(...resolutions.map((r) => r.id));
        break;
      }
      case "kpi": {
        const kpis = result.kpiDashboard.kpis.slice(0, max);
        answer =
          kpis.length > 0
            ? `KPIs: ${kpis.map((k) => `${k.label}=${k.value}`).join("; ")}.`
            : "No KPIs available.";
        references.push(...kpis.map((k) => k.id));
        break;
      }
      case "calendar": {
        const events = (
          request.committee
            ? result.calendar.filter((e) => e.committee === request.committee)
            : result.calendar
        ).slice(0, max);
        answer =
          events.length > 0
            ? `Calendar: ${events.map((e) => `${e.title} @ ${e.scheduledAt}`).join("; ")}.`
            : "No governance calendar events.";
        references.push(...events.map((e) => e.id));
        break;
      }
      case "brief": {
        answer = `${result.brief.headline}. ${result.brief.situation}`;
        references.push(result.brief.id);
        break;
      }
      case "general":
      default: {
        answer = `${result.projection.headline}. Governance score ${result.dashboard.overallGovernanceScore}. ${result.recommendations.slice(0, max).join(" ")}`;
        references.push(result.historyRecord.id);
        break;
      }
    }

    return {
      question: request.question,
      focus,
      answer,
      references,
      confidence: {
        value: result.confidence.value,
        level: levelFromValue(result.confidence.value),
        factors: result.confidence.factors,
      },
    };
  }
}

function inferFocus(
  question: string
): NonNullable<BoardQueryRequest["focus"]> {
  const q = question.toLowerCase();
  if (q.includes("risk") || q.includes("heat")) return "risk";
  if (q.includes("compliance")) return "compliance";
  if (q.includes("initiative") || q.includes("strategic")) return "initiative";
  if (q.includes("resolution") || q.includes("vote")) return "resolution";
  if (q.includes("kpi") || q.includes("metric")) return "kpi";
  if (q.includes("calendar") || q.includes("meeting")) return "calendar";
  if (q.includes("brief")) return "brief";
  if (q.includes("packet") || q.includes("report")) return "packet";
  return "general";
}

/** Alias matching Sprint 029 naming. */
export { BoardQueriesEngine as BoardQueries };
