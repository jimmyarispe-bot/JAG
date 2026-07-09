import type { ReactNode } from "react";
import { ExecutiveCard } from "./ExecutiveCard";
import { PRESENTATION_ICON_BOX } from "./tokens";
import { DASHBOARD_BODY_CLASS } from "./tokens";

interface ExecutiveCycleCardProps {
  label: string;
  purpose: string;
  bullets: [string, string, string];
  icon: ReactNode;
}

export function ExecutiveCycleCard({ label, purpose, bullets, icon }: ExecutiveCycleCardProps) {
  return (
    <ExecutiveCard className="flex h-full flex-col">
      <div className="flex items-center gap-4">
        <div className={PRESENTATION_ICON_BOX}>{icon}</div>
        <h3 className="text-[30px] font-bold tracking-tight text-[#2F3DBD] sm:text-[34px]">{label}</h3>
      </div>
      <p className={`mt-5 font-medium ${DASHBOARD_BODY_CLASS}`}>
        <span className="text-[#64748B]">Purpose · </span>
        {purpose}
      </p>
      <ul className={`mt-4 space-y-3 ${DASHBOARD_BODY_CLASS}`}>
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-3">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2F3DBD]" aria-hidden />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </ExecutiveCard>
  );
}
