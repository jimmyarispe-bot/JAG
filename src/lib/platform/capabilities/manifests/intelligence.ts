/**
 * Phase II Intelligence capability manifests — Sprint 207.
 * Each capability registers once; workspace discovers via CapabilityLoader.
 */

import type { CapabilityManifest } from "../CapabilityManifest";
import { CAPABILITY_PERMISSION_PRESETS } from "../CapabilityPermissions";
import { parseCapabilityVersion } from "../CapabilityVersion";

const v = (raw: string) => parseCapabilityVersion(raw)!;

const readPerms = {
  required: [CAPABILITY_PERMISSION_PRESETS.executiveRead],
  optional: [CAPABILITY_PERMISSION_PRESETS.executiveAct],
};

function healthy(summary: string) {
  return {
    check: () => ({
      status: "healthy" as const,
      checkedAt: new Date().toISOString(),
      summary,
    }),
  };
}

export const PREDICTIVE_INTELLIGENCE_MANIFEST: CapabilityManifest = {
  id: "jag.intelligence.predictive",
  name: "Predictive Intelligence",
  version: v("1.0.0"),
  description: "Advisory forecasts of organizational conditions.",
  category: "intelligence",
  enabled: true,
  routes: [
    {
      id: "forecasts-overview",
      path: "/jag",
      label: "Forecasts (Overview)",
      description: "Forecast cards on executive overview.",
    },
  ],
  navigation: [],
  permissions: readPerms,
  dependencies: [],
  providers: {
    briefing: {
      sectionIds: ["forecast"],
      description: "Briefing Forecast section.",
    },
    conversation: {
      intents: ["forecasts_attention"],
      description: "Forecast attention questions.",
    },
    observability: {
      surfaceLabel: "Prediction operations",
      description: "Prediction run telemetry.",
    },
    health: healthy("Predictive engine available."),
    search: {
      listItems: () => [
        {
          id: "cap-search-forecasts",
          title: "Forecasts",
          subtitle: "Predictive Intelligence",
          href: "/jag",
          kind: "navigation",
        },
      ],
    },
  },
  featureFlags: { forecastsEnabled: true },
  metadata: {
    tags: ["forecast", "prediction"],
    owner: "jag-intelligence",
    sprint: "201",
    docsHref: "/docs/jag/201_PREDICTIVE_INTELLIGENCE.md",
  },
};

export const SCENARIO_PLANNING_MANIFEST: CapabilityManifest = {
  id: "jag.intelligence.scenarios",
  name: "Scenario Planning",
  version: v("1.0.0"),
  description: "Advisory what-if scenario projections.",
  category: "intelligence",
  enabled: true,
  routes: [
    {
      id: "scenarios",
      path: "/jag/scenarios",
      label: "Scenario Planner",
    },
  ],
  navigation: [
    {
      id: "scenarios",
      label: "Scenario Planner",
      href: "/jag/scenarios",
      order: 40,
      group: "intelligence",
    },
  ],
  permissions: readPerms,
  dependencies: [
    { capabilityId: "jag.intelligence.predictive", versionRange: ">=1.0.0", optional: true },
  ],
  providers: {
    briefing: {
      sectionIds: ["scenario_analysis"],
      description: "Briefing Scenario Analysis section.",
    },
    conversation: {
      intents: ["scenario_what_if", "delay_decision"],
      description: "What-if and delay questions.",
    },
    observability: {
      surfaceLabel: "Scenario operations",
      description: "Scenario run telemetry.",
    },
    health: healthy("Scenario planner available."),
  },
  featureFlags: { scenarioPlannerEnabled: true },
  metadata: {
    tags: ["scenario", "what-if"],
    owner: "jag-intelligence",
    sprint: "202",
    docsHref: "/docs/jag/202_SCENARIO_PLANNING.md",
  },
};

export const EXECUTIVE_CONVERSATION_MANIFEST: CapabilityManifest = {
  id: "jag.intelligence.conversation",
  name: "Executive Conversation",
  version: v("1.0.0"),
  description: "Evidence-grounded executive Q&A — not a chatbot.",
  category: "intelligence",
  enabled: true,
  routes: [
    { id: "chat", path: "/jag/chat", label: "Conversation" },
  ],
  navigation: [
    {
      id: "chat",
      label: "Conversation",
      href: "/jag/chat",
      order: 10,
      group: "primary",
    },
  ],
  permissions: readPerms,
  dependencies: [
    { capabilityId: "jag.intelligence.predictive", versionRange: ">=1.0.0", optional: true },
    { capabilityId: "jag.intelligence.scenarios", versionRange: ">=1.0.0", optional: true },
  ],
  providers: {
    conversation: {
      intents: [
        "organization_health",
        "what_changed",
        "highest_risk",
        "general_status",
        "follow_up",
        "search",
      ],
      description: "Core executive conversation intents.",
    },
    observability: {
      surfaceLabel: "Conversation operations",
      description: "Conversation turn telemetry.",
    },
    health: healthy("Conversation engine available."),
  },
  featureFlags: { conversationEnabled: true },
  metadata: {
    tags: ["conversation", "chat"],
    owner: "jag-intelligence",
    sprint: "203",
    docsHref: "/docs/jag/203_EXECUTIVE_CONVERSATION.md",
  },
};

export const ORGANIZATIONAL_MEMORY_MANIFEST: CapabilityManifest = {
  id: "jag.intelligence.memory",
  name: "Organizational Memory",
  version: v("1.0.0"),
  description: "Institutional memory — decisions, outcomes, lessons.",
  category: "intelligence",
  enabled: true,
  routes: [
    { id: "memory", path: "/jag/memory", label: "Organizational Memory" },
  ],
  navigation: [
    {
      id: "memory",
      label: "Memory",
      href: "/jag/memory",
      order: 50,
      group: "intelligence",
    },
  ],
  permissions: readPerms,
  dependencies: [],
  providers: {
    briefing: {
      sectionIds: ["historical_context"],
      description: "Briefing Historical Context section.",
    },
    conversation: {
      intents: ["historical_memory"],
      description: "Have we seen this before / lessons.",
    },
    observability: {
      surfaceLabel: "Memory operations",
      description: "Memory creation and retrieval telemetry.",
    },
    health: healthy("Organizational memory available."),
  },
  featureFlags: { memoryEnabled: true },
  metadata: {
    tags: ["memory", "lessons"],
    owner: "jag-intelligence",
    sprint: "204",
    docsHref: "/docs/jag/204_ORGANIZATIONAL_MEMORY.md",
  },
};

export const STRATEGIC_INTELLIGENCE_MANIFEST: CapabilityManifest = {
  id: "jag.intelligence.strategy",
  name: "Strategic Intelligence",
  version: v("1.0.0"),
  description: "Mission, pillars, goals, and alignment.",
  category: "intelligence",
  enabled: true,
  routes: [
    { id: "strategy", path: "/jag/strategy", label: "Strategic Intelligence" },
  ],
  navigation: [
    {
      id: "strategy",
      label: "Strategy",
      href: "/jag/strategy",
      order: 55,
      group: "intelligence",
    },
  ],
  permissions: readPerms,
  dependencies: [
    { capabilityId: "jag.intelligence.memory", versionRange: ">=1.0.0", optional: true },
  ],
  providers: {
    briefing: {
      sectionIds: ["strategic_alignment"],
      description: "Briefing Strategic Alignment section.",
    },
    conversation: {
      intents: ["strategic_alignment"],
      description: "Mission and goal progress questions.",
    },
    observability: {
      surfaceLabel: "Strategy operations",
      description: "Goal evaluation and scorecard telemetry.",
    },
    health: healthy("Strategic intelligence available."),
  },
  featureFlags: { strategyEnabled: true },
  metadata: {
    tags: ["strategy", "mission", "goals"],
    owner: "jag-intelligence",
    sprint: "205",
    docsHref: "/docs/jag/205_STRATEGIC_INTELLIGENCE.md",
  },
};

export const AUTONOMOUS_WATCHERS_MANIFEST: CapabilityManifest = {
  id: "jag.intelligence.watchers",
  name: "Autonomous Executive Intelligence",
  version: v("1.0.0"),
  description:
    "Proactive watchers and executive inbox. Never executes decisions.",
  category: "intelligence",
  enabled: true,
  routes: [
    { id: "inbox", path: "/jag/inbox", label: "Executive Inbox" },
  ],
  navigation: [
    {
      id: "inbox",
      label: "Inbox",
      href: "/jag/inbox",
      order: 15,
      group: "primary",
    },
  ],
  permissions: {
    required: [CAPABILITY_PERMISSION_PRESETS.executiveRead],
    optional: [CAPABILITY_PERMISSION_PRESETS.executiveAct],
  },
  dependencies: [
    { capabilityId: "jag.intelligence.strategy", versionRange: ">=1.0.0", optional: true },
    { capabilityId: "jag.intelligence.memory", versionRange: ">=1.0.0", optional: true },
    { capabilityId: "jag.intelligence.predictive", versionRange: ">=1.0.0", optional: true },
    { capabilityId: "jag.decisions.center", versionRange: ">=1.0.0", optional: true },
  ],
  providers: {
    watcher: {
      watcherTypes: [
        "strategic_risk",
        "operational_risk",
        "funding_risk",
        "enrollment_risk",
        "compliance_risk",
        "decision_risk",
        "forecast_drift",
        "goal_drift",
        "opportunity_detection",
        "executive_attention",
      ],
      description: "Built-in executive watchers.",
    },
    conversation: {
      intents: ["executive_attention"],
      description: "What deserves my attention / emerging risk.",
    },
    observability: {
      surfaceLabel: "Watcher operations",
      description: "Watcher execution and alert lifecycle.",
    },
    health: healthy("Watchers and inbox available."),
  },
  featureFlags: { inboxEnabled: true, digestsEnabled: true },
  metadata: {
    tags: ["watchers", "inbox", "alerts"],
    owner: "jag-intelligence",
    sprint: "206",
    docsHref: "/docs/jag/206_AUTONOMOUS_EXECUTIVE_INTELLIGENCE.md",
  },
};

export const DECISION_CENTER_MANIFEST: CapabilityManifest = {
  id: "jag.decisions.center",
  name: "Decision Intelligence",
  version: v("1.0.0"),
  description: "Decision Center — queue, execution, outcomes.",
  category: "intelligence",
  enabled: true,
  routes: [
    { id: "decisions", path: "/jag/decisions", label: "Decision Center" },
  ],
  navigation: [
    {
      id: "decisions",
      label: "Decision Center",
      href: "/jag/decisions",
      order: 20,
      group: "primary",
    },
  ],
  permissions: {
    required: [CAPABILITY_PERMISSION_PRESETS.executiveRead],
    optional: [CAPABILITY_PERMISSION_PRESETS.executiveAct],
  },
  dependencies: [],
  providers: {
    conversation: {
      intents: ["decide_today", "overdue_decisions", "high_confidence_recommendations"],
      description: "Decision queue conversation intents.",
    },
    briefing: {
      sectionIds: ["decide_today", "decision_queue_summary", "completed_outcomes"],
      description: "Decision-linked briefing sections.",
    },
    observability: {
      surfaceLabel: "Decision audit",
      description: "Decision action audit trail.",
    },
    health: healthy("Decision Center available."),
  },
  featureFlags: { decisionCenterEnabled: true },
  metadata: {
    tags: ["decisions", "execution"],
    owner: "jag-intelligence",
    sprint: "003",
  },
};

export const EXECUTIVE_BRIEFINGS_MANIFEST: CapabilityManifest = {
  id: "jag.intelligence.briefings",
  name: "Executive Briefings",
  version: v("1.0.0"),
  description: "Structured executive briefing synthesis.",
  category: "intelligence",
  enabled: true,
  routes: [
    { id: "briefings", path: "/jag/briefings", label: "Executive Briefings" },
  ],
  navigation: [
    {
      id: "briefings",
      label: "Executive Briefings",
      href: "/jag/briefings",
      order: 30,
      group: "primary",
    },
  ],
  permissions: readPerms,
  dependencies: [
    { capabilityId: "jag.decisions.center", versionRange: ">=1.0.0", optional: true },
    { capabilityId: "jag.intelligence.predictive", versionRange: ">=1.0.0", optional: true },
  ],
  providers: {
    briefing: {
      sectionIds: [
        "executive_summary",
        "what_happened",
        "why_it_happened",
        "recommended_executive_actions",
        "executive_insights",
      ],
      description: "Core briefing sections.",
    },
    conversation: {
      intents: ["briefings"],
      description: "Briefing retrieval questions.",
    },
    observability: {
      surfaceLabel: "Briefing generation",
      description: "Briefing generate/share audit.",
    },
    health: healthy("Briefing engine available."),
  },
  featureFlags: { briefingsEnabled: true },
  metadata: {
    tags: ["briefings"],
    owner: "jag-intelligence",
    sprint: "005",
  },
};

export const EXPLAINABILITY_GRAPH_MANIFEST: CapabilityManifest = {
  id: "jag.intelligence.explainability",
  name: "Explainability & Graph Explorer",
  version: v("1.0.0"),
  description:
    "Reasoning chains, evidence, confidence, and the Intelligence Graph Explorer.",
  category: "intelligence",
  enabled: true,
  routes: [
    { id: "graph", path: "/jag/graph", label: "Intelligence Graph" },
  ],
  navigation: [
    {
      id: "graph",
      label: "Graph",
      href: "/jag/graph",
      order: 18,
      group: "intelligence",
    },
  ],
  permissions: readPerms,
  dependencies: [
    { capabilityId: "jag.intelligence.strategy", versionRange: ">=1.0.0", optional: true },
    { capabilityId: "jag.intelligence.memory", versionRange: ">=1.0.0", optional: true },
    { capabilityId: "jag.intelligence.watchers", versionRange: ">=1.0.0", optional: true },
    { capabilityId: "jag.decisions.center", versionRange: ">=1.0.0", optional: true },
  ],
  providers: {
    conversation: {
      intents: ["explainability"],
      description: "Why / evidence / assumptions / reasoning questions.",
    },
    observability: {
      surfaceLabel: "Explainability operations",
      description: "Explanation generation, graph queries, evidence lookup.",
    },
    health: healthy("Explainability and graph explorer available."),
    search: {
      listItems: () => [
        {
          id: "cap-search-graph",
          title: "Intelligence Graph",
          subtitle: "Explainability · reasoning map",
          href: "/jag/graph",
          kind: "navigation",
        },
        {
          id: "cap-search-reasoning",
          title: "Reasoning chains",
          subtitle: "Explainability",
          href: "/jag/graph",
          kind: "navigation",
        },
        {
          id: "cap-search-evidence-explain",
          title: "Evidence explorer",
          subtitle: "Explainability · evidence",
          href: "/jag/graph?kind=evidence",
          kind: "navigation",
        },
      ],
    },
  },
  featureFlags: { graphEnabled: true, explainPanelEnabled: true },
  metadata: {
    tags: ["explainability", "graph", "reasoning", "evidence"],
    owner: "jag-intelligence",
    sprint: "208",
    docsHref: "/docs/jag/208_EXPLAINABILITY_GRAPH_EXPLORER.md",
  },
};

export const LISTENING_INTELLIGENCE_MANIFEST: CapabilityManifest = {
  id: "jag.intelligence.listening",
  name: "Listening Intelligence",
  version: v("1.1.0"),
  description:
    "Author listening instruments and review evidence-backed organizational signals.",
  category: "intelligence",
  enabled: true,
  routes: [
    { id: "listening", path: "/jag/listening", label: "Listening" },
    {
      id: "listening-intelligence",
      path: "/jag/listening/intelligence",
      label: "Listening Intelligence",
    },
  ],
  navigation: [
    {
      id: "listening",
      label: "Listening",
      href: "/jag/listening",
      order: 25,
      group: "intelligence",
    },
    {
      id: "listening-intelligence",
      label: "Listening Intelligence",
      href: "/jag/listening/intelligence",
      order: 26,
      group: "intelligence",
    },
  ],
  permissions: readPerms,
  dependencies: [],
  providers: {
    observability: {
      surfaceLabel: "Listening intelligence",
      description:
        "Authoring plus deterministic analysis workbench (signals, evidence, metrics).",
    },
    health: healthy("Listening authoring and intelligence workbench available."),
    search: {
      listItems: () => [
        {
          id: "cap-search-listening",
          title: "Listening",
          subtitle: "Initiatives · instruments · campaigns",
          href: "/jag/listening",
          kind: "navigation",
        },
        {
          id: "cap-search-listening-intelligence",
          title: "Listening Intelligence",
          subtitle: "Signals · evidence · metrics",
          href: "/jag/listening/intelligence",
          kind: "navigation",
        },
      ],
    },
  },
  featureFlags: {
    listeningAuthoringEnabled: true,
    listeningIntelligenceWorkbenchEnabled: true,
  },
  metadata: {
    tags: ["listening", "survey", "campaign", "authoring", "intelligence"],
    owner: "jag-intelligence",
    sprint: "4.1",
  },
};

export const PHASE_II_INTELLIGENCE_MANIFESTS: readonly CapabilityManifest[] = [
  PREDICTIVE_INTELLIGENCE_MANIFEST,
  SCENARIO_PLANNING_MANIFEST,
  EXECUTIVE_CONVERSATION_MANIFEST,
  ORGANIZATIONAL_MEMORY_MANIFEST,
  STRATEGIC_INTELLIGENCE_MANIFEST,
  AUTONOMOUS_WATCHERS_MANIFEST,
  DECISION_CENTER_MANIFEST,
  EXECUTIVE_BRIEFINGS_MANIFEST,
  EXPLAINABILITY_GRAPH_MANIFEST,
  LISTENING_INTELLIGENCE_MANIFEST,
];
