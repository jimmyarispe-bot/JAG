import type { ExperienceBriefing } from "./experience-briefing";
import type { ExperienceWidgetRegistration } from "./experience-widget";
import type {
  ExperienceCommandAffordance,
  ExperienceCompositionRequest,
  ExperienceNavHint,
  ExperienceNextAction,
  ExperienceNotificationHint,
} from "./experience-types";

/**
 * Contributes experience fragments — never imports domain code into Core.
 */
export interface ExperienceProvider {
  id: string;
  priority?: number;
  supports?(request: ExperienceCompositionRequest): boolean;
  widgets?(
    request: ExperienceCompositionRequest
  ):
    | Promise<readonly ExperienceWidgetRegistration[]>
    | readonly ExperienceWidgetRegistration[];
  briefing?(
    request: ExperienceCompositionRequest
  ): Promise<ExperienceBriefing | null> | ExperienceBriefing | null;
  nextActions?(
    request: ExperienceCompositionRequest
  ):
    | Promise<readonly ExperienceNextAction[]>
    | readonly ExperienceNextAction[];
  notifications?(
    request: ExperienceCompositionRequest
  ):
    | Promise<readonly ExperienceNotificationHint[]>
    | readonly ExperienceNotificationHint[];
  navigation?(
    request: ExperienceCompositionRequest
  ): Promise<readonly ExperienceNavHint[]> | readonly ExperienceNavHint[];
  commands?(
    request: ExperienceCompositionRequest
  ):
    | Promise<readonly ExperienceCommandAffordance[]>
    | readonly ExperienceCommandAffordance[];
}

export function sortExperienceProviders(
  providers: readonly ExperienceProvider[]
): ExperienceProvider[] {
  return [...providers].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
