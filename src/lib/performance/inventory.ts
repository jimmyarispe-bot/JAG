/**
 * Static inventory for bundle / route reports (filesystem scan).
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

function walk(dir: string, predicate: (name: string) => boolean): string[] {
  const out: string[] = [];
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let isDir = false;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      continue;
    }
    if (isDir) {
      out.push(...walk(full, predicate));
    } else if (predicate(entry)) {
      out.push(full);
    }
  }
  return out;
}

function countUseClient(files: string[]): number {
  let count = 0;
  for (const file of files) {
    try {
      const text = readFileSync(file, "utf8");
      if (/^["']use client["']/m.test(text)) count += 1;
    } catch {
      /* ignore */
    }
  }
  return count;
}

export function buildRouteInventory(projectRoot = process.cwd()) {
  const appDir = join(projectRoot, "src", "app");
  const execApp = join(appDir, "exec");
  const execComponents = join(projectRoot, "src", "components", "exec");

  const routeFiles = walk(appDir, (n) => n === "page.tsx" || n === "page.ts" || n === "route.ts");
  const execPages = walk(execApp, (n) => n.endsWith(".tsx") || n.endsWith(".ts"));
  const execComponentFiles = walk(execComponents, (n) => n.endsWith(".tsx") || n.endsWith(".ts"));

  const execClient = countUseClient([...execPages, ...execComponentFiles]);
  const execServer = Math.max(0, execPages.length + execComponentFiles.length - execClient);

  return {
    appRouteFiles: routeFiles.length,
    execRoutes: walk(execApp, (n) => n === "page.tsx").length,
    execClientComponents: execClient,
    execServerComponents: execServer,
    sampleRoutes: routeFiles.slice(0, 12).map((f) => f.replace(projectRoot, "").replace(/\\/g, "/")),
  };
}

export function buildBundleReport() {
  return [
    {
      area: "components/exec (client islands)",
      clientComponentCount: 6,
      serverComponentHint: "Prefer Server Components for page bodies",
      notes:
        "P010: IntegrationsPage / IntegrationDetailPage are dynamic()-split on their routes; ExecShell/Nav remain chrome.",
    },
    {
      area: "executive + edi panels",
      clientComponentCount: 0,
      serverComponentHint: "Per-panel modules + route dynamic()",
      notes:
        "P010: ExecutivePanels/EdiPanels barrels re-export split files; pages import panels via next/dynamic.",
    },
    {
      area: "app/exec routes",
      clientComponentCount: 0,
      serverComponentHint: "All page.tsx are async Server Components",
      notes: "Good baseline — data loading stays on the server.",
    },
    {
      area: "Intelligence DI",
      clientComponentCount: 0,
      serverComponentHint: "Server-only",
      notes: "createIntelligenceService wires 39 modules — keep off the client bundle.",
    },
    {
      area: "Integration Platform",
      clientComponentCount: 0,
      serverComponentHint: "Server-only",
      notes:
        "Connector registry + bootstrap must remain server-side; never import into client components.",
    },
    {
      area: "Bundle tooling",
      clientComponentCount: 0,
      serverComponentHint: "n/a",
      notes: "npm run analyze (webpack analyzer) + npm run bundle:budget (client source ceilings).",
    },
  ];
}
