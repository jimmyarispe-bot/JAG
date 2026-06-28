import type { DecisionDefinition } from "@/lib/platform/decision/types";

/**
 * Reference decision definitions demonstrating the data-driven model.
 * These are domain-agnostic templates — consuming modules register their own.
 */
export const PLATFORM_REFERENCE_DECISION_DEFINITIONS: DecisionDefinition[] = [
  {
    decisionType: "ref_platform_escalation_priority",
    name: "Platform Escalation Priority",
    description: "Generic priority routing for operational escalations",
    domain: "platform",
    version: 1,
    status: "active",
    engineMode: "rule",
    sortOrder: 10,
    tags: ["platform", "escalation"],
    evidenceRequirements: [
      { key: "severity_score", label: "Severity Score", required: true, collectorKey: "input_field" },
      { key: "age_hours", label: "Age in Hours", required: false, collectorKey: "input_field" },
    ],
    rules: [
      {
        key: "critical_severity",
        label: "Critical Severity",
        conditions: [{ key: "sev", field: "severity_score", operator: "greater_than", value: 80 }],
        weight: 100,
        outcomeKey: "immediate_escalation",
        sortOrder: 10,
      },
      {
        key: "high_severity",
        label: "High Severity",
        conditions: [{ key: "sev", field: "severity_score", operator: "greater_than", value: 50 }],
        weight: 70,
        outcomeKey: "priority_escalation",
        sortOrder: 20,
      },
      {
        key: "standard",
        label: "Standard Queue",
        weight: 30,
        outcomeKey: "standard_queue",
        sortOrder: 30,
      },
    ],
    recommendationOptions: [
      {
        outcomeKey: "immediate_escalation",
        actionKey: "escalate_immediately",
        label: "Escalate Immediately",
        defaultPriority: "critical",
      },
      {
        outcomeKey: "priority_escalation",
        actionKey: "escalate_priority",
        label: "Priority Escalation",
        defaultPriority: "high",
      },
      {
        outcomeKey: "standard_queue",
        actionKey: "queue_standard",
        label: "Standard Queue",
        defaultPriority: "medium",
      },
    ],
    scoringProfile: {
      outcomeWeights: {
        immediate_escalation: 1.2,
        priority_escalation: 1.0,
        standard_queue: 0.8,
      },
      minimumScore: 10,
    },
  },
  {
    decisionType: "ref_platform_risk_signal",
    name: "Platform Risk Signal Assessment",
    description: "Generic risk signal triage using AI-assisted scoring heuristics",
    domain: "platform",
    version: 1,
    status: "active",
    engineMode: "ai_assisted",
    sortOrder: 20,
    tags: ["platform", "risk"],
    evidenceRequirements: [
      { key: "signal_strength", label: "Signal Strength", required: true, collectorKey: "input_field" },
      { key: "historical_pattern", label: "Historical Pattern Match", required: false, collectorKey: "input_field" },
    ],
    rules: [
      {
        key: "baseline_risk",
        label: "Baseline Risk Threshold",
        conditions: [{ key: "sig", field: "signal_strength", operator: "greater_than", value: 0 }],
        weight: 50,
        outcomeKey: "monitor",
        sortOrder: 10,
      },
    ],
    recommendationOptions: [
      {
        outcomeKey: "investigate",
        actionKey: "open_investigation",
        label: "Open Investigation",
        defaultPriority: "high",
      },
      {
        outcomeKey: "monitor",
        actionKey: "continue_monitoring",
        label: "Continue Monitoring",
        defaultPriority: "medium",
      },
      {
        outcomeKey: "dismiss",
        actionKey: "dismiss_signal",
        label: "Dismiss Signal",
        defaultPriority: "low",
      },
    ],
    scoringProfile: {
      outcomeWeights: {
        investigate: 1.1,
        monitor: 1.0,
        dismiss: 0.6,
      },
    },
  },
  {
    decisionType: "ref_platform_resource_allocation",
    name: "Platform Resource Allocation",
    description: "Hybrid rule + AI-assisted resource allocation template",
    domain: "operations",
    version: 1,
    status: "active",
    engineMode: "hybrid",
    sortOrder: 30,
    tags: ["operations", "resources"],
    evidenceRequirements: [
      { key: "demand_index", label: "Demand Index", required: true, collectorKey: "input_field" },
      { key: "capacity_remaining", label: "Capacity Remaining", required: true, collectorKey: "input_field" },
    ],
    rules: [
      {
        key: "over_capacity",
        label: "Over Capacity",
        conditions: [{ key: "cap", field: "capacity_remaining", operator: "less_than", value: 10 }],
        weight: 90,
        outcomeKey: "defer_allocation",
        sortOrder: 10,
      },
      {
        key: "high_demand",
        label: "High Demand",
        conditions: [{ key: "dem", field: "demand_index", operator: "greater_than", value: 70 }],
        weight: 75,
        outcomeKey: "allocate_priority",
        sortOrder: 20,
      },
      {
        key: "normal",
        label: "Normal Allocation",
        weight: 40,
        outcomeKey: "allocate_standard",
        sortOrder: 30,
      },
    ],
    recommendationOptions: [
      {
        outcomeKey: "allocate_priority",
        actionKey: "allocate_priority_resources",
        label: "Priority Allocation",
        defaultPriority: "high",
      },
      {
        outcomeKey: "allocate_standard",
        actionKey: "allocate_standard_resources",
        label: "Standard Allocation",
        defaultPriority: "medium",
      },
      {
        outcomeKey: "defer_allocation",
        actionKey: "defer_until_capacity",
        label: "Defer Allocation",
        defaultPriority: "low",
      },
    ],
  },
];
