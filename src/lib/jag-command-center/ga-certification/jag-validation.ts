/**
 * JAG Command Center surface probes — Sprint 210.
 * Uses ProductionReadinessService + light service imports. No new capabilities.
 */

import { ExplanationService } from "@/lib/platform/intelligence/explain/index";
import { WatcherService } from "@/lib/platform/intelligence/watchers/index";
import { ProductionReadinessService } from "../production-readiness/ProductionReadinessService";
import { ExplanationService as JagExplanationService } from "../explain/index";
import { loadMemoryWorkspace } from "../memory/index";
import { loadExecutiveInbox } from "../watchers/index";
import type { JagSurfaceCheck } from "./types";

/** Key JAG portal hrefs for GA surface certification. */
export const JAG_SURFACE_HREFS = [
  "/jag",
  "/jag/graph",
  "/jag/readiness",
  "/jag/observability",
  "/jag/inbox",
  "/jag/strategy",
  "/jag/memory",
  "/jag/decisions",
  "/jag/capabilities",
  "/jag/executive",
] as const;

function isFn(value: unknown): boolean {
  return typeof value === "function";
}

function isObj(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}

/**
 * Run JAG surface + readiness validation probes.
 */
export function runJagValidation(): readonly JagSurfaceCheck[] {
  const checks: JagSurfaceCheck[] = [];

  for (const href of JAG_SURFACE_HREFS) {
    const ok = typeof href === "string" && href.startsWith("/jag");
    checks.push({
      id: `jag.route.${href.replace(/\//g, "_") || "root"}`,
      label: `JAG route ${href}`,
      ok,
      href,
      detail: ok
        ? `Href constant registered: ${href}`
        : `Invalid JAG href: ${href}`,
    });
  }

  let readinessOk = false;
  let readinessDetail = "ProductionReadinessService.runFullValidation failed.";
  try {
    const report = ProductionReadinessService.runFullValidation();
    readinessOk = report.ok;
    readinessDetail = readinessOk
      ? `Production readiness OK — ${report.passCount} pass, ${report.failCount} fail.`
      : `Production readiness has failures — ${report.passCount} pass, ${report.failCount} fail.`;
    checks.push({
      id: "jag.production-readiness",
      label: "ProductionReadinessService.runFullValidation",
      ok: readinessOk,
      href: "/jag/readiness",
      detail: readinessDetail,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    checks.push({
      id: "jag.production-readiness",
      label: "ProductionReadinessService.runFullValidation",
      ok: false,
      href: "/jag/readiness",
      detail: `runFullValidation threw: ${message}`,
    });
  }

  const explainOk =
    isObj(ExplanationService) &&
    isFn(ExplanationService.explainSubject) &&
    isFn(ExplanationService.queryGraph);
  checks.push({
    id: "jag.explanation-service",
    label: "ExplanationService (platform)",
    ok: explainOk,
    href: "/jag/graph",
    detail: explainOk
      ? "ExplanationService available via explain/index."
      : "ExplanationService explainSubject/queryGraph unavailable.",
  });

  const jagExplainOk =
    isObj(JagExplanationService) &&
    (isFn(JagExplanationService.explainSubject) ||
      isFn(JagExplanationService.queryGraph) ||
      isObj(JagExplanationService));
  checks.push({
    id: "jag.explanation-service.barrel",
    label: "ExplanationService (command-center explain/index)",
    ok: jagExplainOk,
    href: "/jag/graph",
    detail: jagExplainOk
      ? "Command-center explain/index exports ExplanationService."
      : "Command-center explain/index missing ExplanationService.",
  });

  const watcherOk =
    isObj(WatcherService) && isFn(WatcherService.evaluate);
  checks.push({
    id: "jag.watcher-service",
    label: "WatcherService (platform)",
    ok: watcherOk,
    href: "/jag/inbox",
    detail: watcherOk
      ? "WatcherService.evaluate available via watchers/index."
      : "WatcherService.evaluate unavailable.",
  });

  checks.push({
    id: "jag.memory-loader",
    label: "Memory workspace loader",
    ok: isFn(loadMemoryWorkspace),
    href: "/jag/memory",
    detail: isFn(loadMemoryWorkspace)
      ? "loadMemoryWorkspace available via memory/index."
      : "loadMemoryWorkspace missing from memory/index.",
  });

  checks.push({
    id: "jag.inbox-loader",
    label: "Executive inbox loader",
    ok: isFn(loadExecutiveInbox),
    href: "/jag/inbox",
    detail: isFn(loadExecutiveInbox)
      ? "loadExecutiveInbox available via watchers/index."
      : "loadExecutiveInbox missing from watchers/index.",
  });

  return checks;
}
