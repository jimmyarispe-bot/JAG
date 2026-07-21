"use client";

import type { DecisionCard } from "@/lib/edi/types";
import { DecisionCardPanel } from "@/components/edi/panels/DecisionCardPanel";

export function DecisionCardList({ cards, schoolId }: { cards: DecisionCard[]; schoolId: string }) {
  return (
    <div className="space-y-4">
      {cards.map((card) => (
        <DecisionCardPanel key={card.id ?? `${card.domain}-${card.recommendationType}-${card.entityKey}`} card={card} schoolId={schoolId} />
      ))}
      {!cards.length && (
        <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No recommendations yet. Run refresh to generate decision intelligence.
        </p>
      )}
    </div>
  );
}
