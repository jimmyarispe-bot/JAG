/**
 * Client-safe Learning Center surface.
 *
 * Import this module (or types/catalog/preferences-helpers directly) from
 * Client Components. Never import ./index, ./store, ./service, ./coach,
 * ./walkthrough, ./authorization, or ./actions from a path that pulls those
 * modules into the client graph except Next.js "use server" action entrypoints.
 */

export type {
  JagLearnCoachAnswer,
  JagLearnDifficulty,
  JagLearnProgressStatus,
  JagLearnTutorial,
  JagLearnTutorialCategory,
  JagLearnTutorialContent,
  JagLearnTutorialStep,
  JagLearnUserPreferences,
  JagLearnUserProgress,
  JagLearnWalkthrough,
  JagLearnWalkthroughStep,
  LearningHomeModel,
} from "./types";

export {
  JAG_LEARN_TUTORIALS,
  JAG_LEARN_WALKTHROUGHS,
  getCatalogTutorialById,
  getCatalogTutorialBySlug,
  getWalkthroughById,
  pageIdForPathname,
  tutorialForPageId,
} from "./catalog";

export { shouldShowFirstLoginWelcome } from "./preferences-helpers";
