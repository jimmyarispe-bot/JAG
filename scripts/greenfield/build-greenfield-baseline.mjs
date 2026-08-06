#!/usr/bin/env node
/**
 * Deterministically compose GA_BASELINE_212 from historical migration sources,
 * excluding classified historical repairs (e.g. 158).
 *
 * Usage: node scripts/greenfield/build-greenfield-baseline.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  BASELINE_ID,
  BASELINE_FORMAT_VERSION,
  CUTOFF_MIGRATION,
  EXCLUDED_HISTORICAL_REPAIRS,
  REQUIRED_IMMUTABLE_158_BLOB,
} from "./constants.mjs";
import {
  BASELINE_DIR,
  BASELINE_SQL_PATH,
  EVIDENCE_DIR,
  MANIFEST_PATH,
  MIGRATIONS_DIR,
  ROOT,
  assertImmutable158,
  assertNoProhibitedExecutable,
  assertPinnedSources,
  assertUniqueVersions,
  classifyInclusion,
  composeSourceSql,
  ensureDir,
  executableLines,
  gitHashObject,
  gitRevParseHead,
  listMigrationFiles,
  migrationsThroughCutoff,
  provenanceDdl,
  sha256,
  writeJson,
} from "./lib.mjs";

function main() {
  console.log("Building greenfield baseline…");
  ensureDir(BASELINE_DIR);
  ensureDir(EVIDENCE_DIR);

  const blob158 = assertImmutable158();
  const pinned = assertPinnedSources();
  const sourceCommit = gitRevParseHead();
  const allFiles = listMigrationFiles();
  assertUniqueVersions(allFiles);

  const throughCutoff = migrationsThroughCutoff(CUTOFF_MIGRATION);
  if (!throughCutoff.some((f) => f.startsWith(`${String(CUTOFF_MIGRATION).padStart(3, "0")}_`))) {
    throw new Error(`Cutoff migration ${CUTOFF_MIGRATION} not found in migrations/`);
  }

  const included = [];
  const excluded = [];

  for (const file of throughCutoff) {
    const decision = classifyInclusion(file);
    if (!decision.include) {
      excluded.push({
        filename: file,
        version: decision.version,
        classification: decision.classification,
        included_in_greenfield: false,
        reason: decision.reason,
        blob: gitHashObject(join(MIGRATIONS_DIR, file)),
      });
      continue;
    }

    const abs = join(MIGRATIONS_DIR, file);
    const raw = readFileSync(abs, "utf8");
    // composeSourceSql newline-normalizes for cross-OS determinism
    const composed = composeSourceSql(file, raw);
    assertNoProhibitedExecutable(composed.sql, file);
    const blob = gitHashObject(abs);
    included.push({
      filename: file,
      version: Number(file.slice(0, 3)),
      classification: decision.classification,
      blob,
      dml_class: "DETERMINISTIC_BASELINE_DATA_OR_SCHEMA",
      composition_transforms: composed.transforms,
      composed_sha256: sha256(composed.sql),
    });
  }

  // Fail closed: every excluded historical repair must be declared
  for (const [name, meta] of Object.entries(EXCLUDED_HISTORICAL_REPAIRS)) {
    if (!excluded.some((e) => e.filename === name)) {
      // repair may be beyond cutoff — still require declaration presence in config
      if (throughCutoff.includes(name)) {
        throw new Error(`Declared exclusion ${name} was not excluded from composition`);
      }
    }
    if (meta.version === 158 && blob158 !== REQUIRED_IMMUTABLE_158_BLOB) {
      throw new Error("158 immutability failure during exclusion recording");
    }
  }

  if (!excluded.some((e) => e.filename.includes("158_"))) {
    throw new Error("Builder fail-closed: migration 158 must be excluded from greenfield");
  }

  const header = `-- ============================================================
-- ${BASELINE_ID}
-- Greenfield initialization artifact (NOT a historical migration)
-- ============================================================
-- baseline_id: ${BASELINE_ID}
-- cutoff_migration: ${CUTOFF_MIGRATION}
-- created_from_commit: ${sourceCommit}
-- baseline_format_version: ${BASELINE_FORMAT_VERSION}
-- generation_method: filtered_historical_source_composition
--
-- This artifact does NOT claim historical migrations 001-${CUTOFF_MIGRATION}
-- executed. It composes canonical state for new environments.
-- Excluded historical repairs are listed in supabase/baseline/manifest.json.
-- DO NOT edit by hand; regenerate via:
--   npm run db:baseline:build
-- ============================================================

`;

  const parts = [header, provenanceDdl(), "\n"];

  for (const item of included) {
    const raw = readFileSync(join(MIGRATIONS_DIR, item.filename), "utf8");
    const composed = composeSourceSql(item.filename, raw);
    parts.push(`\n-- >>> BEGIN SOURCE ${item.filename} (blob ${item.blob})\n`);
    if (composed.transforms.length) {
      parts.push(
        `-- composition_transforms: ${composed.transforms
          .map((t) => t.id)
          .join(", ")}\n`
      );
    }
    parts.push(composed.sql.endsWith("\n") ? composed.sql : `${composed.sql}\n`);
    parts.push(`-- <<< END SOURCE ${item.filename}\n`);
  }

  for (const item of excluded) {
    parts.push(
      `\n-- >>> SKIPPED HISTORICAL_REPAIR ${item.filename}\n` +
        `-- classification: ${item.classification}\n` +
        `-- reason: ${item.reason}\n` +
        `-- <<< END SKIPPED ${item.filename}\n`
    );
  }

  const artifact = parts.join("");
  assertNoProhibitedExecutable(artifact, BASELINE_ID);

  // Comments may mention exclusion emails in SKIPPED banners — strip check already on executable sources.
  // Re-check body excluding comment-only skip banners:
  const executableBody = executableLines(artifact);
  assertNoProhibitedExecutable(executableBody, `${BASELINE_ID} executable body`);
  if (executableBody.includes("Authenticated Founder repair aborted")) {
    throw new Error("Executable baseline contains migration 158 hard-abort text");
  }
  const transformCount = included.reduce(
    (n, i) => n + (i.composition_transforms?.length || 0),
    0
  );
  if (transformCount !== 1) {
    throw new Error(
      `Expected exactly 1 composition transform (175 email), found ${transformCount}`
    );
  }

  writeFileSync(BASELINE_SQL_PATH, artifact, "utf8");
  const artifactHash = sha256(artifact);

  const manifest = {
    baseline_id: BASELINE_ID,
    cutoff: CUTOFF_MIGRATION,
    cutoff_migration: "212_jag_org_scoped_authorization.sql",
    source_commit: sourceCommit,
    created_at: new Date().toISOString(),
    baseline_format_version: BASELINE_FORMAT_VERSION,
    generation_method: "filtered_historical_source_composition",
    artifact: "GA_BASELINE_212.sql",
    generated_artifact_hash: artifactHash,
    historical_repair_158_blob: blob158,
    source_pins: pinned,
    application_atomicity:
      "NOT_SINGLE_TRANSACTION — Management API multi-statement apply; completeness enforced by fingerprint verification",
    included_migrations: included,
    excluded_historical_repairs: excluded,
    composition_transforms_summary: included.flatMap((i) =>
      (i.composition_transforms || []).map((t) => ({
        filename: i.filename,
        ...t,
      }))
    ),
    notes: [
      "Greenfield baseline is an initialization artifact, not historical execution evidence.",
      "Do not insert fake rows into supabase_migrations.schema_migrations for skipped repairs.",
      "Canonical seed Auth identities from 056 (jimmy@ / danni@) are deterministic baseline data.",
      "Historical Auth identity jimmy.arispe@ / d346c418-… is prohibited in executable baseline SQL.",
      "175 email exclusion is HISTORICAL_RUNTIME_FOUNDER_BOOTSTRAP_CONFIG only; see GREENFIELD_175_EMAIL_EXCLUSION.md.",
    ],
  };

  writeJson(MANIFEST_PATH, manifest);

  // Evidence: blobs for migrations through production-relevant set
  const evidenceBlobs = {};
  for (const f of throughCutoff) {
    evidenceBlobs[f] = gitHashObject(join(MIGRATIONS_DIR, f));
  }
  writeJson(join(EVIDENCE_DIR, "migration-source-blobs.json"), {
    source_commit: sourceCommit,
    generated_at: new Date().toISOString(),
    blobs: evidenceBlobs,
    immutable_158_blob: blob158,
  });

  console.log(`Wrote ${BASELINE_SQL_PATH}`);
  console.log(`Wrote ${MANIFEST_PATH}`);
  console.log(`artifact_hash=${artifactHash}`);
  console.log(`included=${included.length} excluded=${excluded.length}`);
  console.log("OK");
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
