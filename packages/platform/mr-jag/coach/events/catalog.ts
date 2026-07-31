/**
 * Built-in observation event catalog.
 */

import type { MrJagPersona } from "../../types";
import type { CoachEventKind, CoachingType } from "../types";

export type BuiltInEventDef = {
  readonly kind: CoachEventKind;
  readonly title: string;
  readonly personas: readonly MrJagPersona[];
  readonly coachingType: CoachingType;
  readonly isMilestone: boolean;
};

export const BUILT_IN_COACH_EVENTS: readonly BuiltInEventDef[] = Object.freeze([
  {
    kind: "first_login",
    title: "First login",
    personas: Object.freeze([
      "Founder",
      "Executive",
      "School Leader",
      "Teacher",
      "Admissions",
      "Finance",
      "HR",
      "Parent",
      "Student",
      "Support",
      "Developer",
    ] as MrJagPersona[]),
    coachingType: "milestone",
    isMilestone: true,
  },
  {
    kind: "first_organization_setup",
    title: "First organization setup",
    personas: Object.freeze(["Founder", "Executive"] as MrJagPersona[]),
    coachingType: "milestone",
    isMilestone: true,
  },
  {
    kind: "first_school",
    title: "First school",
    personas: Object.freeze([
      "Founder",
      "Executive",
      "School Leader",
    ] as MrJagPersona[]),
    coachingType: "milestone",
    isMilestone: true,
  },
  {
    kind: "first_student",
    title: "First student",
    personas: Object.freeze([
      "Teacher",
      "Admissions",
      "School Leader",
    ] as MrJagPersona[]),
    coachingType: "milestone",
    isMilestone: true,
  },
  {
    kind: "first_employee",
    title: "First employee",
    personas: Object.freeze(["HR", "School Leader", "Founder"] as MrJagPersona[]),
    coachingType: "milestone",
    isMilestone: true,
  },
  {
    kind: "first_class",
    title: "First class",
    personas: Object.freeze(["Teacher", "School Leader"] as MrJagPersona[]),
    coachingType: "milestone",
    isMilestone: true,
  },
  {
    kind: "first_enrollment",
    title: "First enrollment",
    personas: Object.freeze([
      "Admissions",
      "School Leader",
      "Parent",
    ] as MrJagPersona[]),
    coachingType: "milestone",
    isMilestone: true,
  },
  {
    kind: "first_attendance",
    title: "First attendance",
    personas: Object.freeze(["Teacher"] as MrJagPersona[]),
    coachingType: "milestone",
    isMilestone: true,
  },
  {
    kind: "first_payroll",
    title: "First payroll",
    personas: Object.freeze(["HR", "Finance", "School Leader"] as MrJagPersona[]),
    coachingType: "compliance",
    isMilestone: true,
  },
  {
    kind: "first_invoice",
    title: "First invoice",
    personas: Object.freeze([
      "Finance",
      "School Leader",
      "Parent",
    ] as MrJagPersona[]),
    coachingType: "milestone",
    isMilestone: true,
  },
  {
    kind: "first_tuition_payment",
    title: "First tuition payment",
    personas: Object.freeze(["Finance", "Parent"] as MrJagPersona[]),
    coachingType: "milestone",
    isMilestone: true,
  },
  {
    kind: "first_intervention",
    title: "First intervention",
    personas: Object.freeze(["Teacher", "School Leader"] as MrJagPersona[]),
    coachingType: "behavior",
    isMilestone: true,
  },
  {
    kind: "first_report",
    title: "First report",
    personas: Object.freeze([
      "Executive",
      "School Leader",
      "Founder",
    ] as MrJagPersona[]),
    coachingType: "executive",
    isMilestone: true,
  },
  {
    kind: "first_connector",
    title: "First connector",
    personas: Object.freeze(["Developer", "Founder", "Support"] as MrJagPersona[]),
    coachingType: "efficiency",
    isMilestone: true,
  },
  {
    kind: "first_backup",
    title: "First backup",
    personas: Object.freeze(["Founder", "Executive", "Support"] as MrJagPersona[]),
    coachingType: "compliance",
    isMilestone: true,
  },
  {
    kind: "first_executive_intelligence_review",
    title: "First Executive Intelligence review",
    personas: Object.freeze(["Executive", "Founder"] as MrJagPersona[]),
    coachingType: "executive",
    isMilestone: true,
  },
  {
    kind: "first_certification",
    title: "First certification",
    personas: Object.freeze([
      "Teacher",
      "HR",
      "School Leader",
      "Developer",
      "Support",
    ] as MrJagPersona[]),
    coachingType: "learning",
    isMilestone: true,
  },
  {
    kind: "first_invite",
    title: "First invite",
    personas: Object.freeze(["HR", "School Leader", "Founder"] as MrJagPersona[]),
    coachingType: "milestone",
    isMilestone: true,
  },
]);

export function findBuiltInEvent(
  kind: string
): BuiltInEventDef | undefined {
  return BUILT_IN_COACH_EVENTS.find((e) => e.kind === kind);
}
