import { evaluateAllGates } from "./gates";
import { listModuleDefinitions } from "./registry";
import type {
  GateVerdict,
  ModuleReadinessStatus,
  ModuleReleaseSnapshot,
  ReleaseValidationReport,
} from "./types";
import { READINESS_ORDER } from "./types";

function overallFromGates(
  gates: ReturnType<typeof evaluateAllGates>
): { verdict: GateVerdict; score: number } {
  const scored = gates.filter((g) => g.verdict !== "na");
  if (!scored.length) return { verdict: "pass", score: 100 };

  const score = Math.round(
    scored.reduce((sum, g) => sum + g.score, 0) / scored.length
  );
  if (scored.some((g) => g.verdict === "fail")) {
    return { verdict: "fail", score };
  }
  if (scored.some((g) => g.verdict === "warn" || g.verdict === "pending")) {
    return { verdict: "warn", score };
  }
  return { verdict: "pass", score };
}

/**
 * Derive effective readiness from gate outcomes (may be lower than declared).
 */
export function deriveEffectiveStatus(
  declared: ModuleReadinessStatus,
  gates: ReturnType<typeof evaluateAllGates>
): ModuleReadinessStatus {
  const byGate = Object.fromEntries(gates.map((g) => [g.gate, g]));
  const crud = byGate.crud;
  const workflow = byGate.workflow;
  const ei = byGate.ei;
  const tests = byGate.tests;
  const production = byGate.production;

  let effective: ModuleReadinessStatus = declared;

  const floor = (status: ModuleReadinessStatus) => {
    const di = READINESS_ORDER.indexOf(declared);
    const ei = READINESS_ORDER.indexOf(status);
    return READINESS_ORDER[Math.min(di, ei)]!;
  };

  if (production?.verdict === "pass" && tests?.verdict === "pass") {
    effective = floor("production-ready");
  } else if (tests && tests.verdict !== "fail" && ei?.verdict === "pass") {
    effective = floor("tested");
  } else if (ei?.verdict === "pass" && workflow?.verdict === "pass") {
    effective = floor("ei-complete");
  } else if (workflow?.verdict === "pass" && crud?.verdict === "pass") {
    effective = floor("workflow-complete");
  } else if (crud?.verdict === "pass") {
    effective = floor("crud-complete");
  } else if (crud?.verdict === "warn") {
    effective = floor("feature-complete");
  } else if (declared === "planned") {
    effective = "planned";
  } else {
    effective = floor("building");
  }

  return effective;
}

export function buildModuleSnapshot(
  // allow injecting definition for tests
  mod = listModuleDefinitions()[0]!
): ModuleReleaseSnapshot {
  const gates = evaluateAllGates(mod);
  const { verdict, score } = overallFromGates(gates);
  return {
    definition: mod,
    effectiveStatus: deriveEffectiveStatus(mod.status, gates),
    gates,
    overallVerdict: verdict,
    overallScore: score,
  };
}

export function buildReleaseReport(): ReleaseValidationReport {
  const modules = listModuleDefinitions().map((mod) => {
    const gates = evaluateAllGates(mod);
    const { verdict, score } = overallFromGates(gates);
    return {
      definition: mod,
      effectiveStatus: deriveEffectiveStatus(mod.status, gates),
      gates,
      overallVerdict: verdict,
      overallScore: score,
    } satisfies ModuleReleaseSnapshot;
  });

  const blockingIssues: ReleaseValidationReport["blockingIssues"] = [];

  for (const snap of modules) {
    const advanced = ["production-ready", "released"].includes(snap.definition.status);
    for (const g of snap.gates) {
      if (g.verdict !== "fail") continue;
      // Soft gates never block release aggregate unless module claims production-ready
      const soft = ["accessibility", "mobile", "performance"].includes(g.gate);
      if (soft && !advanced) continue;
      if (!advanced && ["docs", "tests", "security"].includes(g.gate)) {
        // building/planned modules may fail docs/tests without blocking release
        continue;
      }
      if (!advanced && g.gate !== "production") continue;

      for (const message of g.issues.length ? g.issues : [g.summary]) {
        blockingIssues.push({
          moduleId: snap.definition.id,
          gate: g.gate,
          message,
        });
      }
    }
  }

  return {
    ok: blockingIssues.length === 0,
    generatedAt: new Date().toISOString(),
    modules,
    blockingIssues,
  };
}

/** Dashboard-friendly matrix rows */
export function buildReleaseDashboardRows() {
  const report = buildReleaseReport();
  return report.modules.map((m) => ({
    id: m.definition.id,
    label: m.definition.label,
    status: m.definition.status,
    effectiveStatus: m.effectiveStatus,
    overallScore: m.overallScore,
    overallVerdict: m.overallVerdict,
    notes: m.definition.notes,
    cells: {
      crud: m.gates.find((g) => g.gate === "crud")!,
      security: m.gates.find((g) => g.gate === "security")!,
      workflow: m.gates.find((g) => g.gate === "workflow")!,
      ei: m.gates.find((g) => g.gate === "ei")!,
      tests: m.gates.find((g) => g.gate === "tests")!,
      docs: m.gates.find((g) => g.gate === "docs")!,
      accessibility: m.gates.find((g) => g.gate === "accessibility")!,
      mobile: m.gates.find((g) => g.gate === "mobile")!,
      performance: m.gates.find((g) => g.gate === "performance")!,
      extension: m.gates.find((g) => g.gate === "extension")!,
      production: m.gates.find((g) => g.gate === "production")!,
    },
  }));
}
