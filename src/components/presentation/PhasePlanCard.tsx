import type { ReactNode } from "react";
import { ExecutiveCard } from "./ExecutiveCard";
import { PRESENTATION_ICON_BOX } from "./tokens";
import { DASHBOARD_BODY_CLASS } from "./tokens";

interface PhasePlanCardProps {
  label: string;
  icon: ReactNode;
  objectives: string;
  actions: readonly [string, string, string];
  measures: readonly [string, string];
  timeline: string;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[18px] font-semibold tracking-[0.12em] text-[#64748B] uppercase sm:text-[20px]">{children}</p>
  );
}

function BulletItems({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-2">
      {items.map((item) => (
        <li key={item} className={`flex gap-2.5 ${DASHBOARD_BODY_CLASS}`}>
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2F3DBD]" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PhasePlanCard({
  label,
  icon,
  objectives,
  actions,
  measures,
  timeline,
}: PhasePlanCardProps) {
  return (
    <ExecutiveCard className="flex h-full flex-col">
      <div className="flex items-center gap-4">
        <div className={PRESENTATION_ICON_BOX}>{icon}</div>
        <h3 className="text-[30px] font-bold tracking-tight text-[#2F3DBD] sm:text-[34px]">{label}</h3>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <SectionLabel>Objectives</SectionLabel>
          <p className={`mt-2 ${DASHBOARD_BODY_CLASS}`}>{objectives}</p>
        </div>

        <div>
          <SectionLabel>Actions</SectionLabel>
          <BulletItems items={[...actions]} />
        </div>

        <div>
          <SectionLabel>Measures</SectionLabel>
          <BulletItems items={[...measures]} />
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 sm:px-5">
          <SectionLabel>Timeline</SectionLabel>
          <p className={`mt-2 font-medium ${DASHBOARD_BODY_CLASS}`}>{timeline}</p>
        </div>
      </div>
    </ExecutiveCard>
  );
}
