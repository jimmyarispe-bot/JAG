/**
 * Sprint P001 — Platform Performance Intelligence audit aggregator.
 * Combines live probe measurements + static inventory into a ranked bottleneck report.
 * Does not optimize or change business logic.
 */

import { buildDetections } from "./detections";
import { buildBundleReport, buildRouteInventory } from "./inventory";
import { runPerformanceProbe } from "./probe";
import { runStaticPerformanceAudit, type StaticAuditReport } from "./static-audit";
import type { PerfProbeReport } from "./types";

export type BottleneckEffort = "S" | "M" | "L";
export type BottleneckImpact = "critical" | "high" | "medium" | "low";

export type RankedBottleneck = {
  rank: number;
  id: string;
  area: "navigation" | "server" | "database" | "react" | "network" | "bundle" | "route";
  target: string;
  timeMs: number | null;
  timeNote: string;
  rootCause: string;
  estimatedImpact: BottleneckImpact;
  effort: BottleneckEffort;
  estimatedGainMs: string;
  recommendedFix: string;
  roiScore: number;
};

export type P001AuditReport = {
  sprint: "P001";
  generatedAt: string;
  methodology: string[];
  liveProbe: PerfProbeReport;
  staticAudit: StaticAuditReport;
  navigationPhases: {
    phase: string;
    measured: string;
    notes: string;
  }[];
  slowestPages: {
    route: string;
    label: string;
    totalMs: number;
    breakdown: string;
  }[];
  slowestReactComponents: {
    path: string;
    kb: number;
    reason: string;
  }[];
  slowestDatabasePatterns: {
    path: string;
    pattern: string;
    count: number;
    evidence: string;
  }[];
  largestBundles: {
    area: string;
    metric: string;
    notes: string;
  }[];
  duplicateRequests: {
    pattern: string;
    evidence: string;
    estimatedWaste: string;
  }[];
  top25: RankedBottleneck[];
  recommendedOptimizationOrder: string[];
  estimatedPerformanceGains: {
    ifTop5Fixed: string;
    ifTop15Fixed: string;
    notes: string;
  };
};

function impactWeight(i: BottleneckImpact): number {
  return i === "critical" ? 4 : i === "high" ? 3 : i === "medium" ? 2 : 1;
}

function effortWeight(e: BottleneckEffort): number {
  return e === "S" ? 3 : e === "M" ? 2 : 1;
}

function roi(impact: BottleneckImpact, effort: BottleneckEffort, timeMs: number | null): number {
  const t = timeMs ?? 80;
  return Math.round(impactWeight(impact) * effortWeight(effort) * Math.min(t, 2000) / 10);
}

export async function runP001PerformanceAudit(): Promise<P001AuditReport> {
  const liveProbe = await runPerformanceProbe();
  const staticAudit = runStaticPerformanceAudit();

  const candidates: Omit<RankedBottleneck, "rank" | "roiScore">[] = [];

  // --- Live probe measurements ---
  for (const route of liveProbe.routeTimings) {
    if (route.totalMs < 50) continue;
    candidates.push({
      id: `probe-${route.route}`,
      area: "route",
      target: route.route,
      timeMs: route.totalMs,
      timeNote: `Measured loader probe: intel=${route.intelligenceMs}ms int=${route.integrationsMs}ms sync=${route.syncMs}ms build=${route.buildMs}ms org=${route.orgResolutionMs}ms`,
      rootCause: "ECC route pays intelligence + integrations + connector sync + org resolve + domain build",
      estimatedImpact: route.totalMs > 500 ? "high" : "medium",
      effort: "M",
      estimatedGainMs: `${Math.round(route.totalMs * 0.35)}–${Math.round(route.totalMs * 0.6)}ms`,
      recommendedFix: "Keep singletons warm; parallelize independent builds; skip sync when stores hot",
    });
  }

  const lazyIntelMs = liveProbe.comparisons.intelligenceLazyColdMs;
  const eagerIntelMs = liveProbe.comparisons.intelligenceColdMs;
  // Rank residual first-process cost only when lazy shell is still material (P005 regression).
  if (lazyIntelMs > 15) {
    candidates.push({
      id: "intel-cold-start",
      area: "server",
      target: "createIntelligenceService lazy shell",
      timeMs: lazyIntelMs,
      timeNote: `Lazy shell=${lazyIntelMs}ms eager full=${eagerIntelMs}ms warm=${liveProbe.comparisons.intelligenceWarmMs}ms`,
      rootCause:
        "Intelligence service shell / cognitive registry still expensive before domain stacks materialise",
      estimatedImpact: lazyIntelMs > 40 ? "high" : "medium",
      effort: "M",
      estimatedGainMs: `${Math.round(lazyIntelMs * 0.5)}–${Math.round(lazyIntelMs * 0.8)}ms on first process hit`,
      recommendedFix: "Further defer cognitive domain registration; keep lazy stacks + process singleton",
    });
  } else if (eagerIntelMs > 40 && liveProbe.comparisons.intelligenceWarmMs < 1) {
    // Informational: eager full-graph cost remains for rare full-platform consumers.
    candidates.push({
      id: "intel-cold-start",
      area: "server",
      target: "createIntelligenceService (eager 39 modules)",
      timeMs: eagerIntelMs,
      timeNote: `Eager full=${eagerIntelMs}ms lazy shell=${lazyIntelMs}ms warm=${liveProbe.comparisons.intelligenceWarmMs}ms`,
      rootCause:
        "Full 39-module graph is deferred (P005 lazy); residual is first access of intelligencePlatform / eager benchmark path",
      estimatedImpact: "low",
      effort: "L",
      estimatedGainMs: "N/A — ECC hot path uses lazy + hot-stack prewarm",
      recommendedFix: "Keep eagerStacks only for tests/benchmarks; avoid .intelligencePlatform on dashboard load",
    });
  }

  if (
    liveProbe.comparisons.integrationsColdMs > 40 &&
    liveProbe.comparisons.integrationsWarmMs < 1 &&
    !liveProbe.singletons.integrationsInitialized
  ) {
    candidates.push({
      id: "integrations-cold-start",
      area: "server",
      target: "Integration platform bootstrap",
      timeMs: liveProbe.comparisons.integrationsColdMs,
      timeNote: `Cold=${liveProbe.comparisons.integrationsColdMs}ms warm=${liveProbe.comparisons.integrationsWarmMs}ms`,
      rootCause: "Integration singleton not warm — process paid full create+bootstrap",
      estimatedImpact: "high",
      effort: "S",
      estimatedGainMs: `${Math.round(liveProbe.comparisons.integrationsColdMs * 0.9)}ms per cold request`,
      recommendedFix: "Ensure getIntegrationManagement singleton + shared registered platform",
    });
  } else if (liveProbe.comparisons.integrationsColdMs > 60) {
    candidates.push({
      id: "integrations-cold-start",
      area: "server",
      target: "Integration platform bootstrap (process recycle)",
      timeMs: liveProbe.comparisons.integrationsColdMs,
      timeNote: `Cold bench=${liveProbe.comparisons.integrationsColdMs}ms warm singleton=${liveProbe.comparisons.integrationsWarmMs}ms init=${liveProbe.singletons.integrationsInitMs}ms`,
      rootCause:
        "First-process parallel connector bootstrap remains; subsequent requests reuse singleton (0ms)",
      estimatedImpact: "medium",
      effort: "M",
      estimatedGainMs: "Defer non-ECC connector bootstrap until first ensure*Synced",
      recommendedFix: "Optional: bootstrap only academyos/square/qb/plaid/google on ECC init",
    });
  }

  // --- Auth / navigation chain (post-P002 residual) ---
  candidates.push({
    id: "edge-rsc-session-dual-runtime",
    area: "navigation",
    target: "middleware getUser + RSC getAuthUser",
    timeMs: null,
    timeNote: "Edge and RSC cannot share React.cache; both call Supabase getUser (expected dual-runtime)",
    rootCause: "Next.js Edge + RSC separate runtimes — session verified twice across the boundary",
    estimatedImpact: "medium",
    effort: "L",
    estimatedGainMs: "20–60ms if edge decodes JWT without network round-trip",
    recommendedFix: "Optional: JWT decode at edge; keep RSC getAuthUser as source of truth",
  });

  if (!staticAudit.providers.dashboardLayoutParallelShell) {
    candidates.push({
      id: "dashboard-layout-waterfall",
      area: "server",
      target: "dashboard/layout.tsx",
      timeMs: null,
      timeNote: "auth → requireAuthorizedRoute → sequential branding/notifications",
      rootCause: "Shell branding and staff notifications still load sequentially",
      estimatedImpact: "medium",
      effort: "S",
      estimatedGainMs: "20–80ms (est.)",
      recommendedFix: "Promise.all([getRequestWorkspaceContext(), getStaffNotifications(ctx.id)])",
    });
  } else {
    candidates.push({
      id: "dashboard-layout-waterfall",
      area: "server",
      target: "dashboard/layout.tsx",
      timeMs: null,
      timeNote: "auth → requireAuthorizedRoute → Promise.all(branding ∥ notifications)",
      rootCause:
        "Authz must stay sequential; shell data is parallelized (P006). Residual: nested module layout re-gates",
      estimatedImpact: "low",
      effort: "L",
      estimatedGainMs: "5–20ms (est.) on nested layout ticks",
      recommendedFix: "Keep defense-in-depth gates; rely on React.cache for identity dedupe",
    });
  }

  // executeWorkspace before Promise.all
  for (const hit of staticAudit.duplicates.executeWorkspaceBeforePromiseAll.slice(0, 6)) {
    candidates.push({
      id: `exec-ws-seq-${hit.path}`,
      area: "route",
      target: hit.path,
      timeMs: null,
      timeNote: hit.evidence,
      rootCause: "Work-queue pages await executeWorkspace before domain Promise.all",
      estimatedImpact: "high",
      effort: "M",
      estimatedGainMs: "100–400ms (est.)",
      recommendedFix: "Start independent domain queries in parallel with executeWorkspace; merge after",
    });
  }

  // N+1
  for (const n1 of staticAudit.database.nPlusOneHints.slice(0, 8)) {
    candidates.push({
      id: `n1-${n1.path}`,
      area: "database",
      target: n1.path,
      timeMs: null,
      timeNote: `${n1.count} loop/await hints; sample: ${n1.sample}`,
      rootCause: "N+1 query pattern — per-row awaits multiply DB round-trips",
      estimatedImpact: n1.count >= 3 ? "critical" : "high",
      effort: "M",
      estimatedGainMs: "200–2000ms+ under load (est.)",
      recommendedFix: "Batch with .in() / single join query; Promise.all only as interim",
    });
  }

  // select *
  const topStar = staticAudit.database.selectStarByFile.slice(0, 5);
  if (staticAudit.database.selectStarCallSites > 50) {
    candidates.push({
      id: "select-star-surface",
      area: "database",
      target: `${staticAudit.database.selectStarCallSites} select('*') call sites`,
      timeMs: null,
      timeNote: `Top files: ${topStar.map((f) => `${f.path}(${f.count})`).join(", ")}`,
      rootCause: "Wide column selection increases payload, serialization, and hydration cost",
      estimatedImpact: "high",
      effort: "L",
      estimatedGainMs: "10–30% payload reduction on hot lists (est.)",
      recommendedFix: "Column lists on hot path queries (leads, notifications, students, invoices)",
    });
  }

  // React / client bundle
  for (const c of staticAudit.clientComponents.largest.slice(0, 8)) {
    if (c.kb < 8) continue;
    candidates.push({
      id: `client-${c.path}`,
      area: "react",
      target: c.path,
      timeMs: null,
      timeNote: `${c.kb} KB source (use client boundary)`,
      rootCause: "Large client component increases JS parse/hydrate cost for every consumer route",
      estimatedImpact: c.kb > 25 ? "high" : "medium",
      effort: c.kb > 40 ? "L" : "M",
      estimatedGainMs: "20–150ms hydration (est.)",
      recommendedFix: "Split islands; keep data tables/forms as server where possible; dynamic import rare panels",
    });
  }

  if (staticAudit.providers.dashboardShellClient) {
    candidates.push({
      id: "dashboard-shell-client",
      area: "react",
      target: "components/dashboard/DashboardShell.tsx",
      timeMs: null,
      timeNote: "Client boundary wraps entire dashboard tree (Sidebar + TopNav + BrandingProvider)",
      rootCause: "Shell client boundary forces large interactive tree into hydration path",
      estimatedImpact: "high",
      effort: "M",
      estimatedGainMs: "30–100ms hydration (est.)",
      recommendedFix: "Server shell chrome; client islands only for sidebar toggle + notifications bell",
    });
  } else {
    candidates.push({
      id: "dashboard-shell-client",
      area: "react",
      target: "components/dashboard/DashboardChrome.tsx",
      timeMs: null,
      timeNote: "P006: DashboardShell is RSC; hydration limited to DashboardChrome island",
      rootCause: "Residual client chrome (Sidebar/TopNav pathname + sidebar open state)",
      estimatedImpact: "low",
      effort: "M",
      estimatedGainMs: "5–20ms hydration (est.)",
      recommendedFix: "Further split notifications bell / sign-out into smaller islands if measured",
    });
  }

  candidates.push({
    id: "interaction-providers",
    area: "react",
    target: "InteractionProviders (4 nested contexts)",
    timeMs: null,
    timeNote: staticAudit.providers.rootInteractionProviders.join(" → "),
    rootCause:
      "Root provider stack remains app-wide; P006 splits progress/jobs state from mutator APIs to limit re-renders",
    estimatedImpact: "low",
    effort: "S",
    estimatedGainMs: "2–10ms (est.)",
    recommendedFix: "Keep providers at root for toast/action feedback; avoid relocating without form inventory",
  });

  candidates.push({
    id: "bundle-budget-hygiene",
    area: "bundle",
    target: "npm run analyze / npm run perf:regression",
    timeMs: null,
    timeNote: "RC-1: bundle budgets + perf-baselines.json gated in CI via perf:regression",
    rootCause: "Bundle graphs drift unless re-checked after large client modules land",
    estimatedImpact: "low",
    effort: "S",
    estimatedGainMs: "Measurement hygiene",
    recommendedFix: "Keep client islands under source budget; refresh baselines when intentional",
  });

  candidates.push({
    id: "observability-otlp-export",
    area: "server",
    target: "OTLP multi-instance aggregation",
    timeMs: null,
    timeNote: "RC-1: in-process spans/metrics/RUM live; OTLP export optional via OTEL_EXPORTER_OTLP_ENDPOINT",
    rootCause: "Process-local stores do not aggregate across serverless isolates without an exporter",
    estimatedImpact: "low",
    effort: "M",
    estimatedGainMs: "Ops visibility (not latency)",
    recommendedFix: "Set OTEL_EXPORTER_OTLP_ENDPOINT in production; scrape /api/observability/metrics per instance",
  });

  candidates.push({
    id: "large-route-surface",
    area: "bundle",
    target: `${staticAudit.routes.pageFiles} page.tsx routes`,
    timeMs: null,
    timeNote: `loading.tsx=${staticAudit.routes.loadingFiles}; modules=${JSON.stringify(staticAudit.routes.majorModulePages)}`,
    rootCause: "Large route graph increases build graph and accidental client import risk",
    estimatedImpact: "medium",
    effort: "L",
    estimatedGainMs: "Build-time / rare-route TTI (est.)",
    recommendedFix: "Lazy rarely used admin/cloud routes; keep module entry pages lean",
  });

  // Save → UI / Refresh phases (instrumentation coverage notes)
  candidates.push({
    id: "mutation-feedback-unmeasured",
    area: "navigation",
    target: "Save → UI Updated / Refresh → Interactive",
    timeMs: null,
    timeNote: "RC-1 observeServerAction helper available; mutation UX path not yet wrapped",
    rootCause: "Mutation→revalidation latency not emitted on every form save path",
    estimatedImpact: "medium",
    effort: "S",
    estimatedGainMs: "Measurement enablement",
    recommendedFix: "Wrap runMutation/useActionFeedback with observeServerAction (instrument only)",
  });

  const scored = candidates
    .map((c) => ({
      ...c,
      roiScore: roi(c.estimatedImpact, c.effort, c.timeMs),
    }))
    .sort((a, b) => b.roiScore - a.roiScore || (b.timeMs ?? 0) - (a.timeMs ?? 0))
    .slice(0, 25)
    .map((c, i) => ({ ...c, rank: i + 1 }));

  const slowestPages = liveProbe.routeTimings
    .slice()
    .sort((a, b) => b.totalMs - a.totalMs)
    .map((r) => ({
      route: r.route,
      label: r.label,
      totalMs: r.totalMs,
      breakdown: `intel ${r.intelligenceMs} | int ${r.integrationsMs} | sync ${r.syncMs} | build ${r.buildMs} | org ${r.orgResolutionMs}`,
    }));

  // Merge static module pages as structural "slow page" candidates without live DB
  const structuralPages = [
    { route: "/dashboard", label: "Founder Dashboard", note: "morning brief + intelligence workspace + branding×N" },
    { route: "/dashboard/executive", label: "Executive Intelligence", note: "executeWorkspace → loadExecutiveIntelligenceWorkspace" },
    { route: "/dashboard/admissions", label: "Admissions", note: "executeWorkspace → leads + work data" },
    { route: "/dashboard/students", label: "Students", note: "executeWorkspace → students + stats + work queue" },
    { route: "/dashboard/finance", label: "Finance", note: "executeWorkspace → stats/invoices/accounts or 9-query legacy" },
    { route: "/dashboard/teacher", label: "Teacher", note: "6-query fan-out + jag profiles + work queue" },
    { route: "/dashboard/hr", label: "HR", note: "executeWorkspace → 5-query fan-out or 11-query legacy" },
    { route: "/dashboard/admin/configuration", label: "Configuration", note: "Light hub; child pages heavier" },
  ];

  return {
    sprint: "P001",
    generatedAt: new Date().toISOString(),
    methodology: [
      "Live ECC performance probe (runPerformanceProbe) — timed intelligence/integrations/sync/org/loader spans",
      "Static filesystem audit — client component sizes, select('*'), N+1 hints, sequential await streaks",
      "Architecture review — middleware + dashboard layout auth chain (no behavior changes)",
      "Server-Timing instrumentation hooks added for middleware/layout (measure-only)",
      "Navigation phases Login→Dashboard / Module→Detail estimated from chain structure until authenticated RUM available",
    ],
    liveProbe,
    staticAudit,
    navigationPhases: [
      {
        phase: "Login → Dashboard",
        measured: "Partial (auth chain structure + Server-Timing marks)",
        notes: "Full RUM requires authenticated browser session; middleware getUser + layout identity dominate TTFB",
      },
      {
        phase: "Dashboard → Module",
        measured: "Structural + loading.tsx progressive shells",
        notes: "Module layouts re-gate permissions; work-queue pages sequential executeWorkspace",
      },
      {
        phase: "Module → Detail",
        measured: "Static (profile section loaders)",
        notes: "Employee/student profile sections re-call loadEmployeeRecord / wide selects",
      },
      {
        phase: "Save → UI Updated",
        measured: "Not yet exported",
        notes: "useActionFeedback exists; spans not committed to probe store in P001 baseline",
      },
      {
        phase: "Refresh → Interactive",
        measured: "Hydration meter exists (admin performance page)",
        notes: "recordHydrationMark available; sparse production samples",
      },
    ],
    slowestPages: [
      ...slowestPages,
      ...structuralPages.map((p) => ({
        route: p.route,
        label: p.label,
        totalMs: -1,
        breakdown: `Structural (not live-probed): ${p.note}`,
      })),
    ],
    slowestReactComponents: staticAudit.clientComponents.largest.slice(0, 15).map((c) => ({
      path: c.path,
      kb: c.kb,
      reason: "use client boundary — counts toward hydration/JS parse",
    })),
    slowestDatabasePatterns: [
      ...staticAudit.database.nPlusOneHints.slice(0, 10).map((n) => ({
        path: n.path,
        pattern: "N+1 / await-in-loop",
        count: n.count,
        evidence: n.sample,
      })),
      ...staticAudit.database.selectStarByFile.slice(0, 10).map((s) => ({
        path: s.path,
        pattern: "select('*')",
        count: s.count,
        evidence: `${s.count} wide selects in file`,
      })),
    ],
    largestBundles: [
      {
        area: "All use client components (source KB)",
        metric: `${staticAudit.clientComponents.total} files / ${staticAudit.clientComponents.totalClientKb} KB`,
        notes: "Source size ≠ gzipped bundle; analyzer not wired",
      },
      ...buildBundleReport().map((b) => ({
        area: b.area,
        metric: `${b.clientComponentCount} client components`,
        notes: b.notes,
      })),
      {
        area: "App routes",
        metric: `${staticAudit.routes.pageFiles} pages / ${staticAudit.routes.routeHandlers} handlers`,
        notes: buildRouteInventory().sampleRoutes.slice(0, 6).join(", "),
      },
    ],
    duplicateRequests: [
      {
        pattern: "Organization branding",
        evidence: `${staticAudit.duplicates.brandingLoadCallSites} call sites; session + layout (+ page) overlap`,
        estimatedWaste: "1–2 redundant round-trips per dashboard navigation",
      },
      {
        pattern: "Identity / authz",
        evidence: `middleware loadAuthzSnapshot + ${staticAudit.duplicates.getIdentityContextCallSites} getIdentityContext sites`,
        estimatedWaste: "Edge + RSC duplicate role/permission work",
      },
      {
        pattern: "executeWorkspace then domain queries",
        evidence: `${staticAudit.duplicates.executeWorkspaceBeforePromiseAll.length} loader files with sequential engine→data`,
        estimatedWaste: "Full engine latency added before parallel data starts",
      },
    ],
    top25: scored,
    recommendedOptimizationOrder: scored.slice(0, 15).map((b) => `${b.rank}. [${b.area}] ${b.target}`),
    estimatedPerformanceGains: {
      ifTop5Fixed: "Est. 300–900ms off authenticated dashboard TTFB / ECC cold navigations",
      ifTop15Fixed: "Est. 0.8–2.5s off heavy module work-queue + N+1 pages under realistic data",
      notes: "Gains are estimates from probe deltas + structural multiplicity; validate with Server-Timing + RUM before claiming",
    },
  };
}

/** Keep detections import used when expanding probe parity. */
export function probeDetections(report: PerfProbeReport) {
  return buildDetections(report);
}
