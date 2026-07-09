import type { ReactNode } from "react";
import { DASHBOARD_BODY_CLASS, DASHBOARD_PANEL_TITLE_CLASS, PRESENTATION_DASHBOARD_PANEL } from "../tokens";

interface DashboardPanelProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function DashboardPanel({ title, children, className }: DashboardPanelProps) {
  return (
    <article className={`${PRESENTATION_DASHBOARD_PANEL} ${className ?? ""}`}>
      <h3 className={DASHBOARD_PANEL_TITLE_CLASS}>{title}</h3>
      <div className={`mt-4 ${DASHBOARD_BODY_CLASS}`}>{children}</div>
    </article>
  );
}

interface SnapshotMetricProps {
  label: string;
  value: string;
  detail: string;
}

export function SnapshotMetric({ label, value, detail }: SnapshotMetricProps) {
  return (
    <article className={`relative overflow-hidden ${PRESENTATION_DASHBOARD_PANEL}`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-[#2F3DBD] opacity-90" aria-hidden />
      <p className="text-[20px] font-normal text-[#64748B] sm:text-[22px]">{label}</p>
      <p className="mt-2 text-[32px] font-bold tracking-tight text-[#222222] sm:text-[36px]">{value}</p>
      <p className="mt-2 text-[20px] font-normal text-[#64748B] sm:text-[22px]">{detail}</p>
    </article>
  );
}
