/**
 * JAG Learning media — catalog instructional assets only.
 * Instructor identity: Mr. JAG™ (id = "mr-jag").
 *
 * Never store or resolve organization-private, financial, EI, or tenant-live media here.
 * Never persist temporary HeyGen CDN URLs (Expires/Signature/Key-Pair-Id) in catalog.
 */

/** Supabase Storage bucket for durable Learning instructional videos. */
export const JAG_LEARN_MEDIA_BUCKET = "jag-learn-media" as const;

export const JAG_LEARN_INSTRUCTOR_ID = "mr-jag" as const;
export const JAG_LEARN_INSTRUCTOR_DISPLAY_NAME = "Mr. JAG™" as const;

/** Canonical tutorial video file name inside each tutorial folder. */
export const JAG_LEARN_TUTORIAL_VIDEO_FILE = "mr-jag.mp4" as const;

/** Default signed playback TTL (seconds). */
export const JAG_LEARN_SIGNED_URL_TTL_SECONDS = 60 * 60;

export type JagLearnMediaRef = {
  readonly bucket: typeof JAG_LEARN_MEDIA_BUCKET;
  readonly path: string;
};

/**
 * Playback inputs for the Learning video player.
 *
 * Catalog `videoUrl` stores a durable media path (e.g. tutorials/JAG-001/mr-jag.mp4)
 * or null. Absolute https URLs are accepted only as runtime playback inputs after
 * server-side signed-URL minting (or legacy durable CDN URLs — never HeyGen temp).
 */
export type JagLearnVideoPlaybackInput = {
  readonly videoUrl: string | null;
  readonly captionsUrl?: string | null;
  readonly posterUrl?: string | null;
  /** Accessible label; defaults to tutorial title. */
  readonly title?: string | null;
};

export type JagLearnVideoPlaybackSource = {
  readonly kind: "ready";
  readonly videoUrl: string;
  readonly captionsUrl: string | null;
  readonly posterUrl: string | null;
  readonly title: string;
  readonly instructorId: typeof JAG_LEARN_INSTRUCTOR_ID;
  readonly instructorDisplayName: typeof JAG_LEARN_INSTRUCTOR_DISPLAY_NAME;
};

export type JagLearnVideoPlaybackUnavailable = {
  readonly kind: "unavailable";
  readonly reason: "missing" | "invalid_url";
  readonly instructorId: typeof JAG_LEARN_INSTRUCTOR_ID;
  readonly instructorDisplayName: typeof JAG_LEARN_INSTRUCTOR_DISPLAY_NAME;
};

export type JagLearnVideoPlayback =
  | JagLearnVideoPlaybackSource
  | JagLearnVideoPlaybackUnavailable;

/**
 * Storage surface for durable Learning media.
 * Implemented against Supabase Storage without importing AcademyOS packages.
 */
export type JagLearnMediaStorage = {
  readonly bucket: typeof JAG_LEARN_MEDIA_BUCKET;
  createSignedUrl(input: {
    path: string;
    expiresInSeconds: number;
  }): Promise<string | null>;
  objectExists(input: { path: string }): Promise<boolean>;
  uploadObject(input: {
    path: string;
    body: Buffer | Uint8Array | Blob | ArrayBuffer | File;
    contentType?: string;
    upsert?: boolean;
  }): Promise<{ ok: true } | { ok: false; error: string }>;
};
