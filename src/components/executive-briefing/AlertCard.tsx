"use client";

import { BriefCard, type BriefCardProps } from "@/components/executive-briefing/BriefCard";
import type { AlertCard as AlertCardModel } from "@/lib/platform/intelligence/briefing";

export interface AlertCardProps extends Omit<BriefCardProps, "card"> {
  card: AlertCardModel;
}

export function AlertCard({ card, ...rest }: AlertCardProps) {
  return (
    <BriefCard
      card={{
        ...card,
        title: `${card.alertLevel.toUpperCase()} · ${card.title}`,
      }}
      {...rest}
    />
  );
}
