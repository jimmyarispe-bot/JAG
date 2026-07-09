import { PhasePlanCard } from "@/components/presentation/PhasePlanCard";
import { ImproveIcon, LeadIcon, LearnIcon, ListenIcon } from "@/components/presentation/PresentationIcons";
import { TemplateBExecutiveContent } from "@/components/presentation/templates";
import { TEMPLATE_CARD_GRID_2X2 } from "@/components/presentation/tokens";

const PHASE_PLANS = [
  {
    label: "Listen",
    icon: <ListenIcon />,
    objectives: "Establish trust by hearing every stakeholder voice before setting direction.",
    actions: [
      "Launch the Executive Listening Initiative",
      "Meet with department leads and grade-level teams",
      "Host community and family listening sessions",
    ] as [string, string, string],
    measures: ["Response volume across six stakeholder groups", "Theme identification from Executive Listening Intelligence"],
    timeline: "Opening weeks · listening launch",
  },
  {
    label: "Learn",
    icon: <LearnIcon />,
    objectives: "Convert listening data into shared understanding and clear priority themes.",
    actions: [
      "Publish the Executive Listening Intelligence dashboard",
      "Facilitate leadership team synthesis sessions",
      "Brief staff, families, and board on findings",
    ] as [string, string, string],
    measures: ["Top themes documented and validated", "Alignment sessions completed with key groups"],
    timeline: "Following synthesis period",
  },
  {
    label: "Lead",
    icon: <LeadIcon />,
    objectives: "Set priorities, assign ownership, and communicate decisions with clarity.",
    actions: [
      "Publish the Leadership Response Matrix",
      "Align resources and teams to agreed priorities",
      "Establish visible accountability and communication cadence",
    ] as [string, string, string],
    measures: ["Leadership priorities published with owners", "Response commitments tracked on dashboard"],
    timeline: "Priority execution phase",
  },
  {
    label: "Improve",
    icon: <ImproveIcon />,
    objectives: "Track outcomes, adjust from evidence, and close the loop back to listening.",
    actions: [
      "Review Leadership Response Matrix progress weekly",
      "Report progress to community and board",
      "Return to listening cycle with updated questions",
    ] as [string, string, string],
    measures: ["Commitments met against plan", "Stakeholder feedback on leadership responses"],
    timeline: "Evidence review · ongoing through quarter close",
  },
] as const;

export function Slide05First90Days() {
  return (
    <TemplateBExecutiveContent title="My First 90 Days">
      <div className={TEMPLATE_CARD_GRID_2X2}>
        {PHASE_PLANS.map((phase) => (
          <PhasePlanCard
            key={phase.label}
            label={phase.label}
            icon={phase.icon}
            objectives={phase.objectives}
            actions={phase.actions}
            measures={phase.measures}
            timeline={phase.timeline}
          />
        ))}
      </div>
    </TemplateBExecutiveContent>
  );
}
