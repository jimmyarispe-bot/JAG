#!/usr/bin/env node
/**
 * Forward migration applicator with dual-path awareness.
 *
 * Greenfield databases (platform_schema_baselines present):
 *   apply only migrations with version > baseline cutoff
 *   record in platform_forward_migrations (NOT fake 001–cutoff history)
 *
 * Historical databases (schema_migrations lineage present, no baseline):
 *   delegates to `supabase db push --linked` (normal upgrade path)
 *
 * Usage:
 *   node scripts/greenfield/apply-forward-migrations.mjs [--dry-run] [--fixture <sql>]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  CUTOFF_MIGRATION,
  PRODUCTION_DENY_REF,
} from "./constants.mjs";
import {
  MIGRATIONS_DIR,
  ROOT,
  assertNotProduction,
  gitHashObject,
  linkedProjectRef,
  listMigrationFiles,
  parseMigrationVersion,
  queryLinkedJson,
  resolveApplyMode,
  runSupabase,
  selectForwardMigrations,
} from "./lib.mjs";

function parseArgs(argv) {
  const out = {
    dryRun: false,
    fixture: null,
    workdir: ROOT,
    allowProductionHistorical: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--fixture") out.fixture = argv[++i];
    else if (a === "--workdir") out.workdir = argv[++i];
    else if (a === "--allow-production-historical") out.allowProductionHistorical = true;
  }
  return out;
}

function readBaseline(cwd) {
  try {
    return queryLinkedJson(
      `select baseline_id, cutoff_migration, artifact_hash
       from public.platform_schema_baselines
       order by applied_at desc`,
      cwd
    );
  } catch {
    return [];
  }
}

function readHistoricalVersions(cwd) {
  try {
    const rows = queryLinkedJson(
      `select version from supabase_migrations.schema_migrations`,
      cwd
    );
    return rows
      .map((r) => {
        const n = Number(String(r.version).replace(/\D/g, "").slice(0, 3));
        return Number.isFinite(n) ? n : null;
      })
      .filter((n) => n != null);
  } catch {
    return [];
  }
}

function applyFile(path, cwd) {
  const result = runSupabase(["db", "query", "--linked", "-f", path], {
    cwd,
    allowFail: true,
  });
  if (!result.ok) {
    throw new Error(`apply failed ${path}:\n${result.stderr}\n${result.stdout}`);
  }
}

function main() {
  const args = parseArgs(process.argv);
  const cwd = args.workdir;
  const ref = linkedProjectRef(cwd);
  if (!ref) throw new Error("No linked project ref");

  const baselines = readBaseline(cwd);
  const historical = readHistoricalVersions(cwd);
  const decision = resolveApplyMode({
    baselineRows: baselines,
    historicalMigrationVersions: historical,
    productionRef: PRODUCTION_DENY_REF,
    targetRef: ref,
  });

  console.log(`TARGET_REF=${ref}`);
  console.log(`APPLY_MODE=${decision.mode}`);
  console.log(JSON.stringify(decision));

  if (decision.mode === "REJECT") {
    throw new Error(`Ambiguous/unsafe database state: ${decision.reason}`);
  }

  if (decision.mode === "HISTORICAL_UPGRADE_ONLY") {
    if (!args.allowProductionHistorical) {
      throw new Error(
        "Production target protected. Use normal ops upgrade runbooks; this wrapper refuses production by default."
      );
    }
  }

  if (
    decision.mode === "HISTORICAL_UPGRADE" ||
    decision.mode === "HISTORICAL_UPGRADE_ONLY"
  ) {
    if (args.fixture) {
      throw new Error("Fixture apply is only supported on greenfield-forward mode");
    }
    if (args.dryRun) {
      const result = runSupabase(["db", "push", "--linked", "--dry-run"], {
        cwd,
        allowFail: true,
      });
      console.log(result.stdout);
      console.log(result.stderr);
      if (!result.ok) process.exit(result.code || 1);
      console.log("HISTORICAL_DRY_RUN=PASS");
      return;
    }
    assertNotProduction(ref); // refuse prod writes in this certification harness
    throw new Error(
      "Historical upgrade execution via this harness is disabled for safety. Use supabase db push under an approved ops phase."
    );
  }

  // GREENFIELD_FORWARD
  assertNotProduction(ref);
  const cutoff = Number(decision.cutoff ?? CUTOFF_MIGRATION);
  let pending = selectForwardMigrations(cutoff);

  if (args.fixture) {
    if (!existsSync(args.fixture)) {
      throw new Error(`Fixture not found: ${args.fixture}`);
    }
    pending = [
      {
        synthetic: true,
        path: args.fixture,
        version: cutoff + 1,
        filename: `SYNTHETIC_${cutoff + 1}_NEXT_MIGRATION_AFTER_CUTOFF.sql`,
      },
    ];
  } else {
    pending = pending.map((filename) => ({
      synthetic: false,
      path: join(MIGRATIONS_DIR, filename),
      version: parseMigrationVersion(filename),
      filename,
    }));
  }

  const already = queryLinkedJson(
    `select version from public.platform_forward_migrations`,
    cwd
  ).map((r) => Number(r.version));

  const toApply = pending.filter((p) => !already.includes(p.version));
  console.log(
    `Pending forward migrations: ${toApply.map((p) => p.filename).join(", ") || "(none)"}`
  );

  if (args.dryRun) {
    console.log("GREENFIELD_FORWARD_DRY_RUN=PASS");
    return;
  }

  const tmpDir = join(cwd, "supabase", ".temp", "forward-apply");
  mkdirSync(tmpDir, { recursive: true });

  for (const item of toApply) {
    console.log(`Applying forward ${item.filename}`);
    applyFile(item.path, cwd);
    const hash = item.synthetic
      ? gitHashObject(item.path)
      : gitHashObject(item.path);
    const rec = `
      insert into public.platform_forward_migrations (version, filename, artifact_hash)
      values (${item.version}, '${item.filename.replace(/'/g, "''")}', '${hash}')
      on conflict (version) do nothing;
    `;
    const recPath = join(tmpDir, `record_${item.version}.sql`);
    writeFileSync(recPath, rec, "utf8");
    applyFile(recPath, cwd);
  }

  // Guard: must not fabricate 158 in historical ledger (table may not exist on greenfield)
  try {
    const ledger158 = queryLinkedJson(
      `select version from supabase_migrations.schema_migrations
       where cast(version as text) like '158%' limit 1`,
      cwd
    );
    if (ledger158.length) {
      throw new Error("Unexpected 158 ledger row after greenfield forward apply");
    }
  } catch (err) {
    const msg = String(err.message || err);
    if (msg.includes("Unexpected 158 ledger row")) throw err;
    if (!(msg.includes("schema_migrations") || msg.includes("42P01"))) {
      throw err;
    }
  }

  console.log("GREENFIELD_FORWARD_APPLY=PASS");
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
