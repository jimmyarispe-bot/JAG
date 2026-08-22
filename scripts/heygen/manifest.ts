/**
 * Validate and load the Jag video library manifest.
 */

import { readFileSync } from "node:fs";
import type { JagVideoManifest, JagVideoManifestEntry } from "./types";

export class ManifestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManifestValidationError";
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateJagVideoManifest(raw: unknown): JagVideoManifest {
  if (!raw || typeof raw !== "object") {
    throw new ManifestValidationError("Manifest must be a JSON object.");
  }
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 1) {
    throw new ManifestValidationError("Manifest version must be 1.");
  }
  const brand = obj.brand as Record<string, unknown> | undefined;
  if (
    !brand ||
    brand.writtenInstructor !== "Mr. Jag" ||
    brand.writtenProduct !== "The Jag"
  ) {
    throw new ManifestValidationError(
      'Manifest brand must be { writtenInstructor: "Mr. Jag", writtenProduct: "The Jag" }.'
    );
  }
  if (!Array.isArray(obj.videos) || obj.videos.length === 0) {
    throw new ManifestValidationError(
      "Manifest videos must be a non-empty array."
    );
  }

  const seen = new Set<string>();
  const videos: JagVideoManifestEntry[] = [];
  for (const [index, entry] of obj.videos.entries()) {
    if (!entry || typeof entry !== "object") {
      throw new ManifestValidationError(`videos[${index}] must be an object.`);
    }
    const row = entry as Record<string, unknown>;
    if (!isNonEmptyString(row.id)) {
      throw new ManifestValidationError(`videos[${index}].id is required.`);
    }
    const id = row.id.trim();
    if (seen.has(id)) {
      throw new ManifestValidationError(`Duplicate video id: ${id}`);
    }
    seen.add(id);
    if (!isNonEmptyString(row.title)) {
      throw new ManifestValidationError(`videos[${index}].title is required.`);
    }
    if (!isNonEmptyString(row.script)) {
      throw new ManifestValidationError(`videos[${index}].script is required.`);
    }
    if (typeof row.enabled !== "boolean") {
      throw new ManifestValidationError(
        `videos[${index}].enabled must be a boolean.`
      );
    }
    videos.push({
      id,
      title: row.title.trim(),
      script: row.script.trim(),
      enabled: row.enabled,
    });
  }

  return {
    version: 1,
    brand: {
      writtenInstructor: "Mr. Jag",
      writtenProduct: "The Jag",
    },
    videos,
  };
}

export function loadJagVideoManifest(path: string): JagVideoManifest {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    throw new ManifestValidationError(`Unable to read manifest: ${path}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ManifestValidationError(`Malformed JSON in manifest: ${path}`);
  }
  return validateJagVideoManifest(parsed);
}

export function selectVideos(
  manifest: JagVideoManifest,
  id?: string
): JagVideoManifestEntry[] {
  if (id) {
    const hit = manifest.videos.find((v) => v.id === id);
    if (!hit) {
      throw new ManifestValidationError(`No video with id "${id}" in manifest.`);
    }
    return [hit];
  }
  return manifest.videos.filter((v) => v.enabled);
}
