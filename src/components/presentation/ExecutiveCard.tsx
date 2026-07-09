import type { ReactNode } from "react";
import { PRESENTATION_CARD, PRESENTATION_CARD_ACCENT } from "./tokens";

interface ExecutiveCardProps {
  children: ReactNode;
  className?: string;
  centered?: boolean;
}

export function ExecutiveCard({ children, className = "", centered = false }: ExecutiveCardProps) {
  return (
    <article
      className={`${PRESENTATION_CARD} ${centered ? "flex flex-col items-center text-center" : ""} ${className}`.trim()}
    >
      <div className={PRESENTATION_CARD_ACCENT} aria-hidden />
      {children}
    </article>
  );
}
