/**
 * WatcherRegistry — built-in watcher rules — Sprint 206.
 */

import {
  WATCHER_TYPE_LABELS,
  type WatcherRule,
  type WatcherType,
} from "./WatcherRule";

function rule(
  type: WatcherType,
  defaultPriority: WatcherRule["defaultPriority"],
  threshold: number,
  scheduleHint: WatcherRule["scheduleHint"],
  description: string
): WatcherRule {
  return {
    id: `watcher-${type}`,
    type,
    label: WATCHER_TYPE_LABELS[type],
    description,
    enabled: true,
    defaultPriority,
    threshold,
    scheduleHint,
  };
}

const BUILTIN: readonly WatcherRule[] = [
  rule(
    "strategic_risk",
    "high",
    0.45,
    "continuous",
    "Detect strategic goal / mission risks."
  ),
  rule(
    "operational_risk",
    "high",
    0.5,
    "continuous",
    "Detect operational readiness pressure."
  ),
  rule(
    "funding_risk",
    "critical",
    0.4,
    "morning",
    "Detect funding readiness and budget pressure."
  ),
  rule(
    "enrollment_risk",
    "high",
    0.45,
    "weekly",
    "Detect enrollment decline or capacity stress signals."
  ),
  rule(
    "compliance_risk",
    "high",
    0.45,
    "weekly",
    "Detect compliance posture risks."
  ),
  rule(
    "decision_risk",
    "critical",
    0.4,
    "continuous",
    "Detect overdue or high-risk open decisions."
  ),
  rule(
    "forecast_drift",
    "medium",
    0.45,
    "afternoon",
    "Detect declining forecast confidence or adverse trends."
  ),
  rule(
    "goal_drift",
    "high",
    0.4,
    "morning",
    "Detect goals projected to miss targets."
  ),
  rule(
    "opportunity_detection",
    "medium",
    0.5,
    "weekly",
    "Detect positive opportunities worth executive attention."
  ),
  rule(
    "executive_attention",
    "medium",
    0.35,
    "continuous",
    "Surface meaningful executive attention items."
  ),
  rule(
    "custom",
    "informational",
    0.6,
    "continuous",
    "Custom watcher slot for org-specific rules."
  ),
];

const customRules: WatcherRule[] = [];

export const WatcherRegistry = {
  list(): readonly WatcherRule[] {
    return [...BUILTIN, ...customRules].filter((r) => r.enabled);
  },

  all(): readonly WatcherRule[] {
    return [...BUILTIN, ...customRules];
  },

  get(id: string): WatcherRule | null {
    return this.all().find((r) => r.id === id) ?? null;
  },

  getByType(type: WatcherType): WatcherRule | null {
    return this.all().find((r) => r.type === type) ?? null;
  },

  register(ruleInput: WatcherRule): WatcherRule {
    const idx = customRules.findIndex((r) => r.id === ruleInput.id);
    if (idx >= 0) customRules[idx] = ruleInput;
    else customRules.push(ruleInput);
    return ruleInput;
  },

  resetForTests(): void {
    customRules.length = 0;
  },
} as const;
