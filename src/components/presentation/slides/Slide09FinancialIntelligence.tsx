import { IntelligenceKpiContent } from "@/components/presentation/dashboard/IntelligenceKpiContent";
import { TemplateCExecutiveDashboard } from "@/components/presentation/templates";

const PRIMARY_KPIS = [
  { label: "Budget", value: "$4.2M", detail: "Operating budget · 98% expended YTD" },
  { label: "Cash Flow", value: "$312K", detail: "Positive 90-day cash position" },
  { label: "Forecast", value: "+2.1%", detail: "Year-end revenue projection vs. plan" },
  { label: "Grants", value: "$840K", detail: "Secured this fiscal year · 4 active awards" },
];

const SUPPORT_KPIS = [
  {
    label: "Capital",
    value: "$1.2M",
    detail: "Active capital projects",
    panelDetail: "2 projects underway · on schedule · within approved scope",
  },
  {
    label: "Fund Balance",
    value: "18.4%",
    detail: "Reserve ratio · board target 15%",
    panelDetail: "Unassigned fund balance healthy · 180-day runway maintained",
  },
];

export function Slide09FinancialIntelligence() {
  return (
    <TemplateCExecutiveDashboard phaseLabel="Learn" title="Financial Intelligence">
      <IntelligenceKpiContent
        primaryKpis={PRIMARY_KPIS}
        supportKpis={SUPPORT_KPIS}
        supportColumns={2}
      />
    </TemplateCExecutiveDashboard>
  );
}
