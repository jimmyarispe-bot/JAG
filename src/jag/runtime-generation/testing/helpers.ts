import type { RuntimeSpecification } from "@/jag/blueprints/contracts";
import { stableStringify } from "@/jag/runtime-generation/artifacts";
import { runtimeSpecificationIds } from "@/jag/blueprints/testing";

export function runtimeSpecificationFingerprint(
  spec: RuntimeSpecification
): string {
  return stableStringify({
    metadata: spec.metadata,
    ids: runtimeSpecificationIds(spec),
    forms: (spec.forms ?? []).map((f) => f.id).sort(),
    workflows: (spec.workflows ?? []).map((w) => String(w.id)).sort(),
    navigation: (spec.navigation ?? []).map((n) => n.id).sort(),
    terminology: (spec.terminology ?? []).map((t) => t.id).sort(),
    localization: (spec.localization ?? []).map((l) => l.id).sort(),
    integrations: (spec.integrations ?? []).map((i) => i.id).sort(),
    configKeys: Object.keys(spec.configuration?.keys ?? {}).sort(),
  });
}

export function fullRuntimeSpecificationIds(spec: RuntimeSpecification): {
  entities: string[];
  processes: string[];
  decisions: string[];
  forms: string[];
  workflows: string[];
  documents: string[];
  communications: string[];
  permissions: string[];
  reports: string[];
  navigation: string[];
  terminology: string[];
  localization: string[];
  integrations: string[];
} {
  const base = runtimeSpecificationIds(spec);
  return {
    ...base,
    forms: (spec.forms ?? []).map((f) => f.id).sort(),
    workflows: (spec.workflows ?? []).map((w) => String(w.id)).sort(),
    navigation: (spec.navigation ?? []).map((n) => n.id).sort(),
    terminology: (spec.terminology ?? []).map((t) => t.id).sort(),
    localization: (spec.localization ?? []).map((l) => l.id).sort(),
    integrations: (spec.integrations ?? []).map((i) => i.id).sort(),
  };
}
