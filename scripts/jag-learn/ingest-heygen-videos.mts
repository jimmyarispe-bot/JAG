#!/usr/bin/env tsx
/**
 * Transfer completed HeyGen Learning videos into private Supabase bucket
 * `jag-learn-media` at tutorials/JAG-00N/mr-jag.mp4.
 *
 * - Does NOT call POST /v3/videos or regenerate anything.
 * - Downloads each completed videoUrl from generation-state.json once.
 * - Uploads via service role (never exposes key to browser).
 *
 * Usage:
 *   npx tsx scripts/jag-learn/ingest-heygen-videos.mts
 *   npx tsx scripts/jag-learn/ingest-heygen-videos.mts --verify-only
 */

import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { loadDotEnvFiles } from "../rc5/load-dotenv";
import {
  buildJagLearnMediaPath,
  createJagLearnMediaStorage,
  isJagLearnMediaPath,
  isTemporaryHeyGenVideoUrl,
} from "../../src/lib/jag-command-center/learning/media/storage";
import { JAG_LEARN_MEDIA_BUCKET } from "../../src/lib/jag-command-center/learning/media/types";

const ROOT = process.cwd();
const STATE_PATH = resolve(ROOT, "artifacts/heygen/generation-state.json");
const TEMP_DIR = resolve(ROOT, "artifacts/temp/jag-learn-ingest");

const MANIFEST_TO_CODE: Record<string, string> = {
  "jag-001": "JAG-001",
  "jag-002": "JAG-002",
  "jag-003": "JAG-003",
  "jag-004": "JAG-004",
  "jag-005": "JAG-005",
  "jag-006": "JAG-006",
  "jag-007": "JAG-007",
  "jag-008": "JAG-008",
  "jag-009": "JAG-009",
  "jag-010": "JAG-010",
};

type GenerationRecord = {
  manifestId: string;
  status: string;
  videoUrl: string | null;
  heygenVideoId: string | null;
};

function isMp4Buffer(buf: Buffer): boolean {
  // ISO BMFF / MP4 typically has "ftyp" at byte 4
  return buf.length > 12 && buf.toString("ascii", 4, 8) === "ftyp";
}

async function downloadToFile(url: string, dest: string): Promise<number> {
  await mkdir(dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed HTTP ${res.status} for ${dest}`);
  }
  const ab = await res.arrayBuffer();
  const buf = Buffer.from(ab);
  if (!isMp4Buffer(buf)) {
    throw new Error(`Downloaded bytes do not look like MP4: ${dest}`);
  }
  await writeFile(dest, buf);
  return buf.length;
}

async function main(): Promise<void> {
  loadDotEnvFiles();
  const verifyOnly = process.argv.includes("--verify-only");

  const raw = await readFile(STATE_PATH, "utf8");
  const state = JSON.parse(raw) as {
    records: Record<string, GenerationRecord>;
  };

  const targets = Object.keys(MANIFEST_TO_CODE);
  for (const id of targets) {
    const rec = state.records[id];
    if (!rec) throw new Error(`Missing generation-state record: ${id}`);
    if (rec.status !== "completed") {
      throw new Error(`${id} status is ${rec.status}, expected completed`);
    }
    if (!rec.videoUrl?.trim()) {
      throw new Error(`${id} missing videoUrl`);
    }
    if (!isTemporaryHeyGenVideoUrl(rec.videoUrl)) {
      console.warn(
        `[warn] ${id} videoUrl does not look like a temporary HeyGen URL; continuing.`
      );
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (read from env; do not invent)."
    );
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const storage = createJagLearnMediaStorage(supabase);

  console.log(`Bucket: ${JAG_LEARN_MEDIA_BUCKET}`);
  console.log(verifyOnly ? "Mode: verify-only" : "Mode: download + upload");

  const results: Array<{
    id: string;
    path: string;
    ok: boolean;
    detail: string;
  }> = [];

  for (const id of targets) {
    const code = MANIFEST_TO_CODE[id]!;
    const path = buildJagLearnMediaPath({ tutorialCode: code });
    if (!isJagLearnMediaPath(path)) {
      throw new Error(`Invalid path generated for ${id}: ${path}`);
    }

    if (verifyOnly) {
      const exists = await storage.objectExists({ path });
      results.push({
        id,
        path,
        ok: exists,
        detail: exists ? "exists" : "MISSING",
      });
      continue;
    }

    const rec = state.records[id]!;
    const localPath = join(TEMP_DIR, `${code}.mp4`);
    let bytes = 0;
    try {
      const st = await stat(localPath);
      if (st.size > 1024) {
        bytes = st.size;
        console.log(`[skip-download] ${id} local cache ${bytes} bytes`);
      }
    } catch {
      /* download */
    }
    if (!bytes) {
      console.log(`[download] ${id}`);
      bytes = await downloadToFile(rec.videoUrl!, localPath);
      console.log(`[download-ok] ${id} ${bytes} bytes`);
    }

    const exists = await storage.objectExists({ path });
    if (exists) {
      console.log(`[replace] ${id} ${path}`);
    } else {
      console.log(`[upload] ${id} ${path}`);
    }

    const body = await readFile(localPath);
    const uploaded = await storage.uploadObject({
      path,
      body,
      contentType: "video/mp4",
      upsert: true,
    });
    if (!uploaded.ok) {
      results.push({ id, path, ok: false, detail: uploaded.error });
      console.error(`[fail] ${id}: ${uploaded.error}`);
      continue;
    }
    const verified = await storage.objectExists({ path });
    results.push({
      id,
      path,
      ok: verified,
      detail: verified ? `uploaded ${bytes} bytes` : "upload reported ok but missing",
    });
  }

  console.log("\n=== RESULTS ===");
  for (const r of results) {
    console.log(`${r.ok ? "OK" : "FAIL"} | ${r.id} | ${r.path} | ${r.detail}`);
  }
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    process.exitCode = 1;
    console.error(
      `\n${failed.length} failure(s). If the bucket is missing, apply migration 218 locally/remotely first:\n  supabase db push --linked   # ONLY when explicitly authorized\n  OR apply supabase/migrations/218_jag_learn_media_bucket.sql in your Supabase SQL editor.`
    );
  } else {
    console.log(`\nAll ${results.length} objects verified.`);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
