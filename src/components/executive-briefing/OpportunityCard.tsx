"use client";

import { BriefCard, type BriefCardProps } from "@/components/executive-briefing/BriefCard";
import type { OpportunityCard as OpportunityCardModel } from "@/lib/platform/intelligence/briefing";

export interface OpportunityCardProps extends Omit<BriefCardProps, "card"> {
  card: OpportunityCardModel;
}

export function OpportunityCard({ card, ...rest }: OpportunityCardProps) {
  return (
    <BriefCard
      card={{
        ...card,
        title: `${card.category.replace(/_/g, " ")} · ${card.title}`,
        summary: `${card.summary} (impact ${card.estimatedImpact})`,
      }}
      {...rest}
    />
  );
}
