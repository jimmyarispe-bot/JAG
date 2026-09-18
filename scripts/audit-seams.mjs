#!/usr/bin/env node
/**
 * THE SEAM AUDITOR.
 *
 * Three times on 17 September 2026 data was written correctly, stored
 * correctly, and read by nobody. None of them threw. Each query succeeded and
 * returned nothing - a silent empty wearing a success costume.
 *
 * The sharpest of the three: application_documents carries lead_id, added by
 * migration 326 precisely so an inquiry upload can attach to a lead before any
 * application exists. Every reader queried by application_id, which is null on
 * those rows. Three families' scholarship award letters were invisible for
 * three days.
 *
 * THAT is the shape worth hunting, and it has a name:
 *
 *   A KEY COLUMN THAT IS WRITTEN AND NEVER FILTERED ON.
 *
 * An `_id` column is a link to another record. Writing one and never using it
 * in a .eq/.in/.or means the link exists in the database and nothing can
 * traverse it. The row is reachable only by some other key - and if that other
 * key is null, the row is reachable by nothing at all.
 *
 * The first version of this script reported every column written and never
 * selected. That was 600 lines, including `error`, `ok` and `onConflict`, which
 * are not columns. A report nobody finishes reading is not an audit. This one
 * reports the two things that are worth waking up to, and hides the rest behind
 * --all.
 *
 * WHAT IT IS NOT. A text scanner, not a type checker. Every finding is a
 * QUESTION - "who reads this?" - and the answer is sometimes "nobody needs to".
 * The point is that the question gets asked at all, across 7,000 files, nightly.
 *
 * Usage:  node scripts/audit-seams.mjs [dirs...] [--all] [--json]
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const showAll = args.includes("--all");
const roots = args.filter((a) => !a.startsWith("--"));
const REPO = process.cwd();
const SCAN = roots.length ? roots : ["src"];

/** Columns every table has, that nothing needs to filter by name. */
const PLUMBING = new Set([
  "id", "created_at", "updated_at", "created_by", "updated_by", "deleted_at",
  "audit_id", "metadata", "notes",
]);

/**
 * Not columns. These are supabase-js options and result shapes that sit in
 * object literals next to real ones - the first run reported every one of them
 * as a missing read, which is how a 600-line report gets ignored.
 */
const NOT_COLUMNS = new Set([
  "onConflict", "ignoreDuplicates", "count", "head", "ascending", "nullsFirst",
  "returning", "defaultToNull", "error", "data", "ok", "null", "undefined",
  "then", "catch", "status", "statusText",
]);

const MAX_WINDOW = 1200;

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".next" || e.name.startsWith(".")) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.d\.ts$/.test(e.name)) out.push(full);
  }
  return out;
}

const tables = new Map();
function entry(t) {
  if (!tables.has(t)) {
    tables.set(t, {
      writes: new Map(), filters: new Set(), selects: new Set(),
      wildcard: false, anyRead: false, anyWrite: false,
      writeFiles: new Set(), readFiles: new Set(),
    });
  }
  return tables.get(t);
}

function objectKeys(chunk) {
  const start = chunk.indexOf("{");
  if (start === -1) return [];
  let depth = 0, end = -1;
  for (let i = start; i < chunk.length; i += 1) {
    if (chunk[i] === "{") depth += 1;
    else if (chunk[i] === "}") { depth -= 1; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return [];
  const keys = new Set();
  for (const m of chunk.slice(start, end).matchAll(/(?:^|[{,\s])([a-z_][a-z0-9_]*)\s*:/gi)) {
    if (!NOT_COLUMNS.has(m[1])) keys.add(m[1]);
  }
  return [...keys];
}

for (const root of SCAN) {
  for (const file of walk(join(REPO, root))) {
    const text = readFileSync(file, "utf8");
    const rel = relative(REPO, file).replace(/\\/g, "/");
    const calls = [...text.matchAll(/\.from\(\s*["'`]([a-z_][a-z0-9_]*)["'`]/gi)];

    for (let i = 0; i < calls.length; i += 1) {
      const m = calls[i];
      const table = m[1];
      const rec = entry(table);
      /* Stop at the next .from(. The first version used a fixed window and
         bled one query's columns into the next table's report. */
      const hardStop = i + 1 < calls.length ? calls[i + 1].index : text.length;
      const chunk = text.slice(m.index, Math.min(hardStop, m.index + MAX_WINDOW));

      const write = chunk.match(/\.(insert|update|upsert)\s*\(/);
      if (write) {
        rec.anyWrite = true;
        rec.writeFiles.add(rel);
        for (const key of objectKeys(chunk.slice(write.index + write[0].length))) {
          if (!rec.writes.has(key)) rec.writes.set(key, new Set());
          rec.writes.get(key).add(rel);
        }
      }

      const select = chunk.match(/\.select\(\s*["'`]([^"'`]*)["'`]/);
      if (select) {
        rec.anyRead = true; rec.readFiles.add(rel);
        if (select[1].includes("*")) rec.wildcard = true;
        for (const c of select[1].split(",")) {
          const name = c.trim().split(/[\s(:]/)[0];
          if (/^[a-z_][a-z0-9_]*$/i.test(name)) rec.selects.add(name);
        }
      }
      if (/\.select\(\s*\)/.test(chunk)) { rec.anyRead = true; rec.wildcard = true; rec.readFiles.add(rel); }

      for (const f of chunk.matchAll(/\.(eq|neq|gt|gte|lt|lte|like|ilike|in|is|contains|order|not|match)\(\s*["'`]([a-z_][a-z0-9_.]*)["'`]/gi)) {
        rec.filters.add(f[2].split(".")[0]); rec.anyRead = true;
      }
      for (const o of chunk.matchAll(/\.or\(\s*[`"']([^`"']+)/gi)) {
        for (const part of o[1].split(",")) {
          const col = part.split(".")[0].trim();
          if (/^[a-z_][a-z0-9_]*$/i.test(col)) { rec.filters.add(col); rec.anyRead = true; }
        }
      }
      for (const o of chunk.matchAll(/([a-z_][a-z0-9_]*)\.(eq|in|is)\.\$\{/gi)) {
        rec.filters.add(o[1]); rec.anyRead = true;
      }
    }
  }
}

const unreachableKeys = [];
const writeOnlyTables = [];
const otherUnread = [];

for (const [table, rec] of [...tables.entries()].sort()) {
  if (rec.anyWrite && !rec.anyRead) {
    writeOnlyTables.push({ table, writtenIn: [...rec.writeFiles].sort() });
    continue;
  }
  for (const [col, files] of [...rec.writes.entries()].sort()) {
    if (PLUMBING.has(col)) continue;
    const filtered = rec.filters.has(col);
    const selected = rec.selects.has(col) || rec.wildcard;

    /* THE HEADLINE. A link written and never traversed. */
    if (/_id$/.test(col) && !filtered) {
      unreachableKeys.push({ table, column: col, writtenIn: [...files].sort(), everSelected: selected });
      continue;
    }
    if (!filtered && !selected) {
      otherUnread.push({ table, column: col, writtenIn: [...files].sort() });
    }
  }
}

if (asJson) {
  console.log(JSON.stringify({ unreachableKeys, writeOnlyTables, otherUnread }, null, 2));
} else {
  const line = "=".repeat(70);
  console.log(line);
  console.log("SEAM AUDIT");
  console.log(line);
  console.log(`\nScanned ${SCAN.join(", ")} — ${tables.size} tables\n`);

  console.log(`\n## 1. LINKS NOTHING CAN TRAVERSE  (${unreachableKeys.length})`);
  console.log("   An _id column written on insert and never used in a filter.");
  console.log("   This is the shape of the application_documents.lead_id bug:");
  console.log("   the link exists in the database and no query follows it.\n");
  for (const r of unreachableKeys) {
    console.log(`  ${r.table}.${r.column}`);
    console.log(`      written: ${r.writtenIn.join(", ")}`);
    if (!r.everSelected) console.log(`      and never selected either`);
  }
  if (!unreachableKeys.length) console.log("  none");

  console.log(`\n\n## 2. WRITE-ONLY TABLES  (${writeOnlyTables.length})`);
  console.log("   Something stores here. Nothing reads it back, ever.\n");
  for (const r of writeOnlyTables) {
    console.log(`  ${r.table}`);
    for (const f of r.writtenIn.slice(0, 3)) console.log(`      written: ${f}`);
  }
  if (!writeOnlyTables.length) console.log("  none");

  console.log(`\n\n## 3. OTHER COLUMNS NEITHER SELECTED NOR FILTERED  (${otherUnread.length})`);
  if (showAll) {
    let last = null;
    for (const r of otherUnread) {
      if (r.table !== last) { console.log(`\n  ${r.table}`); last = r.table; }
      console.log(`      ${r.column}  —  ${r.writtenIn[0]}`);
    }
  } else {
    console.log("   Mostly display fields on tables read with select(*). Noisy.");
    console.log("   Run with --all to see them.");
  }
  console.log("\n");
}
