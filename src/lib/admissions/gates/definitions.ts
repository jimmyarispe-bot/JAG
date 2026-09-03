/**
 * The three decision gates, defined once.
 *
 * Client-safe: the pending-decisions page imports this for labels and wording,
 * and the server imports the same object to decide what actually happens. One
 * definition, so the question a school leader reads and the consequence of their
 * answer cannot drift apart.
 *
 * A gate is the QUESTION. `admissions_decisions` (migration 066) remains the
 * OUTCOME. The accept_or_deny gate hands its answer to that existing path rather
 * than reimplementing acceptance.
 */

import type { CommunicationTriggerEvent } from "@/lib/admissions/communications/types";
import type { LeadStageValue } from "@/lib/constants/admissions";

export type GateKey = "invite_to_apply" | "invite_to_shadow_days" | "accept_or_deny";

export type GateAnswer = "yes" | "no" | "accept" | "deny";

export interface GateBranch {
  readonly answer: GateAnswer;
  /** Button text the school leader sees. */
  readonly label: string;
  /** One line under the button saying what will happen. No surprises. */
  readonly consequence: string;
  /**
   * Email sent to the FAMILY on this branch. Null where the branch delegates to
   * another path that sends its own (accept_or_deny does).
   */
  readonly familyEvent: CommunicationTriggerEvent | null;
  /**
   * Stage the lead moves to. Null means the lead stays where it is.
   *
   * A "yes" deliberately does not advance the stage: we have invited a family,
   * not observed them doing anything. The stage moves when they actually start
   * the application or book the days. Recording an invitation as progress is how
   * a pipeline starts lying about itself.
   */
  readonly stage: LeadStageValue | null;
  /** Whether the lead should drop out of the working pipeline view. */
  readonly archive: boolean;
  /** Set when the branch should drive the existing decision path instead. */
  readonly delegatesToDecision: "accept" | "deny" | null;
}

export interface GateDefinition {
  readonly key: GateKey;
  readonly title: string;
  /** The question, as the school leader reads it. */
  readonly question: string;
  /** What they should look at before answering. */
  readonly reviewHint: string;
  /** The stage a lead must be at for this gate to open. */
  readonly opensAtStage: readonly LeadStageValue[];
  readonly branches: readonly [GateBranch, GateBranch];
}

export const GATES: Record<GateKey, GateDefinition> = {
  invite_to_apply: {
    key: "invite_to_apply",
    title: "Invite to apply",
    question: "Should we invite this family to complete an application?",
    reviewHint:
      "You have met them. Read what they told us about their child's greatness and challenges before you answer.",
    opensAtStage: ["tour_completed", "interest_meeting_held"],
    branches: [
      {
        answer: "yes",
        label: "Yes — invite them to apply",
        consequence:
          "The family gets a link to the application, prefilled with what they already told us.",
        familyEvent: "application_invited",
        stage: null,
        archive: false,
        delegatesToDecision: null,
      },
      {
        answer: "no",
        label: "No — close this out",
        consequence:
          "The family gets a short thank-you and best wishes. The lead is marked declined and stays in the pipeline.",
        familyEvent: "application_not_invited",
        stage: "declined",
        archive: false,
        delegatesToDecision: null,
      },
    ],
  },

  invite_to_shadow_days: {
    key: "invite_to_shadow_days",
    title: "Invite to shadow days",
    question: "Should we invite this student to shadow days?",
    reviewHint:
      "The application and every document they supplied are on the student's profile. Read them before you answer.",
    opensAtStage: ["application_submitted"],
    branches: [
      {
        answer: "yes",
        label: "Yes — invite to shadow days",
        consequence: "The family gets your school's shadow-days booking link.",
        familyEvent: "shadow_days_invited",
        stage: null,
        archive: false,
        delegatesToDecision: null,
      },
      {
        answer: "no",
        label: "No — decline the application",
        consequence:
          "The family gets the decline letter, which says the limitation is ours and not their child's. The lead is marked declined and stays in the pipeline.",
        familyEvent: "shadow_days_not_invited",
        stage: "declined",
        archive: false,
        delegatesToDecision: null,
      },
    ],
  },

  accept_or_deny: {
    key: "accept_or_deny",
    title: "Accept or deny",
    question: "Shadow days are complete. Do we accept this student?",
    reviewHint:
      "This is the last gate. Accepting starts the enrollment contract and tuition process.",
    opensAtStage: ["shadow_day_completed"],
    branches: [
      {
        answer: "accept",
        label: "Accept",
        consequence:
          "The acceptance email goes out, the enrollment packet is generated, and the business department picks it up tomorrow.",
        familyEvent: null,
        stage: null,
        archive: false,
        delegatesToDecision: "accept",
      },
      {
        answer: "deny",
        label: "Deny",
        consequence:
          "The decline letter goes out and the lead is archived from the working pipeline.",
        familyEvent: null,
        stage: null,
        archive: true,
        delegatesToDecision: "deny",
      },
    ],
  },
};

export const GATE_KEYS = Object.keys(GATES) as GateKey[];

export function gateFor(key: string): GateDefinition | null {
  return (GATES as Record<string, GateDefinition | undefined>)[key] ?? null;
}

export function branchFor(gate: GateDefinition, answer: string): GateBranch | null {
  return gate.branches.find((b) => b.answer === answer) ?? null;
}

/** Shape the page renders. Assembled server-side. */
export interface PendingGate {
  readonly id: string;
  readonly gateKey: GateKey;
  readonly leadId: string;
  readonly studentName: string;
  readonly guardianName: string | null;
  readonly guardianEmail: string | null;
  readonly schoolName: string | null;
  readonly grade: string | null;
  readonly leadStage: string;
  readonly greatness: string | null;
  readonly challenges: string | null;
  readonly createdAt: string;
  readonly notifyCount: number;
}
