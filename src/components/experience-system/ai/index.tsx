"use client";

import { useState } from "react";
import { RecommendationCard } from "../cards";
import { ConfidenceIndicator } from "@/components/workspace-design-system/status/ConfidenceIndicator";
import { ConfirmDialog } from "../interaction";
import type { XesAiRecommendation, XesKnowledgeReference, XesRelatedEvidence } from "../types";
import { cn } from "@/components/workspace-design-system/utils";
import { ActionButton } from "@/components/experience-system/feedback/ActionButton";
import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import { AiActivity } from "@/components/experience-system/feedback/AiActivity";

export function AiRecommendationCard({
  recommendation,
  onApprove,
  onDismiss,
  requireApproval = false,
  analyzing = false,
  className,
}: {
  recommendation: XesAiRecommendation;
  onApprove?: (id: string) => void;
  onDismiss?: (id: string) => void;
  requireApproval?: boolean;
  /** UX-004 — show rotating AI activity while recommendation work is in flight. */
  analyzing?: boolean;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className={cn("space-y-3", className)}>
      <AiActivity
        active={analyzing}
        phases={[
          "Thinking…",
          "Analyzing…",
          "Reviewing admissions…",
          "Building executive brief…",
          "Generating forecast…",
        ]}
      />
      <RecommendationCard
        title={recommendation.title}
        rationale={recommendation.rationale}
        priority={recommendation.priority}
        actionLabel={recommendation.actionLabel}
        actionHref={requireApproval ? undefined : recommendation.actionHref}
        footer={
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              {recommendation.confidence !== undefined && (
                <ConfidenceIndicator value={recommendation.confidence} label="Confidence" />
              )}
              <ActionChip
                size="sm"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
              >
                {expanded ? "Hide explanation" : "Explain recommendation"}
              </ActionChip>
            </div>
            {expanded && (
              <ExplainRecommendation
                rationale={recommendation.rationale}
                evidence={recommendation.evidence}
                knowledge={recommendation.knowledge}
              />
            )}
            {requireApproval && (onApprove || onDismiss) && (
              <HumanApprovalGate
                onApprove={() => setConfirmOpen(true)}
                onDismiss={() => onDismiss?.(recommendation.id)}
              />
            )}
          </div>
        }
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Approve recommendation"
        message={`Apply "${recommendation.title}"? This action will proceed with human approval on record.`}
        confirmLabel="Approve"
        onConfirm={() => {
          setConfirmOpen(false);
          onApprove?.(recommendation.id);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

export function ExplainRecommendation({
  rationale,
  evidence,
  knowledge,
}: {
  rationale: string;
  evidence?: XesRelatedEvidence[];
  knowledge?: XesKnowledgeReference[];
}) {
  return (
    <div className="rounded-xl bg-violet-50/50 p-3 text-sm text-slate-700">
      <p>{rationale}</p>
      {evidence && evidence.length > 0 && <RelatedEvidenceList items={evidence} className="mt-3" />}
      {knowledge && knowledge.length > 0 && <KnowledgeReferenceList items={knowledge} className="mt-3" />}
    </div>
  );
}

export function HumanApprovalGate({
  onApprove,
  onDismiss,
  approveLabel = "Approve",
  dismissLabel = "Dismiss",
}: {
  onApprove: () => void;
  onDismiss?: () => void;
  approveLabel?: string;
  dismissLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
      <ActionButton type="button" variant="success" size="sm" onClick={onApprove}>
        {approveLabel}
      </ActionButton>
      {onDismiss && (
        <ActionButton type="button" variant="ghost" size="sm" onClick={onDismiss}>
          {dismissLabel}
        </ActionButton>
      )}
    </div>
  );
}

export function RelatedEvidenceList({ items, className }: { items: XesRelatedEvidence[]; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Related evidence</p>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            {item.href ? (
              <ActionChip href={item.href} size="sm">
                {item.title}
              </ActionChip>
            ) : (
              <span>{item.title}</span>
            )}
            {item.artifactType && <span className="ml-1 text-xs text-slate-400">({item.artifactType})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function KnowledgeReferenceList({ items, className }: { items: XesKnowledgeReference[]; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source knowledge</p>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li key={item.id} className="text-sm">
            {item.href ? (
              <ActionChip href={item.href} size="sm">
                {item.title}
              </ActionChip>
            ) : (
              <span>{item.title}</span>
            )}
            {item.layerKind && <span className="ml-1 text-xs text-slate-400">· {item.layerKind}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AiRecommendationList({
  recommendations,
  knowledge,
  requireApproval,
  onApprove,
}: {
  recommendations: XesAiRecommendation[];
  knowledge?: XesKnowledgeReference[];
  requireApproval?: boolean;
  onApprove?: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {recommendations.map((rec) => (
        <AiRecommendationCard
          key={rec.id}
          recommendation={{
            ...rec,
            knowledge: rec.knowledge ?? knowledge,
          }}
          requireApproval={requireApproval}
          onApprove={onApprove}
        />
      ))}
    </div>
  );
}
