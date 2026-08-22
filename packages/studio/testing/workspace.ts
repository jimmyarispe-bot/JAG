import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { appendTestRun, listTestRuns } from "../store";
import type {
  TestRunRecord,
  TestSuiteSummary,
  TestingWorkspaceView,
} from "../types";

function walkTests(absDir: string, root: string, files: string[], depth: number) {
  if (depth > 6) return;
  let names: string[];
  try {
    names = readdirSync(/* turbopackIgnore: true */ absDir);
  } catch {
    return;
  }
  for (const name of names) {
    if (name === "node_modules") continue;
    const abs = join(/* turbopackIgnore: true */ absDir, name);
    let st;
    try {
      st = statSync(/* turbopackIgnore: true */ abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walkTests(abs, root, files, depth + 1);
      continue;
    }
    if (name.endsWith(".test.ts") || name.endsWith(".spec.ts")) {
      files.push(relative(root, abs).split(sep).join("/"));
    }
  }
}

function domainFor(path: string): TestSuiteSummary["domain"] {
  if (path.includes("academyos")) return "AcademyOS";
  if (path.includes("studio")) return "Studio";
  if (path.includes("platform-sdk") || path.includes("/sdk")) return "SDK";
  if (path.includes("connector")) return "Connectors";
  if (
    path.includes("digital-twin") ||
    path.includes("platform-portal") ||
    path.includes("executive-intelligence") ||
    path.includes("jag-platform")
  ) {
    return "Foundation";
  }
  return "Other";
}

const SUITE_DEFS: {
  id: string;
  name: string;
  domain: TestSuiteSummary["domain"];
  match: (p: string) => boolean;
}[] = [
  {
    id: "foundation",
    name: "Foundation",
    domain: "Foundation",
    match: (p) => domainFor(p) === "Foundation",
  },
  {
    id: "academyos",
    name: "AcademyOS",
    domain: "AcademyOS",
    match: (p) => domainFor(p) === "AcademyOS",
  },
  {
    id: "sdk",
    name: "SDK",
    domain: "SDK",
    match: (p) => domainFor(p) === "SDK",
  },
  {
    id: "connectors",
    name: "Connectors",
    domain: "Connectors",
    match: (p) => domainFor(p) === "Connectors",
  },
  {
    id: "studio",
    name: "Studio",
    domain: "Studio",
    match: (p) => domainFor(p) === "Studio",
  },
  /**
   * Matched by path, not by domainFor - security tests live under tests/**\/security/
   * and classify as "Other", which no other suite claims, so they were invisible
   * to the workspace entirely. That also made the `required_security_validation`
   * policy unreachable: it looks for a suite whose name matches /security|hardening/,
   * and no such suite existed.
   */
  {
    id: "security",
    name: "Security",
    domain: "Foundation",
    match: (p) => /(^|\/)security\//.test(p) || /hardening/i.test(p),
  },
];

export function buildTestingWorkspace(root?: string): TestingWorkspaceView {
  const repoRoot = root ?? process.cwd();
  const files: string[] = [];
  const testsDir = join(/* turbopackIgnore: true */ repoRoot, "tests");
  if (existsSync(/* turbopackIgnore: true */ testsDir)) {
    walkTests(testsDir, repoRoot, files, 0);
  }

  const runs = listTestRuns();
  const suites: TestSuiteSummary[] = SUITE_DEFS.map((def) => {
    const suiteFiles = files.filter(def.match);
    const suiteRuns = runs.filter((r) => r.suiteId === def.id);
    const last = suiteRuns[0] ?? null;
    const total = last ? last.passed + last.failed : 0;
    return {
      id: def.id,
      name: def.name,
      domain: def.domain,
      fileCount: suiteFiles.length,
      lastPassRate:
        last && total > 0
          ? Math.round((last.passed / total) * 1000) / 10
          : null,
      lastFailures: last?.failed ?? 0,
      lastRunAt: last?.ranAt ?? null,
    };
  });

  const latestBySuite = new Map<string, TestRunRecord>();
  for (const r of runs) {
    if (!latestBySuite.has(r.suiteId)) latestBySuite.set(r.suiteId, r);
  }
  let passed = 0;
  let failed = 0;
  let covSum = 0;
  let covN = 0;
  for (const r of latestBySuite.values()) {
    passed += r.passed;
    failed += r.failed;
    if (r.coveragePercent != null) {
      covSum += r.coveragePercent;
      covN += 1;
    }
  }
  const overallPassRate =
    passed + failed === 0
      ? 100
      : Math.round((passed / (passed + failed)) * 1000) / 10;

  const trends = runs
    .slice(0, 20)
    .reverse()
    .map((r) => {
      const t = r.passed + r.failed;
      return {
        at: r.ranAt,
        passRate: t === 0 ? 100 : Math.round((r.passed / t) * 1000) / 10,
      };
    });

  return {
    suites: Object.freeze(suites),
    overallPassRate,
    totalFailures: failed,
    coverageAverage:
      covN === 0 ? null : Math.round((covSum / covN) * 10) / 10,
    trends: Object.freeze(trends),
    executionHistory: Object.freeze(runs.slice(0, 50)),
  };
}

export function createTestingWorkspaceService() {
  return {
    view: buildTestingWorkspace,
    recordRun(input: {
      suiteId: string;
      passed: number;
      failed: number;
      skipped?: number;
      coveragePercent?: number | null;
      actor: string;
    }): TestRunRecord {
      return appendTestRun({
        id: randomUUID(),
        suiteId: input.suiteId,
        passed: input.passed,
        failed: input.failed,
        skipped: input.skipped ?? 0,
        coveragePercent: input.coveragePercent ?? null,
        ranAt: new Date().toISOString(),
        actor: input.actor,
      });
    },
  };
}
