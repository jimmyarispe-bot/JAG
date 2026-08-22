/**
 * Batch / single video generation orchestration for The Jag / Mr. Jag.
 */

import { APPROVED_HEYGEN_SETUP, requireHeyGenRuntimeConfig, type HeyGenRuntimeConfig } from "./config";
import { APPROVED_VOICE_SPEED, HeyGenApiError, HeyGenClient } from "./client";
import { loadJagVideoManifest, selectVideos } from "./manifest";
import { safeLog } from "./redact";
import {
  loadGenerationState,
  saveGenerationState,
  shouldSkipSuccessful,
  upsertRecord,
} from "./state";
import type {
  GenerateOptions,
  GenerationRecord,
  JagVideoManifestEntry,
} from "./types";

export type GenerateResult = {
  readonly processed: number;
  readonly created: number;
  readonly skipped: number;
  readonly failed: number;
  readonly dryRun: number;
  readonly records: readonly GenerationRecord[];
};

function nowIso(): string {
  return new Date().toISOString();
}

export async function generateJagVideos(
  options: GenerateOptions,
  deps?: {
    config?: HeyGenRuntimeConfig;
    client?: HeyGenClient;
    env?: NodeJS.ProcessEnv;
  }
): Promise<GenerateResult> {
  const manifest = loadJagVideoManifest(options.manifestPath);
  const selected = selectVideos(manifest, options.id);
  let state = loadGenerationState(options.statePath);
  const records: GenerationRecord[] = [];
  let created = 0;
  let skipped = 0;
  let failed = 0;
  let dryRunCount = 0;

  const apiKeyHint = deps?.env?.HEYGEN_API_KEY ?? process.env.HEYGEN_API_KEY;

  for (const video of selected) {
    const existing = state.records[video.id];
    if (shouldSkipSuccessful(existing, options.force)) {
      const record: GenerationRecord = {
        ...existing!,
        updatedAt: nowIso(),
        status: "skipped",
        failureReason: "Already completed — use --force to regenerate.",
      };
      // Preserve completed status for idempotency; mark skip in log only.
      const preserved: GenerationRecord = {
        ...existing!,
        updatedAt: nowIso(),
      };
      state = upsertRecord(state, preserved);
      records.push(record);
      skipped += 1;
      safeLog(
        `[skip] ${video.id} — already completed (HeyGen video ${existing!.heygenVideoId}).`,
        apiKeyHint
      );
      continue;
    }

    if (options.dryRun) {
      const record: GenerationRecord = {
        manifestId: video.id,
        title: video.title,
        heygenVideoId: null,
        status: "dry_run",
        createdAt: nowIso(),
        updatedAt: nowIso(),
        videoUrl: null,
        failureReason: null,
        dryRun: true,
      };
      records.push(record);
      dryRunCount += 1;
      safeLog(
        `[dry-run] would generate ${video.id}: "${video.title}" (${video.script.length} chars).`,
        apiKeyHint
      );
      continue;
    }

    const config = deps?.config ?? requireHeyGenRuntimeConfig(deps?.env);
    const client = deps?.client ?? HeyGenClient.fromRuntime(config);

    try {
      safeLog(
        [
          "=== PREFLIGHT (before POST /v3/videos) ===",
          `manifest ID: ${video.id}`,
          `avatar ID: ${config.avatarId}`,
          `voice ID: ${config.voiceId}`,
          `script beginning: ${video.script.slice(0, 48)}`,
          `speed: ${APPROVED_VOICE_SPEED}`,
          `model: ${APPROVED_HEYGEN_SETUP.avatarModel}`,
          `resolution: ${APPROVED_HEYGEN_SETUP.resolution}`,
          "=== END PREFLIGHT ===",
        ].join("\n"),
        config.apiKey
      );
      const createdVideo = await createOne(client, config, video);
      let record: GenerationRecord = {
        manifestId: video.id,
        title: video.title,
        heygenVideoId: createdVideo.videoId,
        status: "pending",
        createdAt: nowIso(),
        updatedAt: nowIso(),
        videoUrl: null,
        failureReason: null,
        dryRun: false,
      };

      if (options.poll) {
        safeLog(
          `[poll] ${video.id} → ${createdVideo.videoId}`,
          config.apiKey
        );
        const finalStatus = await client.waitForVideo({
          videoId: createdVideo.videoId,
          intervalMs: options.pollIntervalMs,
          timeoutMs: options.pollTimeoutMs,
          onTick: (status) =>
            safeLog(`[status] ${video.id}: ${status}`, config.apiKey),
        });
        record = {
          ...record,
          status: finalStatus.status,
          videoUrl: finalStatus.videoUrl,
          failureReason:
            finalStatus.status === "failed"
              ? finalStatus.failureMessage ?? "Render failed"
              : null,
          updatedAt: nowIso(),
        };
        if (finalStatus.status === "failed") {
          failed += 1;
        } else {
          created += 1;
        }
      } else {
        created += 1;
      }

      state = upsertRecord(state, record);
      records.push(record);
      safeLog(
        `[ok] ${video.id} heygenVideoId=${createdVideo.videoId} status=${record.status}`,
        config.apiKey
      );
    } catch (error) {
      failed += 1;
      const message =
        error instanceof HeyGenApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Unknown error";
      const record: GenerationRecord = {
        manifestId: video.id,
        title: video.title,
        heygenVideoId: null,
        status: "error",
        createdAt: nowIso(),
        updatedAt: nowIso(),
        videoUrl: null,
        failureReason: message,
        dryRun: false,
      };
      state = upsertRecord(state, record);
      records.push(record);
      safeLog(`[error] ${video.id}: ${message}`, config.apiKey);
    }
  }

  if (!options.dryRun) {
    saveGenerationState(options.statePath, state);
  }

  return {
    processed: selected.length,
    created,
    skipped,
    failed,
    dryRun: dryRunCount,
    records,
  };
}

async function createOne(
  client: HeyGenClient,
  config: HeyGenRuntimeConfig,
  video: JagVideoManifestEntry
): Promise<{ videoId: string }> {
  const { videoId } = await client.createAvatarVideo({
    avatarId: config.avatarId,
    voiceId: config.voiceId,
    title: video.title,
    script: video.script,
  });
  return { videoId };
}
