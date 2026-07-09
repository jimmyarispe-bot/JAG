import type { ReactNode } from "react";
import { ExecutiveCard } from "./ExecutiveCard";
import {
  PHILOSOPHY_CARD_BODY_CLASS,
  PHILOSOPHY_CARD_KEYWORD_CLASS,
  PRESENTATION_ICON_BOX,
} from "./tokens";

interface PhilosophyCardProps {
  keyword: string;
  sentence: string;
  icon: ReactNode;
}

/** Used by Template B slides only — not Slide 2 (LOCKED). */
export function PhilosophyCard({ keyword, sentence, icon }: PhilosophyCardProps) {
  return (
    <ExecutiveCard centered className="flex h-full flex-col items-center">
      <div className={PRESENTATION_ICON_BOX}>{icon}</div>
      <h3 className={PHILOSOPHY_CARD_KEYWORD_CLASS}>{keyword}</h3>
      <p className={PHILOSOPHY_CARD_BODY_CLASS}>{sentence}</p>
    </ExecutiveCard>
  );
}
