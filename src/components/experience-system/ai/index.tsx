"use client";

import Link from "next/link";
import { useState } from "react";
import { RecommendationCard } from "../cards";
import { ConfidenceIndicator } from "@/components/workspace-design-system/status/ConfidenceIndicator";
import { ConfirmDialog } from "../interaction";
import type { XesAiRecommendation, XesKnowledgeReference, XesRelatedEvidence } from "../types";
import { cn } from "@/components/workspace-design-system/utils";

export function AiRecommendationCard({
  recommendation,
  onApprove,
  onDismiss,
  requireApproval = false,
  className,
}: {
  recommendation: XesAiRecommendation;
  onApprove?: (id: string) => void;
  onDismiss?: (id: string) => void;
  requireApproval?: boolean;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className={cn("space-y-3", className)}>
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
              <button
                type="button"
                className="text-xs font-medium text-brand-600 hover:underline"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
              >
                {expanded ? "Hide explanation" : "Explain recommendation"}
              </button>
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
      <button type="button" className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700" onClick={onApprove}>
        {approveLabel}
      </button>
      {onDismiss && (
        <button type="button" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50" onClick={onDismiss}>
          {dismissLabel}
        </button>
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
              <Link href={item.href} className="text-brand-600 hover:underline">
                {item.title}
              </Link>
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
              <Link href={item.href} className="text-brand-600 hover:underline">
                {item.title}
              </Link>
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
