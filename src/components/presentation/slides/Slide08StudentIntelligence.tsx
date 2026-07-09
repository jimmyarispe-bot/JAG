import { IntelligenceKpiContent } from "@/components/presentation/dashboard/IntelligenceKpiContent";
import { TemplateCExecutiveDashboard } from "@/components/presentation/templates";

const PRIMARY_KPIS = [
  { label: "Enrollment", value: "612", detail: "Active students · capacity 650" },
  { label: "Attendance", value: "96.2%", detail: "Average daily attendance · chronic absenteeism 8.1%" },
  { label: "Behavior", value: "2.4", detail: "Referrals per 100 students · down 12% YTD" },
  { label: "SEL", value: "91%", detail: "Survey participation · competency growth on track" },
];

const SUPPORT_KPIS = [
  {
    label: "ESE",
    value: "78",
    detail: "Students receiving ESE services",
    panelDetail: "100% IEP timeline compliance · inclusion rate 94%",
  },
  {
    label: "Student Voice",
    value: "340",
    detail: "Listening survey responses this term",
    panelDetail: "Student advisory council · monthly sessions active",
  },
  {
    label: "Student Leadership",
    value: "48",
    detail: "Student leaders across programs",
    panelDetail: "Ambassadors · peer mentors · club officers · 6 programs",
  },
];

export function Slide08StudentIntelligence() {
  return (
    <TemplateCExecutiveDashboard phaseLabel="Learn" title="Student Intelligence">
      <IntelligenceKpiContent primaryKpis={PRIMARY_KPIS} supportKpis={SUPPORT_KPIS} />
    </TemplateCExecutiveDashboard>
  );
}
