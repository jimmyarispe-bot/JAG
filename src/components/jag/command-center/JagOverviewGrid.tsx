import { JagCard } from "./JagCard";
import { JagSection } from "./JagSection";
import type { JagOverviewCardModel } from "./types";

export function JagOverviewGrid({
  cards,
}: {
  readonly cards: readonly JagOverviewCardModel[];
}) {
  return (
    <JagSection
      title="JAG Executive Command Center"
      description="Operational overview of organizations, domains, and intelligence services. Empty cards mean no live data is bound yet — nothing is fabricated."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {cards.map((card) => (
          <JagCard key={card.id} card={card} />
        ))}
      </div>
    </JagSection>
  );
}
