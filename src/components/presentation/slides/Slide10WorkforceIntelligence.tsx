import { IntelligenceKpiContent } from "@/components/presentation/dashboard/IntelligenceKpiContent";
import { TemplateCExecutiveDashboard } from "@/components/presentation/templates";

const PRIMARY_KPIS = [
  { label: "Teacher Retention", value: "94%", detail: "Annual retention rate · target 92%" },
  { label: "Hiring", value: "3", detail: "Open positions · 2 offers extended" },
  { label: "Professional Learning", value: "128", detail: "PL hours completed · 100% compliance" },
  { label: "Evaluations", value: "100%", detail: "Observation cycle complete · on schedule" },
];

const SUPPORT_KPIS = [
  {
    label: "Recognition",
    value: "36",
    detail: "Staff recognized this quarter",
    panelDetail: "Spotlight awards · peer nominations · milestone celebrations active",
  },
  {
    label: "Culture",
    value: "4.6",
    detail: "Staff climate survey · out of 5.0",
    panelDetail: "Trust, collaboration, and support scores above district average",
  },
];

export function Slide10WorkforceIntelligence() {
  return (
    <TemplateCExecutiveDashboard phaseLabel="Learn" title="Workforce Intelligence">
      <IntelligenceKpiContent
        primaryKpis={PRIMARY_KPIS}
        supportKpis={SUPPORT_KPIS}
        supportColumns={2}
      />
    </TemplateCExecutiveDashboard>
  );
}
