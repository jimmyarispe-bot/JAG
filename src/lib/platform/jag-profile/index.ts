/** The JAG Profile™ — canonical learner aggregation for every workspace. */
export type {
  JagProfile,
  JagProfileAi,
  JagProfileAiRecommendation,
  JagProfileEvidence,
  JagProfileIdentity,
  JagProfileInstruction,
  JagProfileLearning,
  JagProfilePrerequisiteItem,
  JagProfileReadiness,
  JagProfileSection,
  ResolveJagProfileOptions,
} from "@/lib/platform/jag-profile/types";

export { buildPrerequisiteGraph } from "@/lib/platform/jag-profile/prerequisite";
export {
  jagProfileToReadinessSnapshot,
  resolveJagProfile,
  resolveJagProfilesForStudents,
} from "@/lib/platform/jag-profile/resolve";
