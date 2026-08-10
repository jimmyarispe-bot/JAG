/**
 * Client-safe Learning media surface.
 * Server-only signed URL resolution lives in ./resolve (do not re-export here).
 */

export {
  JAG_LEARN_INSTRUCTOR_DISPLAY_NAME,
  JAG_LEARN_INSTRUCTOR_ID,
  JAG_LEARN_MEDIA_BUCKET,
  JAG_LEARN_SIGNED_URL_TTL_SECONDS,
  JAG_LEARN_TUTORIAL_VIDEO_FILE,
  type JagLearnMediaRef,
  type JagLearnMediaStorage,
  type JagLearnVideoPlayback,
  type JagLearnVideoPlaybackInput,
  type JagLearnVideoPlaybackSource,
  type JagLearnVideoPlaybackUnavailable,
} from "./types";

export {
  isAllowedJagLearnMediaUrl,
  resolveJagLearnVideoPlayback,
} from "./urls";

export {
  buildJagLearnMediaPath,
  createJagLearnMediaStorage,
  isJagLearnMediaPath,
  isTemporaryHeyGenVideoUrl,
  toJagLearnMediaRef,
  type JagLearnSupabaseStorageLikeClient,
} from "./storage";
