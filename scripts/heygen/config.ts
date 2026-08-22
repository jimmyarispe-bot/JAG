/**
 * Approved HeyGen configuration for Mr. Jag / The Jag local generation.
 *
 * Avatar display name: Mr. Jag
 * Avatar model: Avatar IV
 * Motion: enabled (Avatar IV engine; do not recreate avatar from PNG)
 * Voice display name: Sawyer
 * Resolution: 1080p
 *
 * Avatar and voice IDs must come from the environment — never invent them.
 */

export const HEYGEN_API_BASE_URL = "https://api.heygen.com";

export const APPROVED_HEYGEN_SETUP = Object.freeze({
  avatarDisplayName: "Mr. Jag",
  avatarModel: "Avatar IV",
  engineType: "avatar_iv" as const,
  voiceDisplayName: "Sawyer",
  resolution: "1080p" as const,
  motionEnabled: true,
  writtenInstructor: "Mr. Jag" as const,
  writtenProduct: "The Jag" as const,
});

export type HeyGenRuntimeConfig = {
  readonly apiKey: string;
  readonly avatarId: string;
  readonly voiceId: string;
  readonly baseUrl: string;
};

export class HeyGenConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HeyGenConfigError";
  }
}

export function requireHeyGenRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env
): HeyGenRuntimeConfig {
  const apiKey = env.HEYGEN_API_KEY?.trim() ?? "";
  const avatarId = env.HEYGEN_AVATAR_ID?.trim() ?? "";
  const voiceId = env.HEYGEN_VOICE_ID?.trim() ?? "";
  const baseUrl =
    env.HEYGEN_API_BASE_URL?.trim() || HEYGEN_API_BASE_URL;

  if (!apiKey) {
    throw new HeyGenConfigError(
      "Missing HEYGEN_API_KEY. Set it in .env.local (never commit the real key)."
    );
  }
  if (!avatarId) {
    throw new HeyGenConfigError(
      "Missing HEYGEN_AVATAR_ID. Set it to the existing approved Mr. Jag avatar look ID from HeyGen (do not invent an ID)."
    );
  }
  if (!voiceId) {
    throw new HeyGenConfigError(
      "Missing HEYGEN_VOICE_ID. Set it to the existing approved Sawyer voice ID from HeyGen (do not invent an ID)."
    );
  }

  return {
    apiKey,
    avatarId,
    voiceId,
    baseUrl: baseUrl.replace(/\/+$/, ""),
  };
}
