/**
 * RC-3 — static authorization inventory for API routes (source scan).
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const API = join(ROOT, "src", "app", "api");

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry === "route.ts") out.push(full);
  }
  return out;
}

function rel(p: string): string {
  return p.replace(ROOT, "").replace(/\\/g, "/").replace(/^\//, "");
}

function main() {
  const routes = walk(API);
  const rows = routes.map((file) => {
    const src = readFileSync(file, "utf8");
    return {
      path: rel(file),
      guardApiRoute: /guardApiRoute\s*\(/.test(src),
      getIdentityContext: /getIdentityContext\s*\(/.test(src),
      requireOrganizationAccess: /requireOrganizationAccess\s*\(/.test(src),
      requireSchoolAccess: /requireSchoolAccess\s*\(/.test(src),
      canExportOrImport: /canExportData|canImportData|canManage/.test(src),
      cronOrPublicHint:
        /CRON_SECRET|isPublicApiPath|probe:\s*"liveness"|probe:\s*"readiness"/.test(src) ||
        /\/api\/health|\/api\/ready|observability\/rum/.test(file.replace(/\\/g, "/")),
    };
  });

  const report = {
    sprint: "RC-3",
    generatedAt: new Date().toISOString(),
    totalRoutes: rows.length,
    withGuardApiRoute: rows.filter((r) => r.guardApiRoute).length,
    withIdentityContext: rows.filter((r) => r.getIdentityContext).length,
    withOrgScope: rows.filter((r) => r.requireOrganizationAccess).length,
    withSchoolScope: rows.filter((r) => r.requireSchoolAccess).length,
    routes: rows,
  };

  const out = join(ROOT, "perf-rc3-authz-inventory.json");
  writeFileSync(out, JSON.stringify(report, null, 2), "utf8");
  console.log(`RC-3 authz inventory → ${out}`);
  console.log(
    `Routes=${report.totalRoutes} guardApi=${report.withGuardApiRoute} identity=${report.withIdentityContext} orgScope=${report.withOrgScope} schoolScope=${report.withSchoolScope}`
  );
}

main();
