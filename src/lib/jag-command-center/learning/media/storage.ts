/**
 * JAG Learning media storage abstraction.
 *
 * Uses a Supabase-compatible storage client directly — does NOT import
 * `@/applications/academyos/*` or AcademyOS document storage.
 *
 * Durable objects live in private bucket `jag-learn-media`
 * (see supabase/migrations/218_jag_learn_media_bucket.sql).
 * Playback uses short-lived signed URLs minted server-side.
 */

import {
  JAG_LEARN_MEDIA_BUCKET,
  JAG_LEARN_TUTORIAL_VIDEO_FILE,
  type JagLearnMediaRef,
  type JagLearnMediaStorage,
} from "./types";

type SupabaseStorageBucketApi = {
  createSignedUrl: (
    path: string,
    expiresIn: number
  ) => Promise<{
    data: { signedUrl: string } | null;
    error: { message: string } | null;
  }>;
  list: (
    path?: string,
    options?: { limit?: number; search?: string }
  ) => Promise<{
    data: { name: string }[] | null;
    error: { message: string } | null;
  }>;
  upload: (
    path: string,
    body: Buffer | Uint8Array | Blob | ArrayBuffer | File,
    options?: { contentType?: string; upsert?: boolean }
  ) => Promise<{
    data: { path: string } | null;
    error: { message: string } | null;
  }>;
};

export type JagLearnSupabaseStorageLikeClient = {
  storage: {
    from: (bucket: string) => SupabaseStorageBucketApi;
  };
};

const SAFE_SEGMENT = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const TUTORIAL_CODE = /^JAG-\d{3}$/;
const CANONICAL_PATH =
  /^tutorials\/JAG-\d{3}\/mr-jag\.mp4$/;

function assertSafeSegment(value: string, label: string): string {
  const trimmed = value.trim();
  if (!SAFE_SEGMENT.test(trimmed) || trimmed.includes("..")) {
    throw new Error(`Invalid JAG Learning media ${label}`);
  }
  return trimmed;
}

/**
 * Canonical object path for a catalog tutorial asset.
 * Example: tutorials/JAG-001/mr-jag.mp4
 */
export function buildJagLearnMediaPath(input: {
  tutorialCode: string;
  fileName?: string;
}): string {
  const code = assertSafeSegment(input.tutorialCode, "tutorialCode");
  if (!TUTORIAL_CODE.test(code)) {
    throw new Error(`Invalid JAG Learning media tutorialCode: ${code}`);
  }
  const fileName = assertSafeSegment(
    input.fileName ?? JAG_LEARN_TUTORIAL_VIDEO_FILE,
    "fileName"
  );
  return `tutorials/${code}/${fileName}`;
}

export function toJagLearnMediaRef(path: string): JagLearnMediaRef {
  const normalized = path.replace(/^\/+/, "").trim();
  if (!normalized || normalized.includes("..")) {
    throw new Error("Invalid JAG Learning media path");
  }
  return { bucket: JAG_LEARN_MEDIA_BUCKET, path: normalized };
}

/** True when value is a durable Learning storage path (not an http URL). */
export function isJagLearnMediaPath(value: string | null | undefined): boolean {
  if (value == null) return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("..")) return false;
  return CANONICAL_PATH.test(trimmed);
}

/** Reject temporary HeyGen CDN URLs from persistence / playback catalogs. */
export function isTemporaryHeyGenVideoUrl(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return false;
  if (!trimmed.includes("heygen.ai") && !trimmed.includes("heygen.com")) {
    return false;
  }
  return (
    trimmed.includes("avatar_tmp") ||
    trimmed.includes("expires=") ||
    trimmed.includes("signature=") ||
    trimmed.includes("key-pair-id=")
  );
}

/**
 * Bind a Supabase-like client for signed URL minting + object ops.
 */
export function createJagLearnMediaStorage(
  client: JagLearnSupabaseStorageLikeClient
): JagLearnMediaStorage {
  const bucketApi = () => client.storage.from(JAG_LEARN_MEDIA_BUCKET);

  return {
    bucket: JAG_LEARN_MEDIA_BUCKET,
    async createSignedUrl(input) {
      const path = toJagLearnMediaRef(input.path).path;
      if (!isJagLearnMediaPath(path)) return null;
      const expires = Math.max(60, Math.floor(input.expiresInSeconds));
      const { data, error } = await bucketApi().createSignedUrl(path, expires);
      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    },
    async objectExists(input) {
      const path = toJagLearnMediaRef(input.path).path;
      if (!isJagLearnMediaPath(path)) return false;
      const parts = path.split("/");
      const fileName = parts.pop();
      const folder = parts.join("/");
      if (!fileName) return false;
      const { data, error } = await bucketApi().list(folder, {
        limit: 100,
        search: fileName,
      });
      if (error || !data) return false;
      return data.some((row) => row.name === fileName);
    },
    async uploadObject(input) {
      const path = toJagLearnMediaRef(input.path).path;
      if (!isJagLearnMediaPath(path)) {
        return { ok: false as const, error: "Invalid tutorial media path." };
      }
      const { error } = await bucketApi().upload(path, input.body, {
        contentType: input.contentType ?? "video/mp4",
        upsert: input.upsert ?? true,
      });
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const };
    },
  };
}
