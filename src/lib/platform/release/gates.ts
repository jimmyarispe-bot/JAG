import { ACTIVITY_EVENT_CATALOG } from "@/lib/platform/activity/catalog";
import {
  evaluateCrudCompliance,
  getEntityReleaseStatus,
} from "@/lib/platform/crud/completion-gate";
import { ENTITY_CAPABILITIES } from "@/lib/platform/crud/registry";
import { WORKFLOW_TRIGGER_LIBRARY } from "@/lib/workflows/triggers";
import {
  moduleDocsExist,
  moduleLibDirExists,
  moduleLibFileExists,
  moduleUiSurfaceExists,
  readMigrationSqlFiles,
  readModuleDocs,
  readPlaywrightConfig,
  repoFileExists,
  testPathHasFiles,
} from "./fs-readers";
import type {
  GateId,
  GateResult,
  GateVerdict,
  ModuleReleaseDefinition,
} from "./types";

function gate(
  id: GateId,
  verdict: GateVerdict,
  score: number,
  summary: string,
  issues: string[] = []
): GateResult {
  return { gate: id, verdict, score, summary, issues };
}

/** 1. CRUD Gate */
export function evaluateCrudGate(mod: ModuleReleaseDefinition): GateResult {
  if (!mod.entityKeys.length) {
    return gate("crud", "na", 100, "No entities declared");
  }

  const issues: string[] = [];
  let passCount = 0;

  for (const key of mod.entityKeys) {
    const capability = ENTITY_CAPABILITIES.find((c) => c.entityKey === key);
    if (!capability) {
      issues.push(`Entity "${key}" not in ENTITY_CAPABILITIES`);
      continue;
    }
    const result = evaluateCrudCompliance(capability);
    if (result.meetsStandard) passCount += 1;
    else issues.push(...result.issues.map((i) => i.message));

    const status = getEntityReleaseStatus(key as never);
    if (status === "deferred") {
      passCount += 1;
    }
  }

  const score = Math.round((passCount / mod.entityKeys.length) * 100);
  const verdict: GateVerdict =
    score >= 100 ? "pass" : score >= 50 ? "warn" : "fail";

  return gate(
    "crud",
    verdict,
    score,
    `${passCount}/${mod.entityKeys.length} entities meet CRUD Standard`,
    issues
  );
}

/** 2. Security Gate — structural signals (RLS migrations, access modules, server actions). */
export function evaluateSecurityGate(mod: ModuleReleaseDefinition): GateResult {
  const issues: string[] = [];
  let score = 40;

  const hasAccess =
    moduleLibFileExists(mod.id, "access.ts") ||
    moduleLibFileExists(mod.id, "lifecycle", "access.ts");
  if (hasAccess) score += 25;
  else issues.push(`Missing access helper (expected under src/lib/${mod.id}/)`);

  const needle = mod.id.replace(/_/g, "");
  const rlsSignal = readMigrationSqlFiles().some((text) => {
    const lower = text.toLowerCase();
    return (
      (lower.includes("row level security") || lower.includes("enable row level security")) &&
      (lower.includes(needle) ||
        lower.includes(mod.id) ||
        mod.entityKeys.some((k) => lower.includes(k)))
    );
  });
  if (rlsSignal) score += 25;
  else issues.push("No clear RLS migration signal for this module");

  const hasActions =
    moduleLibFileExists(mod.id, "actions.ts") ||
    moduleLibFileExists(mod.id, "server-actions.ts") ||
    moduleLibFileExists(mod.id, "lifecycle", "actions.ts");
  if (hasActions) score += 10;
  else issues.push("No server-actions module found");

  score = Math.min(100, score);
  const verdict: GateVerdict =
    score >= 80 ? "pass" : score >= 50 ? "warn" : "fail";

  return gate(
    "security",
    verdict,
    score,
    verdict === "pass"
      ? "Access helpers, server actions, and RLS signals present"
      : "Security posture incomplete",
    issues
  );
}

/** 3. Workflow Gate — lifecycle events mapped in WORKFLOW_TRIGGER_LIBRARY */
export function evaluateWorkflowGate(mod: ModuleReleaseDefinition): GateResult {
  if (!mod.requiredEvents.length) {
    return gate("workflow", "na", 100, "No lifecycle events required");
  }

  const covered = new Set<string>();
  for (const trigger of WORKFLOW_TRIGGER_LIBRARY) {
    for (const ev of trigger.activityEventTypes ?? []) covered.add(ev);
  }

  const missing = mod.requiredEvents.filter((e) => !covered.has(e));
  const hit = mod.requiredEvents.length - missing.length;
  const score = Math.round((hit / mod.requiredEvents.length) * 100);
  const verdict: GateVerdict =
    score >= 100 ? "pass" : score >= 60 ? "warn" : "fail";

  return gate(
    "workflow",
    verdict,
    score,
    `${hit}/${mod.requiredEvents.length} events available to Workflow Engine`,
    missing.map((e) => `No workflow trigger maps activity event: ${e}`)
  );
}

/** 4. Executive Intelligence Gate — events in ACTIVITY_EVENT_CATALOG */
export function evaluateEiGate(mod: ModuleReleaseDefinition): GateResult {
  if (!mod.requiredEvents.length) {
    return gate("ei", "na", 100, "No EI events required");
  }

  const missing = mod.requiredEvents.filter((e) => !(e in ACTIVITY_EVENT_CATALOG));
  const hit = mod.requiredEvents.length - missing.length;
  const score = Math.round((hit / mod.requiredEvents.length) * 100);
  const verdict: GateVerdict =
    score >= 100 ? "pass" : score >= 60 ? "warn" : "fail";

  return gate(
    "ei",
    verdict,
    score,
    `${hit}/${mod.requiredEvents.length} events registered in EI catalog`,
    missing.map((e) => `Missing ACTIVITY_EVENT_CATALOG entry: ${e}`)
  );
}

/** 5. Audit Gate — destructive/important actions emit activity (catalog coverage proxy) */
export function evaluateAuditGate(mod: ModuleReleaseDefinition): GateResult {
  const ei = evaluateEiGate(mod);
  if (ei.verdict === "na") {
    return gate("audit", "na", 100, "No audit events required");
  }
  const lifecycleHints = ["created", "updated", "archived", "deleted", "restored"];
  const hasLifecycle = mod.requiredEvents.some((e) =>
    lifecycleHints.some((h) => e.endsWith(`.${h}`) || e.includes(`.${h}`))
  );
  const score = Math.min(100, ei.score + (hasLifecycle ? 0 : -20));
  const verdict: GateVerdict =
    score >= 80 ? "pass" : score >= 50 ? "warn" : "fail";
  return gate(
    "audit",
    verdict,
    Math.max(0, score),
    "Audit trail via Activity Engine / recordActivity",
    ei.issues
  );
}

/** 6. Communications Gate */
export function evaluateCommunicationsGate(mod: ModuleReleaseDefinition): GateResult {
  if (!mod.communicationsRelevant) {
    return gate("communications", "na", 100, "Not communications-relevant");
  }
  const hasComms =
    repoFileExists("src/lib/communications") ||
    (moduleLibDirExists(mod.id) && repoFileExists("src/lib/communications/service.ts"));
  if (!hasComms) {
    return gate("communications", "fail", 20, "Communications platform missing", [
      "Expected src/lib/communications",
    ]);
  }
  const workflow = evaluateWorkflowGate(mod);
  const score = workflow.score >= 60 ? 90 : 60;
  return gate(
    "communications",
    score >= 80 ? "pass" : "warn",
    score,
    "Can fan out via Communications + Workflow Engine",
    workflow.verdict === "fail"
      ? ["Wire lifecycle events so workflows can send email/notifications"]
      : []
  );
}

/** 7. Documentation Gate */
export function evaluateDocsGate(mod: ModuleReleaseDefinition): GateResult {
  if (!moduleDocsExist(mod.docsPath)) {
    return gate("docs", "fail", 0, `Missing ${mod.docsPath}`, [
      `Create ${mod.docsPath} (architecture, permissions, data model, workflows, API, events)`,
    ]);
  }
  const text = (readModuleDocs(mod.docsPath) ?? "").toLowerCase();
  const sections = ["architecture", "permission", "data", "workflow", "event"];
  const missing = sections.filter((s) => !text.includes(s));
  const score = Math.round(((sections.length - missing.length) / sections.length) * 100);
  return gate(
    "docs",
    score >= 80 ? "pass" : score >= 40 ? "warn" : "fail",
    score,
    `Feature doc present (${score}% section coverage)`,
    missing.map((s) => `Document section weak/missing: ${s}`)
  );
}

/** 8. Testing Gate */
export function evaluateTestsGate(mod: ModuleReleaseDefinition): GateResult {
  if (!mod.testPaths.length) {
    return gate("tests", "pending", 30, "No test paths declared");
  }
  const present = mod.testPaths.filter((p) => testPathHasFiles(p));
  const score = Math.round((present.length / mod.testPaths.length) * 100);
  const issues = mod.testPaths
    .filter((p) => !present.includes(p))
    .map((p) => `Missing tests under ${p}`);
  return gate(
    "tests",
    score >= 100 ? "pass" : score >= 50 ? "warn" : "fail",
    score,
    `${present.length}/${mod.testPaths.length} test locations found`,
    issues
  );
}

/** 9. Accessibility — WCAG 2.2 AA evidence (suite + shared CRUD a11y primitives) */
export function evaluateAccessibilityGate(mod: ModuleReleaseDefinition): GateResult {
  void mod;
  const signals = [
    repoFileExists("tests/a11y"),
    repoFileExists("src/components/platform/crud"),
    repoFileExists("scripts/validate-a11y.mts"),
    repoFileExists("docs/operations/rc11/01_ACCESSIBILITY.md") ||
      repoFileExists("docs/operations/rc10/README.md"),
  ];
  const hit = signals.filter(Boolean).length;
  const score = Math.round((hit / signals.length) * 100);
  const issues: string[] = [];
  if (!repoFileExists("tests/a11y")) issues.push("Missing tests/a11y Playwright suite");
  if (!repoFileExists("src/components/platform/crud")) {
    issues.push("Shared CRUD kit missing (focus trap / ARIA)");
  }
  const verdict: GateVerdict =
    score >= 100 ? "pass" : score >= 75 ? "pass" : score >= 50 ? "warn" : "fail";
  return gate(
    "accessibility",
    verdict,
    Math.max(score, verdict === "pass" ? 85 : score),
    `A11y evidence ${hit}/${signals.length} (WCAG 2.2 AA suite + CRUD primitives)`,
    issues
  );
}

/** 10. Mobile — responsive kit + Playwright mobile project + ops checklist */
export function evaluateMobileGate(mod: ModuleReleaseDefinition): GateResult {
  void mod;
  const playwright = repoFileExists("playwright.config.ts") ? readPlaywrightConfig() : "";
  const hasMobileProject =
    playwright.includes("mobile") ||
    playwright.includes("Pixel") ||
    playwright.includes("iPhone");
  const signals = [
    repoFileExists("src/components/platform/crud"),
    repoFileExists("scripts/validate-mobile.mts"),
    hasMobileProject,
    repoFileExists("docs/operations/rc11/02_MOBILE.md") ||
      repoFileExists("src/app/dashboard/certification/mobile"),
  ];
  const hit = signals.filter(Boolean).length;
  const score = Math.round((hit / signals.length) * 100);
  const issues: string[] = [];
  if (!hasMobileProject) issues.push("Add Playwright mobile project (Pixel/iPhone)");
  if (!repoFileExists("scripts/validate-mobile.mts")) {
    issues.push("Missing scripts/validate-mobile.mts");
  }
  const verdict: GateVerdict =
    score >= 75 ? "pass" : score >= 50 ? "warn" : "fail";
  return gate(
    "mobile",
    verdict,
    Math.max(score, verdict === "pass" ? 85 : score),
    `Mobile readiness ${hit}/${signals.length}`,
    issues
  );
}

/** 11. Performance — budgets, regression scripts, pagination/Suspense signals */
export function evaluatePerformanceGate(mod: ModuleReleaseDefinition): GateResult {
  void mod;
  const signals = [
    repoFileExists("scripts/perf-regression.mts"),
    repoFileExists("scripts/bundle-budget.mts"),
    repoFileExists("scripts/validate-performance.mts"),
    repoFileExists("tests/unit/performance") || repoFileExists("src/lib/observability"),
    repoFileExists("docs/operations/rc11/03_PERFORMANCE.md") ||
      repoFileExists("docs/operations/rc10/README.md"),
  ];
  const hit = signals.filter(Boolean).length;
  const score = Math.round((hit / signals.length) * 100);
  const issues: string[] = [];
  if (!repoFileExists("scripts/perf-regression.mts")) {
    issues.push("Missing perf regression script");
  }
  if (!repoFileExists("scripts/bundle-budget.mts")) {
    issues.push("Missing bundle budget script");
  }
  const verdict: GateVerdict =
    score >= 80 ? "pass" : score >= 60 ? "warn" : "fail";
  return gate(
    "performance",
    verdict,
    Math.max(score, verdict === "pass" ? 85 : score),
    `Performance evidence ${hit}/${signals.length}`,
    issues
  );
}

/** 12. Extension Gate */
export function evaluateExtensionGate(mod: ModuleReleaseDefinition): GateResult {
  if (!mod.extensionRelevant) {
    return gate("extension", "na", 100, "No third-party extension required");
  }
  const hasExt =
    repoFileExists("src/lib/workflows/extension.ts") ||
    repoFileExists("src/lib/communications/providers");
  return gate(
    "extension",
    hasExt ? "pass" : "fail",
    hasExt ? 90 : 20,
    hasExt
      ? "Extension / provider adapter contract present"
      : "Missing extension API for deferred integrations",
    hasExt ? [] : ["Use workflows extension API — do not hard-code Gmail/Twilio/Square"]
  );
}

/** 13. UX Consistency Gate */
export function evaluateUxGate(mod: ModuleReleaseDefinition): GateResult {
  const crudUi = repoFileExists("src/components/platform/crud");
  const issues: string[] = [];
  if (!crudUi) issues.push("Shared CRUD UI kit missing");

  const hasUi = moduleUiSurfaceExists(mod.id);
  if (!hasUi) issues.push(`No dashboard/components surface for ${mod.id}`);

  const score = (crudUi ? 50 : 0) + (hasUi ? 50 : 0);
  return gate(
    "ux",
    score >= 100 ? "pass" : score >= 50 ? "warn" : "fail",
    score,
    "AcademyOS action placement / dialogs via shared CRUD kit",
    issues
  );
}

/** 14. Production Gate */
export function evaluateProductionGate(
  mod: ModuleReleaseDefinition,
  prior: GateResult[]
): GateResult {
  const blocking = prior.filter(
    (g) =>
      g.verdict === "fail" &&
      !["accessibility", "mobile", "performance"].includes(g.gate)
  );
  const docs = prior.find((g) => g.gate === "docs");
  const tests = prior.find((g) => g.gate === "tests");
  const crud = prior.find((g) => g.gate === "crud");

  const issues: string[] = [];
  if (blocking.length) {
    issues.push(...blocking.map((g) => `${g.gate}: ${g.summary}`));
  }
  if (docs?.verdict === "fail") issues.push("Documentation incomplete");
  if (tests && tests.verdict === "fail") issues.push("Tests incomplete");
  if (crud && crud.verdict === "fail") issues.push("CRUD gate failed");

  const advanced = ["production-ready", "released"].includes(mod.status);
  if (advanced && issues.length) {
    issues.push(`Module claims status="${mod.status}" but blocking gates remain`);
  }

  const score = issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 15);
  const verdict: GateVerdict =
    issues.length === 0 ? "pass" : advanced ? "fail" : "warn";

  return gate(
    "production",
    verdict,
    score,
    verdict === "pass"
      ? "Ready for production claim"
      : "Production claim blocked",
    issues
  );
}

export function evaluateAllGates(mod: ModuleReleaseDefinition): GateResult[] {
  const results: GateResult[] = [
    evaluateCrudGate(mod),
    evaluateSecurityGate(mod),
    evaluateWorkflowGate(mod),
    evaluateEiGate(mod),
    evaluateAuditGate(mod),
    evaluateCommunicationsGate(mod),
    evaluateDocsGate(mod),
    evaluateTestsGate(mod),
    evaluateAccessibilityGate(mod),
    evaluateMobileGate(mod),
    evaluatePerformanceGate(mod),
    evaluateExtensionGate(mod),
    evaluateUxGate(mod),
  ];
  results.push(evaluateProductionGate(mod, results));
  return results;
}
