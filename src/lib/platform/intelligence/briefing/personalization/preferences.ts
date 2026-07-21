import type {
  BriefingPreferences,
  BriefingRequest,
  BriefingRole,
} from "@/lib/platform/intelligence/briefing/types";

export function resolvePreferences(request: BriefingRequest): BriefingPreferences {
  const role: BriefingRole = request.preferences?.role ?? request.role ?? "executive";
  return {
    role,
    greetingName: request.preferences?.greetingName ?? request.greetingName ?? "Executive",
    maxRisks: request.preferences?.maxRisks ?? defaultMax(role, "risks"),
    maxOpportunities: request.preferences?.maxOpportunities ?? defaultMax(role, "opportunities"),
    maxDecisions: request.preferences?.maxDecisions ?? defaultMax(role, "decisions"),
    maxAlerts: request.preferences?.maxAlerts ?? defaultMax(role, "alerts"),
    emphasizeDomains: request.preferences?.emphasizeDomains ?? defaultEmphasize(role),
    hideKinds: request.preferences?.hideKinds ?? [],
  };
}

function defaultMax(
  role: BriefingRole,
  kind: "risks" | "opportunities" | "decisions" | "alerts"
): number {
  if (role === "board") {
    return kind === "decisions" ? 3 : 4;
  }
  if (role === "founder" || role === "ceo") {
    return kind === "alerts" ? 6 : 5;
  }
  if (role === "school_leader") {
    return kind === "opportunities" ? 3 : 5;
  }
  return 5;
}

function defaultEmphasize(role: BriefingRole): string[] {
  switch (role) {
    case "founder":
      return ["wisdom", "strategy", "funding", "growth"];
    case "ceo":
      return ["finance", "operations", "human-capital", "customer"];
    case "school_leader":
      return ["human-capital", "customer", "operations", "cultural"];
    case "board":
      return ["finance", "compliance", "risk", "wisdom"];
    default:
      return [];
  }
}
