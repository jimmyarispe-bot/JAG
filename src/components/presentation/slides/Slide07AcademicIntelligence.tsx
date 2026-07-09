import { IntelligenceKpiContent } from "@/components/presentation/dashboard/IntelligenceKpiContent";
import { TemplateCExecutiveDashboard } from "@/components/presentation/templates";

const PRIMARY_KPIS = [
  { label: "Achievement", value: "68%", detail: "Proficiency · ELA & Math combined" },
  { label: "Growth", value: "+6.2", detail: "Median learning gains · year over year" },
  { label: "Attendance", value: "96.2%", detail: "Average daily attendance · target 95%" },
  { label: "Intervention", value: "87%", detail: "Intervention effectiveness · active supports" },
];

const SUPPORT_KPIS = [
  {
    label: "MTSS",
    value: "142",
    detail: "Students on tiered support plans",
    panelDetail: "Tier 2 · 98 students · Tier 3 · 44 students",
  },
  {
    label: "FAST",
    value: "72%",
    detail: "On grade level · ELA",
    panelDetail: "Math on grade level · 69% · PM3 window complete",
  },
  {
    label: "Classroom Instruction",
    value: "94%",
    detail: "Walkthrough fidelity average",
    panelDetail: "Structured literacy rollout · on track",
  },
];

export function Slide07AcademicIntelligence() {
  return (
    <TemplateCExecutiveDashboard phaseLabel="Learn" title="Academic Intelligence">
      <IntelligenceKpiContent primaryKpis={PRIMARY_KPIS} supportKpis={SUPPORT_KPIS} />
    </TemplateCExecutiveDashboard>
  );
}
