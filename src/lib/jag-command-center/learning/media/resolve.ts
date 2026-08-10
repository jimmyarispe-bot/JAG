/**
 * Server-side resolution: durable media path → short-lived signed playback URL.
 * Never import from Client Components (uses service-role storage access).
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import type { JagLearnTutorial } from "../types";
import {
  createJagLearnMediaStorage,
  isJagLearnMediaPath,
  isTemporaryHeyGenVideoUrl,
} from "./storage";
import { isAllowedJagLearnMediaUrl } from "./urls";
import { JAG_LEARN_SIGNED_URL_TTL_SECONDS } from "./types";

export type JagLearnMediaStorageFactory = () => ReturnType<
  typeof createJagLearnMediaStorage
>;

let storageFactory: JagLearnMediaStorageFactory | null = null;

/** Test seam — inject mock storage without touching env service role. */
export function setJagLearnMediaStorageFactoryForTests(
  factory: JagLearnMediaStorageFactory | null
): void {
  storageFactory = factory;
}

function defaultStorage() {
  return createJagLearnMediaStorage(
    createServiceRoleClient() as unknown as Parameters<
      typeof createJagLearnMediaStorage
    >[0]
  );
}

/**
 * Resolve catalog video field to a browser-safe playback URL.
 * - null → null
 * - durable media path → signed https URL (or null if mint fails)
 * - temporary HeyGen URL → null (never serve)
 * - other absolute http(s) → pass through (legacy durable CDN)
 */
export async function resolveJagLearnCatalogVideoUrl(
  catalogVideoRef: string | null | undefined
): Promise<string | null> {
  const raw = catalogVideoRef?.trim() ?? "";
  if (!raw) return null;

  if (isTemporaryHeyGenVideoUrl(raw)) return null;

  if (isJagLearnMediaPath(raw)) {
    const storage = storageFactory ? storageFactory() : defaultStorage();
    return storage.createSignedUrl({
      path: raw,
      expiresInSeconds: JAG_LEARN_SIGNED_URL_TTL_SECONDS,
    });
  }

  if (isAllowedJagLearnMediaUrl(raw)) return raw;
  return null;
}

/** Return a tutorial copy with videoUrl replaced by a runtime playback URL. */
export async function withResolvedJagLearnTutorialVideo(
  tutorial: JagLearnTutorial
): Promise<JagLearnTutorial> {
  const videoUrl = await resolveJagLearnCatalogVideoUrl(tutorial.videoUrl);
  if (videoUrl === tutorial.videoUrl) return tutorial;
  return { ...tutorial, videoUrl };
}
