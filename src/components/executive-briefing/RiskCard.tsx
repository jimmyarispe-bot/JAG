"use client";

import { BriefCard, type BriefCardProps } from "@/components/executive-briefing/BriefCard";
import type { RiskCard as RiskCardModel } from "@/lib/platform/intelligence/briefing";

export interface RiskCardProps extends Omit<BriefCardProps, "card"> {
  card: RiskCardModel;
}

export function RiskCard({ card, ...rest }: RiskCardProps) {
  return (
    <BriefCard
      card={{
        ...card,
        title: `[${card.status}] ${card.title}`,
      }}
      {...rest}
    />
  );
}
