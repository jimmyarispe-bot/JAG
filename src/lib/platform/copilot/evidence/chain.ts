/**
 * Evidence chain builder — AcademyOS → QB → Square → Plaid → Workspace → Intelligence → Reasoning → Recommendation.
 * Never invents connector facts; missing systems are explicitly marked ungrounded.
 */

import {
  EVIDENCE_SYSTEMS,
  type ConnectorSystemSnapshot,
  type CopilotContext,
  type EvidenceChain,
  type EvidenceItem,
  type EvidenceSystem,
  type IntelligenceSnapshot,
} from "../types";

function item(
  partial: Omit<EvidenceItem, "id"> & { id?: string }
): EvidenceItem {
  return {
    id: partial.id ?? `${partial.system}-${partial.label}`.replace(/\s+/g, "-").toLowerCase(),
    system: partial.system,
    label: partial.label,
    statement: partial.statement,
    grounded: partial.grounded,
    metric: partial.metric,
    value: partial.value,
    syncedAt: partial.syncedAt ?? null,
    refs: partial.refs,
  };
}

export function connectorEvidence(connectors: ConnectorSystemSnapshot[]): EvidenceItem[] {
  return connectors.map((c) => {
    if (!c.connected) {
      return item({
        system: c.system,
        label: `${c.system} not connected`,
        statement: `${c.system} feed is not available in this session — no evidence cited from this system.`,
        grounded: false,
        syncedAt: null,
      });
    }
    const primary = c.bullets[0] ?? `${c.system} connected with no brief bullets.`;
    const metric = c.metrics[0];
    return item({
      system: c.system,
      label: `${c.system} signal`,
      statement: primary,
      grounded: true,
      syncedAt: c.syncedAt,
      metric: metric?.key,
      value: metric?.value ?? null,
      refs: c.bullets.slice(0, 3),
    });
  });
}

export function intelligenceEvidence(intel: IntelligenceSnapshot): EvidenceItem[] {
  const domains = intel.domainsUsed.length
    ? intel.domainsUsed.join(", ")
    : "none reported";
  return [
    item({
      system: "intelligence-domains",
      label: "Intelligence domains consulted",
      statement: intel.wisdomHeadline
        ? `Domains [${domains}]. Wisdom: ${intel.wisdomHeadline}`
        : `Domains [${domains}] consulted; no wisdom headline available.`,
      grounded: intel.domainsUsed.length > 0,
      refs: [
        ...intel.opportunityHeadlines.slice(0, 2),
        ...intel.riskHeadlines.slice(0, 2),
      ],
    }),
  ];
}

export function reasoningEvidence(
  intel: IntelligenceSnapshot,
  reasoningText?: string
): EvidenceItem {
  const judgment = intel.judgment;
  const statement =
    reasoningText ??
    judgment?.why ??
    judgment?.whatLeadershipShouldDo ??
    "Reasoning deferred — insufficient grounded judgment from wisdom stack.";
  return item({
    system: "reasoning",
    label: "Executive reasoning",
    statement,
    grounded: Boolean(judgment || reasoningText),
    refs: judgment
      ? [judgment.why, judgment.whyNow, judgment.assumptions].filter(Boolean)
      : undefined,
  });
}

export function recommendationEvidence(
  title: string,
  action: string,
  grounded: boolean
): EvidenceItem {
  return item({
    system: "recommendation",
    label: title,
    statement: action,
    grounded,
  });
}

export function buildEvidenceChain(input: {
  connectors: ConnectorSystemSnapshot[];
  intelligence: IntelligenceSnapshot;
  recommendationTitle: string;
  recommendationAction: string;
  reasoningText?: string;
  generatedAt?: string;
}): EvidenceChain {
  const links: EvidenceItem[] = [
    ...connectorEvidence(input.connectors),
    ...intelligenceEvidence(input.intelligence),
    reasoningEvidence(input.intelligence, input.reasoningText),
    recommendationEvidence(
      input.recommendationTitle,
      input.recommendationAction,
      Boolean(input.intelligence.judgment || input.intelligence.recommendations.length)
    ),
  ];

  // Preserve canonical order even if connectors arrive shuffled.
  const order = new Map(EVIDENCE_SYSTEMS.map((s, i) => [s, i]));
  links.sort((a, b) => (order.get(a.system) ?? 99) - (order.get(b.system) ?? 99));

  const systemsPresent = [
    ...new Set(links.filter((l) => l.grounded).map((l) => l.system)),
  ] as EvidenceSystem[];
  const systemsMissing = EVIDENCE_SYSTEMS.filter((s) => !systemsPresent.includes(s));
  const groundedCount = links.filter((l) => l.grounded).length;

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    links,
    systemsPresent,
    systemsMissing,
    groundedCount,
    ungroundedCount: links.length - groundedCount,
  };
}

export function buildEvidenceChainFromContext(
  context: CopilotContext,
  recommendationTitle: string,
  recommendationAction: string,
  reasoningText?: string
): EvidenceChain {
  return buildEvidenceChain({
    connectors: context.connectors,
    intelligence: context.intelligence,
    recommendationTitle,
    recommendationAction,
    reasoningText,
    generatedAt: context.generatedAt,
  });
}
