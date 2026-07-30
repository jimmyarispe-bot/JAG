/**
 * Deterministic intent routing — no LLM. Keyword + memory topics.
 */

import type { JagConversationIntent } from "./types";

export type RoutedIntent = {
  readonly intent: JagConversationIntent;
  readonly reasoning: string;
  readonly usesPriorContext: boolean;
};

export function routeConversationIntent(
  question: string,
  memoryTopics: readonly string[] = []
): RoutedIntent {
  const q = question.trim().toLowerCase();
  if (!q) {
    return {
      intent: "insufficient",
      reasoning: "Empty question.",
      usesPriorContext: false,
    };
  }

  const followUp =
    /^(how does|what about|and |also |same for|does that|how that)/i.test(q) ||
    (q.split(/\s+/).length <= 8 &&
      memoryTopics.length > 0 &&
      !/decide|overdue|forecast|scenario|health|changed|risk/i.test(q));

  if (followUp && memoryTopics.length > 0) {
    const prior = memoryTopics[memoryTopics.length - 1]!;
    // Prefer an explicitly named new topic while retaining prior context.
    if (/student success|enrollment|attendance/i.test(q)) {
      return {
        intent: "student_success",
        reasoning: `Follow-up links prior topic (${prior}) to student success.`,
        usesPriorContext: true,
      };
    }
    if (/health|school|campus/i.test(q)) {
      return {
        intent: "organization_health",
        reasoning: `Follow-up links prior topic (${prior}) to organization health.`,
        usesPriorContext: true,
      };
    }
    if (/forecast/i.test(q)) {
      return {
        intent: "forecasts_attention",
        reasoning: `Follow-up links prior topic (${prior}) to forecasts.`,
        usesPriorContext: true,
      };
    }
    if (/funding|budget/i.test(q)) {
      return {
        intent: "funding",
        reasoning: `Follow-up continues funding with prior topic (${prior}).`,
        usesPriorContext: true,
      };
    }
    return {
      intent: "follow_up",
      reasoning: `Follow-up grounded in prior topic: ${prior}.`,
      usesPriorContext: true,
    };
  }

  if (
    /have we seen|seen this before|what happened last time|last time|how often has|which intervention worked|worked best|historical|institutional memory/i.test(
      q
    )
  ) {
    return {
      intent: "historical_memory",
      reasoning: "Question asks about institutional memory / prior experience.",
      usesPriorContext: false,
    };
  }
  if (
    /accomplishing our mission|mission\??$|goals? (are |most )?at risk|initiatives? drive|progressing this quarter|strategic alignment|which goals/i.test(
      q
    )
  ) {
    return {
      intent: "strategic_alignment",
      reasoning: "Question asks about mission, goals, or strategic progress.",
      usesPriorContext: false,
    };
  }
  if (/delay|defer|if we (do nothing|wait)|what happens if/i.test(q)) {
    return {
      intent: "delay_decision",
      reasoning: "Question asks about deferral / delay consequences.",
      usesPriorContext: false,
    };
  }
  if (/decide today|should i decide|decision queue|decide now/i.test(q)) {
    return {
      intent: "decide_today",
      reasoning: "Question asks for decisions due now.",
      usesPriorContext: false,
    };
  }
  if (/overdue/i.test(q)) {
    return {
      intent: "overdue_decisions",
      reasoning: "Question asks for overdue decisions.",
      usesPriorContext: false,
    };
  }
  if (/health|declin/i.test(q) && /org|organization|school|campus/i.test(q)) {
    return {
      intent: "organization_health",
      reasoning: "Question about organization / school health.",
      usesPriorContext: false,
    };
  }
  if (/health/i.test(q) && /why|declin/i.test(q)) {
    return {
      intent: "organization_health",
      reasoning: "Why-health question.",
      usesPriorContext: false,
    };
  }
  if (
    /deserves? my attention|what deserves|attention right now|executive inbox|biggest emerging risk|emerging risk/i.test(
      q
    )
  ) {
    return {
      intent: "executive_attention",
      reasoning: "Question asks for proactive watcher / inbox attention items.",
      usesPriorContext: false,
    };
  }
  if (/changed|since last|what.?s new|overnight|changed today/i.test(q)) {
    return {
      intent: "what_changed",
      reasoning: "Change-since question.",
      usesPriorContext: false,
    };
  }
  if (/highest risk|at risk|riskiest/i.test(q)) {
    return {
      intent: "highest_risk",
      reasoning: "Highest-risk question.",
      usesPriorContext: false,
    };
  }
  if (/forecast/i.test(q)) {
    return {
      intent: "forecasts_attention",
      reasoning: "Forecast attention question.",
      usesPriorContext: false,
    };
  }
  if (/high.?confidence|confidence/i.test(q) && /recommend/i.test(q)) {
    return {
      intent: "high_confidence_recommendations",
      reasoning: "High-confidence recommendations filter.",
      usesPriorContext: false,
    };
  }
  if (/scenario|what if we (hire|cut|open|close)/i.test(q)) {
    return {
      intent: "scenario_what_if",
      reasoning: "Scenario / what-if question.",
      usesPriorContext: false,
    };
  }
  if (/funding|budget|cash/i.test(q)) {
    return {
      intent: "funding",
      reasoning: "Funding-related question.",
      usesPriorContext: false,
    };
  }
  if (/student success|enrollment|attendance/i.test(q)) {
    return {
      intent: "student_success",
      reasoning: "Student success topic.",
      usesPriorContext: false,
    };
  }
  if (/briefing|brief/i.test(q)) {
    return {
      intent: "briefings",
      reasoning: "Briefing question.",
      usesPriorContext: false,
    };
  }
  if (/find |search |show me |where is /i.test(q)) {
    return {
      intent: "search",
      reasoning: "Search / locate question.",
      usesPriorContext: false,
    };
  }

  return {
    intent: "general_status",
    reasoning: "General executive status question — answer from bound overview signals only.",
    usesPriorContext: false,
  };
}

function topicToIntent(topic: string): JagConversationIntent {
  switch (topic) {
    case "funding":
      return "funding";
    case "student_success":
      return "student_success";
    case "organization_health":
      return "organization_health";
    case "forecasts":
      return "forecasts_attention";
    case "scenarios":
      return "scenario_what_if";
    case "decisions":
      return "decide_today";
    default:
      return "follow_up";
  }
}

export function intentToMemoryTopic(intent: JagConversationIntent): string | null {
  switch (intent) {
    case "funding":
      return "funding";
    case "student_success":
      return "student_success";
    case "organization_health":
      return "organization_health";
    case "forecasts_attention":
      return "forecasts";
    case "scenario_what_if":
    case "delay_decision":
      return "scenarios";
    case "decide_today":
    case "overdue_decisions":
    case "high_confidence_recommendations":
      return "decisions";
    case "historical_memory":
      return "institutional_memory";
    case "strategic_alignment":
      return "strategy";
    case "executive_attention":
      return "inbox";
    default:
      return null;
  }
}
