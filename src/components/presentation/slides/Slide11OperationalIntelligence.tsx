import { IntelligenceKpiContent } from "@/components/presentation/dashboard/IntelligenceKpiContent";
import { TemplateCExecutiveDashboard } from "@/components/presentation/templates";

const PRIMARY_KPIS = [
  { label: "Facilities", value: "98%", detail: "Building readiness score · all zones operational" },
  { label: "Transportation", value: "99.1%", detail: "On-time route performance · 8 active routes" },
  { label: "Technology", value: "100%", detail: "Device availability · network uptime 99.8%" },
  { label: "Safety", value: "0", detail: "Critical incidents YTD · drills 100% complete" },
];

const SUPPORT_KPIS = [
  {
    label: "Compliance",
    value: "3",
    detail: "Open compliance alerts · 12 resolved YTD",
    panelDetail: "Annual reports on schedule · audit readiness confirmed",
  },
  {
    label: "Maintenance",
    value: "94%",
    detail: "Work orders closed within SLA",
    panelDetail: "12 open requests · priority items tracked daily",
  },
];

export function Slide11OperationalIntelligence() {
  return (
    <TemplateCExecutiveDashboard phaseLabel="Learn · Lead" title="Operational Intelligence">
      <IntelligenceKpiContent
        primaryKpis={PRIMARY_KPIS}
        supportKpis={SUPPORT_KPIS}
        supportColumns={2}
      />
    </TemplateCExecutiveDashboard>
  );
}
