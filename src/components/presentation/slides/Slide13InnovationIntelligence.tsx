import { IntelligenceKpiContent } from "@/components/presentation/dashboard/IntelligenceKpiContent";
import { TemplateCExecutiveDashboard } from "@/components/presentation/templates";

const PRIMARY_KPIS = [
  { label: "AI", value: "100%", detail: "Responsible AI policy adopted · staff trained" },
  { label: "Digital Learning", value: "1:1", detail: "Device ratio · LMS adoption 96%" },
  { label: "STEM", value: "84%", detail: "Student participation · cross-curricular pathways" },
  { label: "Robotics", value: "3", detail: "Active teams · 2 regional qualifiers" },
];

const SUPPORT_KPIS = [
  {
    label: "Future Ready Skills",
    value: "92%",
    detail: "Students on competency pathways",
    panelDetail: "Critical thinking · collaboration · digital literacy tracked",
  },
  {
    label: "Continuous Improvement",
    value: "18",
    detail: "Active improvement cycles this year",
    panelDetail: "PDSA cycles · pilot programs · evidence-based refinements",
  },
];

export function Slide13InnovationIntelligence() {
  return (
    <TemplateCExecutiveDashboard phaseLabel="Learn · Improve" title="Innovation Intelligence">
      <IntelligenceKpiContent
        primaryKpis={PRIMARY_KPIS}
        supportKpis={SUPPORT_KPIS}
        supportColumns={2}
      />
    </TemplateCExecutiveDashboard>
  );
}
