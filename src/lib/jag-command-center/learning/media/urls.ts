/**
 * Safe URL resolution for JAG Learning catalog video playback.
 * Browser never receives service credentials — only absolute https URLs
 * (or pre-minted signed https URLs from a server resolver).
 *
 * Durable storage paths (tutorials/JAG-00N/mr-jag.mp4) must be resolved
 * server-side before reaching this player helper.
 */

import { isTemporaryHeyGenVideoUrl } from "./storage";
import {
  JAG_LEARN_INSTRUCTOR_DISPLAY_NAME,
  JAG_LEARN_INSTRUCTOR_ID,
  type JagLearnVideoPlayback,
  type JagLearnVideoPlaybackInput,
} from "./types";

/** Allow only http(s) absolute URLs suitable for <video src> / track src. */
export function isAllowedJagLearnMediaUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeOptionalUrl(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return isAllowedJagLearnMediaUrl(trimmed) ? trimmed : null;
}

/**
 * Resolve playback for the Learning video player from runtime fields.
 * Invalid schemes, storage paths, and temporary HeyGen URLs → unavailable.
 */
export function resolveJagLearnVideoPlayback(
  input: JagLearnVideoPlaybackInput
): JagLearnVideoPlayback {
  const base = {
    instructorId: JAG_LEARN_INSTRUCTOR_ID,
    instructorDisplayName: JAG_LEARN_INSTRUCTOR_DISPLAY_NAME,
  } as const;

  const raw = input.videoUrl?.trim() ?? "";
  if (!raw) {
    return { kind: "unavailable", reason: "missing", ...base };
  }
  if (isTemporaryHeyGenVideoUrl(raw) || !isAllowedJagLearnMediaUrl(raw)) {
    return { kind: "unavailable", reason: "invalid_url", ...base };
  }

  const captionsUrl = normalizeOptionalUrl(input.captionsUrl);
  const posterUrl = normalizeOptionalUrl(input.posterUrl);
  const title = input.title?.trim() || "Mr. JAG™ tutorial";

  return {
    kind: "ready",
    videoUrl: raw.trim(),
    captionsUrl,
    posterUrl,
    title,
    ...base,
  };
}
