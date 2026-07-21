/**
 * Sprint P001 — static performance inventory (measure / detect only).
 * No optimizations. Filesystem + AST-light pattern scan.
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

export type ClientComponentSize = {
  path: string;
  bytes: number;
  kb: number;
};

export type QueryHotspot = {
  path: string;
  selectStarCount: number;
  awaitInLoopHints: number;
  sequentialAwaitHints: number;
};

export type StaticAuditReport = {
  generatedAt: string;
  routes: {
    pageFiles: number;
    loadingFiles: number;
    routeHandlers: number;
    majorModulePages: Record<string, number>;
  };
  clientComponents: {
    total: number;
    largest: ClientComponentSize[];
    totalClientKb: number;
  };
  database: {
    selectStarCallSites: number;
    selectStarByFile: { path: string; count: number }[];
    nPlusOneHints: { path: string; count: number; sample: string }[];
    sequentialAwaitInLoaders: { path: string; count: number }[];
  };
  providers: {
    rootInteractionProviders: string[];
    dashboardShellClient: boolean;
    /** P006: branding ∥ notifications Promise.all in dashboard/layout.tsx */
    dashboardLayoutParallelShell: boolean;
  };
  duplicates: {
    brandingLoadCallSites: number;
    getIdentityContextCallSites: number;
    executeWorkspaceBeforePromiseAll: { path: string; evidence: string }[];
  };
};

function walk(dir: string, predicate: (name: string) => boolean): string[] {
  const out: string[] = [];
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    let isDir = false;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      continue;
    }
    if (isDir) out.push(...walk(full, predicate));
    else if (predicate(entry)) out.push(full);
  }
  return out;
}

function rel(projectRoot: string, file: string) {
  return relative(projectRoot, file).replace(/\\/g, "/");
}

function read(file: string): string {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function countMatches(text: string, re: RegExp): number {
  return (text.match(re) ?? []).length;
}

/** Detect `for (...) { ... await` / `.map(async` with await patterns (heuristic). */
function countAwaitInLoopHints(text: string): number {
  let count = 0;
  const forBlocks = text.matchAll(/for\s*\([^)]*\)\s*\{[\s\S]{0,400}?await\s+/g);
  for (const _ of forBlocks) count += 1;
  const mapAsync = text.matchAll(/\.(?:map|forEach)\s*\(\s*async\s+/g);
  for (const _ of mapAsync) count += 1;
  return count;
}

/** Count consecutive top-level-ish `await foo(` lines (heuristic for sequential waterfalls). */
function countSequentialAwaits(text: string): number {
  const lines = text.split("\n");
  let streak = 0;
  let maxStreak = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^await\s+\w/.test(trimmed) && !trimmed.includes("Promise.all")) {
      streak += 1;
      maxStreak = Math.max(maxStreak, streak);
    } else if (trimmed === "" || trimmed.startsWith("//") || trimmed.startsWith("*")) {
      /* keep streak across blanks/comments */
    } else {
      streak = 0;
    }
  }
  return maxStreak >= 3 ? maxStreak : 0;
}

export function runStaticPerformanceAudit(projectRoot = process.cwd()): StaticAuditReport {
  const srcDir = join(projectRoot, "src");
  const appDir = join(srcDir, "app");
  const componentsDir = join(srcDir, "components");
  const libDir = join(srcDir, "lib");

  const pageFiles = walk(appDir, (n) => n === "page.tsx" || n === "page.ts");
  const loadingFiles = walk(appDir, (n) => n === "loading.tsx");
  const routeHandlers = walk(appDir, (n) => n === "route.ts" || n === "route.tsx");

  const modules = [
    "executive",
    "admissions",
    "students",
    "finance",
    "teacher",
    "hr",
    "admin",
    "scheduling",
    "work",
    "compliance",
  ] as const;
  const majorModulePages: Record<string, number> = {};
  for (const mod of modules) {
    majorModulePages[mod] = walk(join(appDir, "dashboard", mod), (n) => n === "page.tsx").length;
  }

  const tsxFiles = [
    ...walk(componentsDir, (n) => n.endsWith(".tsx") || n.endsWith(".ts")),
    ...walk(appDir, (n) => n.endsWith(".tsx") || n.endsWith(".ts")),
  ];

  const clientSizes: ClientComponentSize[] = [];
  let totalClientKb = 0;
  for (const file of tsxFiles) {
    const text = read(file);
    if (!/^["']use client["']/m.test(text)) continue;
    let bytes = 0;
    try {
      bytes = statSync(file).size;
    } catch {
      continue;
    }
    const kb = Math.round((bytes / 1024) * 10) / 10;
    totalClientKb += kb;
    clientSizes.push({ path: rel(projectRoot, file), bytes, kb });
  }
  clientSizes.sort((a, b) => b.bytes - a.bytes);

  const libAndApp = [
    ...walk(libDir, (n) => n.endsWith(".ts") || n.endsWith(".tsx")),
    ...walk(appDir, (n) => n.endsWith(".ts") || n.endsWith(".tsx")),
  ];

  let selectStarCallSites = 0;
  const selectStarByFile: { path: string; count: number }[] = [];
  const nPlusOneHints: { path: string; count: number; sample: string }[] = [];
  const sequentialAwaitInLoaders: { path: string; count: number }[] = [];

  for (const file of libAndApp) {
    const text = read(file);
    const starCount = countMatches(text, /\.select\(\s*["'`]?\*/g);
    if (starCount > 0) {
      selectStarCallSites += starCount;
      selectStarByFile.push({ path: rel(projectRoot, file), count: starCount });
    }
    const n1 = countAwaitInLoopHints(text);
    if (n1 > 0) {
      const sample =
        text.match(/for\s*\([^)]*\)\s*\{[\s\S]{0,120}?await\s+\w+[^\n]*/)?.[0]?.replace(/\s+/g, " ").slice(0, 140) ??
        ".map(async …)";
      nPlusOneHints.push({ path: rel(projectRoot, file), count: n1, sample });
    }
    if (/PageContent|queries\.ts|load-|morning-brief|workspace\.ts/.test(file)) {
      const seq = countSequentialAwaits(text);
      if (seq > 0) sequentialAwaitInLoaders.push({ path: rel(projectRoot, file), count: seq });
    }
  }

  selectStarByFile.sort((a, b) => b.count - a.count);
  nPlusOneHints.sort((a, b) => b.count - a.count);
  sequentialAwaitInLoaders.sort((a, b) => b.count - a.count);

  const allSrcTextFiles = walk(srcDir, (n) => n.endsWith(".ts") || n.endsWith(".tsx"));
  let brandingLoadCallSites = 0;
  let getIdentityContextCallSites = 0;
  const executeWorkspaceBeforePromiseAll: { path: string; evidence: string }[] = [];

  for (const file of allSrcTextFiles) {
    const text = read(file);
    brandingLoadCallSites += countMatches(text, /loadOrganizationBranding\s*\(/g);
    getIdentityContextCallSites += countMatches(text, /getIdentityContext\s*\(/g);

    const execIdx = text.indexOf("await executeWorkspace");
    const allIdx = text.indexOf("await Promise.all");
    if (execIdx >= 0 && allIdx > execIdx && /PageContent|morning-brief|workspace/.test(file)) {
      executeWorkspaceBeforePromiseAll.push({
        path: rel(projectRoot, file),
        evidence: "await executeWorkspace appears before await Promise.all (sequential engine → data)",
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    routes: {
      pageFiles: pageFiles.length,
      loadingFiles: loadingFiles.length,
      routeHandlers: routeHandlers.length,
      majorModulePages,
    },
    clientComponents: {
      total: clientSizes.length,
      largest: clientSizes.slice(0, 25),
      totalClientKb: Math.round(totalClientKb * 10) / 10,
    },
    database: {
      selectStarCallSites,
      selectStarByFile: selectStarByFile.slice(0, 25),
      nPlusOneHints: nPlusOneHints.slice(0, 25),
      sequentialAwaitInLoaders: sequentialAwaitInLoaders.slice(0, 25),
    },
    providers: {
      rootInteractionProviders: [
        "LiveAnnouncerProvider",
        "ToastProvider",
        "BackgroundJobsProvider",
        "GlobalProgressProvider",
      ],
      // P006: shell is a Server Component; interactive chrome lives in DashboardChrome.
      dashboardShellClient: (() => {
        try {
          const shell = read(join(componentsDir, "dashboard", "DashboardShell.tsx"));
          return /^["']use client["']/m.test(shell);
        } catch {
          return true;
        }
      })(),
      dashboardLayoutParallelShell: (() => {
        try {
          const layout = read(join(appDir, "dashboard", "layout.tsx"));
          return (
            layout.includes("Promise.all") &&
            layout.includes("getRequestWorkspaceContext") &&
            layout.includes("getStaffNotifications")
          );
        } catch {
          return false;
        }
      })(),
    },
    duplicates: {
      brandingLoadCallSites,
      getIdentityContextCallSites,
      executeWorkspaceBeforePromiseAll: executeWorkspaceBeforePromiseAll.slice(0, 20),
    },
  };
}
