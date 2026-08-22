/**
 * Local generation metadata under artifacts/heygen/ (no secrets).
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
import type { GenerationRecord, GenerationStateFile } from "./types";

export function emptyGenerationState(): GenerationStateFile {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    records: {},
  };
}

export function loadGenerationState(path: string): GenerationStateFile {
  if (!existsSync(path)) return emptyGenerationState();
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as GenerationStateFile;
    if (parsed?.version !== 1 || typeof parsed.records !== "object") {
      return emptyGenerationState();
    }
    return parsed;
  } catch {
    return emptyGenerationState();
  }
}

export function saveGenerationState(
  path: string,
  state: GenerationStateFile
): void {
  mkdirSync(dirname(path), { recursive: true });
  const next: GenerationStateFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    records: state.records,
  };
  writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

export function upsertRecord(
  state: GenerationStateFile,
  record: GenerationRecord
): GenerationStateFile {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    records: {
      ...state.records,
      [record.manifestId]: record,
    },
  };
}

/** Successfully generated videos are skipped on rerun unless --force. */
export function shouldSkipSuccessful(
  existing: GenerationRecord | undefined,
  force: boolean
): boolean {
  if (force) return false;
  if (!existing) return false;
  return (
    existing.status === "completed" &&
    Boolean(existing.heygenVideoId) &&
    !existing.dryRun
  );
}
