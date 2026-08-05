import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import {
  CUTOFF_MIGRATION,
  EXCLUDED_HISTORICAL_REPAIRS,
  PROHIBITED_AUTH_EMAIL,
  PROHIBITED_AUTH_UUID,
  REQUIRED_IMMUTABLE_158_BLOB,
} from "./constants.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..", "..");
export const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");
export const BASELINE_DIR = join(ROOT, "supabase", "baseline");
export const BASELINE_SQL_PATH = join(BASELINE_DIR, "GA_BASELINE_212.sql");
export const MANIFEST_PATH = join(BASELINE_DIR, "manifest.json");
export const EVIDENCE_DIR = join(BASELINE_DIR, "evidence");

export function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

export function gitHashObject(filePath) {
  return execFileSync("git", ["hash-object", filePath], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
}

export function gitRevParseHead() {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
}

export function parseMigrationVersion(filename) {
  const m = filename.match(/^(\d{3})_/);
  if (!m) return null;
  return Number(m[1]);
}

export function listMigrationFiles() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => {
      const va = parseMigrationVersion(a) ?? 0;
      const vb = parseMigrationVersion(b) ?? 0;
      if (va !== vb) return va - vb;
      return a.localeCompare(b);
    });
}

export function assertUniqueVersions(files) {
  const seen = new Map();
  for (const f of files) {
    const v = parseMigrationVersion(f);
    if (v == null) throw new Error(`Unversioned migration file: ${f}`);
    if (seen.has(v)) {
      throw new Error(
        `Duplicate migration version ${v}: ${seen.get(v)} and ${f}`
      );
    }
    seen.set(v, f);
  }
}

export function assertImmutable158() {
  const path = join(
    MIGRATIONS_DIR,
    "158_sprint002_authenticated_founder_repair.sql"
  );
  if (!existsSync(path)) {
    throw new Error("Missing immutable migration 158");
  }
  const blob = gitHashObject(path);
  if (blob !== REQUIRED_IMMUTABLE_158_BLOB) {
    throw new Error(
      `Immutable 158 blob mismatch: expected ${REQUIRED_IMMUTABLE_158_BLOB}, got ${blob}`
    );
  }
  return blob;
}

export function migrationsThroughCutoff(cutoff = CUTOFF_MIGRATION) {
  const files = listMigrationFiles();
  assertUniqueVersions(files);
  return files.filter((f) => {
    const v = parseMigrationVersion(f);
    return v != null && v <= cutoff;
  });
}

export function classifyInclusion(filename) {
  if (EXCLUDED_HISTORICAL_REPAIRS[filename]) {
    return {
      include: false,
      ...EXCLUDED_HISTORICAL_REPAIRS[filename],
    };
  }
  return { include: true, classification: "INCLUDED_CANONICAL_SOURCE" };
}

export function assertNoProhibitedExecutable(sql, label) {
  if (sql.includes(PROHIBITED_AUTH_UUID)) {
    throw new Error(
      `${label} contains prohibited historical Auth UUID ${PROHIBITED_AUTH_UUID}`
    );
  }
  if (sql.toLowerCase().includes(PROHIBITED_AUTH_EMAIL.toLowerCase())) {
    throw new Error(
      `${label} contains prohibited historical Auth email ${PROHIBITED_AUTH_EMAIL}`
    );
  }
}

/**
 * Composition-time transforms for greenfield (do not edit historical files).
 * Removes historical-only Auth email from founder bootstrap config while keeping
 * the canonical seed founder email.
 */
export function composeSourceSql(filename, sql) {
  const transforms = [];
  let out = sql;

  if (filename === "175_complete_auth_user_provisioning.sql") {
    if (out.toLowerCase().includes(PROHIBITED_AUTH_EMAIL.toLowerCase())) {
      out = out.replace(
        new RegExp(`\\s*'${PROHIBITED_AUTH_EMAIL}'\\s*,?\\s*\\n?`, "gi"),
        "\n"
      );
      // tidy trailing commas before closing array if needed
      out = out.replace(/,\s*(\]::text\[\])/g, "$1");
      transforms.push({
        id: "strip_historical_founder_bootstrap_email",
        reason:
          "Greenfield must not carry executable dependency on historical Auth email; seed jimmy@ remains.",
      });
    }
  }

  return { sql: out, transforms };
}

export function provenanceDdl() {
  return `-- ============================================================
-- Greenfield baseline provenance (application-owned; not schema_migrations)
-- ============================================================
create table if not exists public.platform_schema_baselines (
  baseline_id text primary key,
  cutoff_migration integer not null,
  artifact_hash text not null,
  source_commit text not null,
  baseline_format_version integer not null,
  generation_method text not null,
  applied_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.platform_forward_migrations (
  version integer primary key,
  filename text not null,
  artifact_hash text not null,
  applied_at timestamptz not null default now()
);

comment on table public.platform_schema_baselines is
  'Greenfield baseline provenance. Distinct from supabase_migrations.schema_migrations.';
comment on table public.platform_forward_migrations is
  'Forward migrations applied after a greenfield baseline cutoff.';
`;
}

export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

export function writeJson(path, value) {
  ensureDir(dirname(path));
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function resolveSupabaseEntrypoint() {
  // Prefer direct node entry to avoid Windows .cmd/.ps1 shell quoting breakage.
  const candidates = [
    join(ROOT, "node_modules", "supabase", "dist", "supabase.js"),
    join(
      process.env.APPDATA || "",
      "npm",
      "node_modules",
      "supabase",
      "dist",
      "supabase.js"
    ),
  ];
  for (const c of candidates) {
    if (c && existsSync(c)) return c;
  }
  return null;
}

export function runSupabase(args, { cwd = ROOT, allowFail = false } = {}) {
  const entry = resolveSupabaseEntrypoint();
  try {
    const out = entry
      ? execFileSync(process.execPath, [entry, ...args], {
          cwd,
          encoding: "utf8",
          maxBuffer: 80 * 1024 * 1024,
          stdio: ["pipe", "pipe", "pipe"],
        })
      : execFileSync("supabase", args, {
          cwd,
          encoding: "utf8",
          maxBuffer: 80 * 1024 * 1024,
          stdio: ["pipe", "pipe", "pipe"],
        });
    return { ok: true, stdout: out, stderr: "", code: 0 };
  } catch (err) {
    if (allowFail) {
      return {
        ok: false,
        stdout: err.stdout?.toString?.() ?? "",
        stderr: err.stderr?.toString?.() ?? String(err),
        code: err.status ?? 1,
      };
    }
    const detail = [
      err.stderr?.toString?.() ?? "",
      err.stdout?.toString?.() ?? "",
      err.message,
    ]
      .filter(Boolean)
      .join("\n");
    throw new Error(`supabase ${args.join(" ")} failed:\n${detail}`);
  }
}

export function linkedProjectRef(cwd = ROOT) {
  const refPath = join(cwd, "supabase", ".temp", "project-ref");
  if (!existsSync(refPath)) return null;
  return readFileSync(refPath, "utf8").trim();
}

export function assertNotProduction(ref) {
  if (!ref) throw new Error("Missing project ref");
  if (ref === "ybcpaffklggaloxhnqkl") {
    throw new Error("PRODUCTION DENY: refusing operation against ybcpaffklggaloxhnqkl");
  }
}

export function queryLinkedJson(sql, cwd = ROOT) {
  const oneLine = sql.replace(/\s+/g, " ").trim();
  const result = runSupabase(
    ["db", "query", "--linked", "-o", "json", oneLine],
    { cwd, allowFail: true }
  );
  if (!result.ok) {
    throw new Error(`db query failed:\n${result.stderr}\n${result.stdout}`);
  }
  const out = `${result.stdout}\n${result.stderr}`;
  // Prefer object form: { rows: [...] }
  const objStart = out.indexOf("{");
  const objEnd = out.lastIndexOf("}");
  if (objStart !== -1 && objEnd > objStart) {
    try {
      const parsed = JSON.parse(out.slice(objStart, objEnd + 1));
      if (Array.isArray(parsed?.rows)) return parsed.rows;
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through to array parse
    }
  }
  const start = out.indexOf("[");
  const end = out.lastIndexOf("]");
  if (start === -1 || end === -1) {
    if (out.includes("\"rows\":[]") || out.trim() === "") return [];
    throw new Error(`Unexpected query output:\n${out}`);
  }
  return JSON.parse(out.slice(start, end + 1));
}

export function selectForwardMigrations(cutoff, migrationFiles = listMigrationFiles()) {
  return migrationFiles.filter((f) => {
    const v = parseMigrationVersion(f);
    return v != null && v > cutoff;
  });
}

/**
 * Decide apply mode from database state descriptors (pure; for tests).
 */
export function resolveApplyMode({
  baselineRows,
  historicalMigrationVersions,
  productionRef,
  targetRef,
}) {
  if (targetRef === productionRef) {
    return { mode: "HISTORICAL_UPGRADE_ONLY", reason: "production_ref" };
  }
  const baselines = baselineRows ?? [];
  const historical = historicalMigrationVersions ?? [];
  if (baselines.length > 1) {
    return { mode: "REJECT", reason: "multiple_baselines" };
  }
  if (baselines.length === 1 && historical.some((v) => v <= CUTOFF_MIGRATION)) {
    return { mode: "REJECT", reason: "ambiguous_baseline_and_historical" };
  }
  if (baselines.length === 1) {
    return {
      mode: "GREENFIELD_FORWARD",
      cutoff: baselines[0].cutoff_migration,
      baselineId: baselines[0].baseline_id,
    };
  }
  if (historical.length > 0) {
    return { mode: "HISTORICAL_UPGRADE", highest: Math.max(...historical) };
  }
  return { mode: "REJECT", reason: "empty_uninitialized" };
}
