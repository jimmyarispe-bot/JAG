import { DashboardPanel, SnapshotMetric } from "./DashboardPanel";
import { DASHBOARD_SECTION_CLASS } from "../tokens";

export interface PrimaryKpi {
  label: string;
  value: string;
  detail: string;
}

export interface SupportKpi {
  label: string;
  value: string;
  detail: string;
  panelDetail: string;
}

interface IntelligenceKpiContentProps {
  primaryKpis: PrimaryKpi[];
  supportKpis: SupportKpi[];
  supportColumns?: 2 | 3;
}

function SupportKpiPanel({ kpi }: { kpi: SupportKpi }) {
  return (
    <DashboardPanel title={kpi.label}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[32px] font-bold tracking-tight text-[#222222] sm:text-[36px]">{kpi.value}</p>
          <p className="mt-2 text-[20px] text-[#64748B] sm:text-[22px]">{kpi.detail}</p>
        </div>
        <div className="mt-1 h-10 w-1 shrink-0 rounded-full bg-[#2F3DBD] opacity-90" aria-hidden />
      </div>
      <p className="mt-4 border-t border-slate-100 pt-4 text-[20px] text-[#222222]/75 sm:text-[22px]">{kpi.panelDetail}</p>
    </DashboardPanel>
  );
}

export function IntelligenceKpiContent({
  primaryKpis,
  supportKpis,
  supportColumns = 3,
}: IntelligenceKpiContentProps) {
  const supportGridClass =
    supportColumns === 2 ? "mt-6 grid gap-6 sm:grid-cols-2" : "mt-6 grid gap-6 lg:grid-cols-3";

  return (
    <section>
      <p className={`mb-5 ${DASHBOARD_SECTION_CLASS}`}>KPIs</p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {primaryKpis.map((kpi) => (
          <SnapshotMetric key={kpi.label} label={kpi.label} value={kpi.value} detail={kpi.detail} />
        ))}
      </div>

      <div className={supportGridClass}>
        {supportKpis.map((kpi) => (
          <SupportKpiPanel key={kpi.label} kpi={kpi} />
        ))}
      </div>
    </section>
  );
}
