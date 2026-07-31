/**
 * Avatar surface — presentation metadata for Mr. JAG guide UI.
 */

export type MrJagAvatarState = {
  readonly id: "mr-jag";
  readonly displayName: "Mr. JAG™";
  readonly mood: "neutral" | "helpful" | "celebratory" | "concerned";
  readonly pose: "guide" | "coach" | "listen";
};

export function resolveMrJagAvatar(input?: {
  mood?: MrJagAvatarState["mood"];
  pose?: MrJagAvatarState["pose"];
}): MrJagAvatarState {
  return {
    id: "mr-jag",
    displayName: "Mr. JAG™",
    mood: input?.mood ?? "helpful",
    pose: input?.pose ?? "guide",
  };
}

export function createMrJagAvatarService() {
  return { resolve: resolveMrJagAvatar };
}
