import { IntelligenceKpiContent } from "@/components/presentation/dashboard/IntelligenceKpiContent";
import { TemplateCExecutiveDashboard } from "@/components/presentation/templates";

const PRIMARY_KPIS = [
  { label: "Parent Engagement", value: "87%", detail: "Family participation rate · events & conferences" },
  { label: "Volunteerism", value: "1,240", detail: "Volunteer hours this year · 186 active volunteers" },
  { label: "Community Partnerships", value: "14", detail: "Active partnerships · schools & nonprofits" },
  { label: "Communications", value: "92%", detail: "Message open rate · weekly briefing delivered" },
];

const SUPPORT_KPIS = [
  {
    label: "PTO",
    value: "$48K",
    detail: "Funds raised this year · 100% allocated to programs",
    panelDetail: "Monthly meetings · 42 active members · event calendar on track",
  },
  {
    label: "Business Partnerships",
    value: "9",
    detail: "Local business sponsors · mentorship & internship paths",
    panelDetail: "Career speakers · supply drives · scholarship support active",
  },
];

export function Slide12CommunityIntelligence() {
  return (
    <TemplateCExecutiveDashboard phaseLabel="Listen · Learn" title="Community Intelligence">
      <IntelligenceKpiContent
        primaryKpis={PRIMARY_KPIS}
        supportKpis={SUPPORT_KPIS}
        supportColumns={2}
      />
    </TemplateCExecutiveDashboard>
  );
}
