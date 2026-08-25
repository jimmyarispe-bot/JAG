/**
 * Dry-run admissions lead spreadsheets before anyone touches the import wizard.
 *
 * Answers, per file, without writing anything: how many rows will import, which
 * will fail and why, what stage each lands in, and whether the resulting stages
 * are ones the database will actually accept. Built after a migration where 16
 * of 70 rows passed validation and then failed on INSERT — every one of those
 * failures was predictable from the file plus the schema.
 *
 *   npx tsx scripts/admissions/preflight-lead-import.ts <file.xlsx> [more.xlsx...]
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { LEAD_STATUS_MAP, resolveLeadStatus } from "../../src/lib/platform/imports/entities/lead/stage-mapping";

const CONSTRAINT = "admissions_leads_lead_stage_check";

/** The stage values Postgres will accept, read from the migrations in force. */
function allowedLeadStages(): Set<string> {
  const dir = path.join(process.cwd(), "supabase", "migrations");
  let allowed = new Set<string>();
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    const sql = readFileSync(path.join(dir, file), "utf8").replace(/--[^\n]*/g, "");
    const pattern = new RegExp(
      `add\\s+constraint\\s+${CONSTRAINT}[\\s\\S]*?lead_stage\\s+in\\s*\\(([\\s\\S]*?)\\)`,
      "gi"
    );
    for (const m of sql.matchAll(pattern)) {
      const values = [...m[1]!.matchAll(/'([^']+)'/g)].map((v) => v[1]!);
      if (values.length) allowed = new Set(values);
    }
  }
  return allowed;
}

type Row = Record<string, string>;

function readRows(file: string): Row[] {
  const wb = XLSX.read(readFileSync(file), { type: "buffer" });
  // Mirror the production parser: first sheet that actually has rows.
  const sheetName =
    wb.SheetNames.find((n) => (XLSX.utils.sheet_to_json(wb.Sheets[n]!) as unknown[]).length > 0) ??
    wb.SheetNames[0]!;
  return XLSX.utils.sheet_to_json<Row>(wb.Sheets[sheetName]!, { defval: "", raw: false });
}

const get = (row: Row, key: string) => String(row[key] ?? "").trim();

function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error("usage: preflight-lead-import.ts <file.xlsx> [...]");
    process.exit(2);
  }

  const allowed = allowedLeadStages();
  console.log(`Database accepts ${allowed.size} lead_stage values (from migrations)\n`);

  let anyBlocking = false;

  for (const file of files) {
    const rows = readRows(file);
    const willImport: number[] = [];
    const willFail: Array<{ row: number; why: string }> = [];
    const noContact: number[] = [];
    const stageCounts = new Map<string, number>();
    const seen = new Map<string, number>();
    const identity = new Map<string, number>();
    const dupes: Array<{ row: number; of: number }> = [];
    const softDupes: Array<{ row: number; of: number }> = [];

    rows.forEach((row, i) => {
      const line = i + 2; // spreadsheet row: +1 header, +1 one-based
      const first = get(row, "First Name");
      const last = get(row, "Last Name");
      const statusRaw = get(row, "Status");

      if (!first) return willFail.push({ row: line, why: "missing First Name" });
      if (!last) return willFail.push({ row: line, why: "missing Last Name" });
      if (!statusRaw) return willFail.push({ row: line, why: "missing Status" });

      const status = resolveLeadStatus(statusRaw);
      if (!status) return willFail.push({ row: line, why: `unmapped status "${statusRaw}"` });

      // The failure mode that cost us 16 rows: valid to the app, refused by Postgres.
      if (!allowed.has(status.leadStage)) {
        return willFail.push({
          row: line,
          why: `stage "${status.leadStage}" not permitted by ${CONSTRAINT}`,
        });
      }

      if (!get(row, "Parent Email") && !get(row, "Parent Phone")) noContact.push(line);

      const key = `${first}|${last}|${get(row, "Parent Email")}`.toLowerCase();
      if (seen.has(key)) dupes.push({ row: line, of: seen.get(key)! });
      else seen.set(key, line);

      // Same child, different name spelling. Legacy CRM exports reverse first
      // and last names, or misspell them, while date of birth and guardian
      // email stay put. Siblings share the email but not the DOB, so this does
      // not collapse them.
      const dob = get(row, "DOB");
      const email = get(row, "Parent Email").toLowerCase();
      const phone = get(row, "Parent Phone").replace(/\D/g, "");
      if (dob) {
        // Two parents inquiring from different emails still share the child's
        // date of birth and usually a phone number.
        const nameKey = `${first}|${last}`.toLowerCase();
        for (const contact of [email, phone, nameKey].filter(Boolean)) {
          const idKey = `${dob}|${contact}`;
          if (identity.has(idKey)) {
            const of = identity.get(idKey)!;
            if (!dupes.some((d) => d.row === line) && !softDupes.some((d) => d.row === line)) {
              softDupes.push({ row: line, of });
            }
          } else identity.set(idKey, line);
        }
      }

      stageCounts.set(status.leadStage, (stageCounts.get(status.leadStage) ?? 0) + 1);
      willImport.push(line);
    });

    const blocking = willFail.filter((f) => f.why.includes(CONSTRAINT));
    if (blocking.length) anyBlocking = true;

    console.log(`${path.basename(file)} — ${rows.length} rows`);
    console.log(`  will import : ${willImport.length}`);
    console.log(`  will fail   : ${willFail.length}`);
    for (const f of willFail) console.log(`      row ${f.row}: ${f.why}`);
    if (noContact.length) console.log(`  no contact  : ${noContact.length} (warning only) rows ${noContact.join(", ")}`);
    for (const d of dupes) console.log(`  duplicate   : row ${d.row} matches row ${d.of} (will update, not duplicate)`);
    for (const d of softDupes)
      console.log(
        `  SAME CHILD  : row ${d.row} and row ${d.of} share a date of birth and guardian email under different names`
      );
    console.log(`  stages      : ${[...stageCounts.entries()].sort().map(([s, n]) => `${s}=${n}`).join("  ")}`);
    console.log();
  }

  // Unmapped statuses are a data problem; rejected stages are a schema problem.
  if (anyBlocking) {
    console.error(`BLOCKED: some rows map to stages ${CONSTRAINT} rejects. Ship the migration first.`);
    process.exit(1);
  }
  console.log("No schema-level blockers. Safe to run the import.");
}

main();
