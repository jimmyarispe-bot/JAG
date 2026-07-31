import {
  isPlatformCapability,
  resolveCapabilities,
} from "@/lib/platform/sdk/capabilities";
import { checkCompatibility } from "@/lib/platform/sdk/compatibility";
import {
  extensionCapabilityWarnings,
  validateExtensions,
} from "@/lib/platform/sdk/extensions";
import { listApplications } from "@/lib/platform/sdk/registry";
import type {
  ApplicationManifest,
  SdkValidationIssue,
  SdkValidationResult,
} from "@/lib/platform/sdk/types";

function validateUniqueRefs(
  items: Array<{ id: string }>,
  path: string,
  code: string
): SdkValidationIssue[] {
  const seen = new Set<string>();
  const issues: SdkValidationIssue[] = [];
  for (const item of items) {
    if (!item.id.trim()) {
      issues.push({
        path,
        code: "invalid_ref",
        message: `${path} contains an empty id`,
      });
      continue;
    }
    if (seen.has(item.id)) {
      issues.push({
        path: `${path}.${item.id}`,
        code,
        message: `Duplicate ${path} entry "${item.id}"`,
      });
    }
    seen.add(item.id);
  }
  return issues;
}

function findDependencyCycles(
  manifests: ApplicationManifest[]
): string[][] {
  const graph = new Map<string, string[]>();
  for (const m of manifests) {
    graph.set(
      m.id,
      m.dependencies.filter((d) => !d.optional).map((d) => d.applicationId)
    );
  }

  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  function dfs(node: string): void {
    if (visited.has(node)) return;
    if (visiting.has(node)) {
      const idx = stack.indexOf(node);
      if (idx >= 0) cycles.push(stack.slice(idx).concat(node));
      return;
    }
    visiting.add(node);
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      dfs(next);
    }
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }

  for (const id of graph.keys()) dfs(id);
  return cycles;
}

/**
 * Deterministic dependency + capability + compatibility validation.
 */
export function validateManifest(
  manifest: ApplicationManifest,
  options?: {
    platformVersion?: string;
    /** Include peer manifests when checking dependency cycles. */
    peers?: ApplicationManifest[];
  }
): SdkValidationResult {
  const issues: SdkValidationIssue[] = [];

  if (!manifest.id?.trim()) {
    issues.push({ path: "id", code: "required", message: "id is required" });
  }
  if (!manifest.name?.trim()) {
    issues.push({ path: "name", code: "required", message: "name is required" });
  }
  if (!manifest.version?.trim()) {
    issues.push({
      path: "version",
      code: "required",
      message: "version is required",
    });
  }

  const capSeen = new Set<string>();
  for (const cap of manifest.capabilities) {
    if (!isPlatformCapability(cap)) {
      issues.push({
        path: "capabilities",
        code: "unknown_capability",
        message: `Unknown capability "${cap}"`,
      });
    }
    if (capSeen.has(cap)) {
      issues.push({
        path: "capabilities",
        code: "duplicate_capability",
        message: `Duplicate capability "${cap}"`,
      });
    }
    capSeen.add(cap);
  }

  const resolution = resolveCapabilities(manifest);
  for (const missing of resolution.missing) {
    issues.push({
      path: "capabilities",
      code: "missing_capability",
      message: `Artifact list requires capability "${missing}" but it is not declared`,
    });
  }

  issues.push(
    ...validateUniqueRefs(
      manifest.schemas.map((s) => ({ id: s.schemaId })),
      "schemas",
      "duplicate_registration"
    )
  );
  issues.push(
    ...validateUniqueRefs(
      manifest.entities.map((e) => ({ id: e.entityType })),
      "entities",
      "duplicate_registration"
    )
  );
  issues.push(
    ...validateUniqueRefs(
      manifest.forms.map((f) => ({ id: f.formId })),
      "forms",
      "duplicate_registration"
    )
  );
  issues.push(
    ...validateUniqueRefs(
      manifest.workflows.map((w) => ({ id: w.workflowId })),
      "workflows",
      "duplicate_registration"
    )
  );
  issues.push(
    ...validateUniqueRefs(
      manifest.apis.map((a) => ({ id: a.endpointId })),
      "apis",
      "duplicate_registration"
    )
  );
  issues.push(
    ...validateUniqueRefs(
      manifest.permissions.map((p) => ({ id: p.permission })),
      "permissions",
      "duplicate_registration"
    )
  );
  issues.push(
    ...validateUniqueRefs(
      manifest.automation.map((a) => ({ id: a.ruleId })),
      "automation",
      "duplicate_registration"
    )
  );

  for (const dep of manifest.dependencies) {
    if (!dep.applicationId?.trim()) {
      issues.push({
        path: "dependencies",
        code: "invalid_dependency",
        message: "Dependency applicationId is required",
      });
    }
    if (dep.applicationId === manifest.id) {
      issues.push({
        path: "dependencies",
        code: "self_dependency",
        message: "Application cannot depend on itself",
      });
    }
  }

  const peers =
    options?.peers ??
    listApplications()
      .filter((a) => a.manifest.id !== manifest.id)
      .map((a) => a.manifest);
  const registeredIds = new Set([
    ...peers.map((m) => m.id),
    ...listApplications().map((a) => a.manifest.id),
  ]);

  for (const dep of manifest.dependencies) {
    if (dep.optional || !dep.applicationId?.trim()) continue;
    if (dep.applicationId === manifest.id) continue;
    if (!registeredIds.has(dep.applicationId)) {
      issues.push({
        path: `dependencies.${dep.applicationId}`,
        code: "missing_dependency",
        message: `Required dependency "${dep.applicationId}" is not registered`,
      });
    }
  }

  const all = [...peers.filter((p) => p.id !== manifest.id), manifest];
  for (const cycle of findDependencyCycles(all)) {
    if (cycle.includes(manifest.id)) {
      issues.push({
        path: "dependencies",
        code: "circular_dependency",
        message: `Circular application dependency: ${cycle.join(" → ")}`,
      });
    }
  }

  issues.push(...validateExtensions(manifest));
  issues.push(...extensionCapabilityWarnings(manifest));
  issues.push(...checkCompatibility(manifest, options?.platformVersion));

  for (const peer of peers) {
    if (peer.id === manifest.id) continue;
    for (const schema of manifest.schemas) {
      if (peer.schemas.some((s) => s.schemaId === schema.schemaId)) {
        issues.push({
          path: `schemas.${schema.schemaId}`,
          code: "duplicate_registration",
          message: `Schema "${schema.schemaId}" is already claimed by "${peer.id}"`,
        });
      }
    }
    for (const form of manifest.forms) {
      if (peer.forms.some((f) => f.formId === form.formId)) {
        issues.push({
          path: `forms.${form.formId}`,
          code: "duplicate_registration",
          message: `Form "${form.formId}" is already claimed by "${peer.id}"`,
        });
      }
    }
    for (const wf of manifest.workflows) {
      if (peer.workflows.some((w) => w.workflowId === wf.workflowId)) {
        issues.push({
          path: `workflows.${wf.workflowId}`,
          code: "duplicate_registration",
          message: `Workflow "${wf.workflowId}" is already claimed by "${peer.id}"`,
        });
      }
    }
    for (const api of manifest.apis) {
      if (peer.apis.some((a) => a.endpointId === api.endpointId)) {
        issues.push({
          path: `apis.${api.endpointId}`,
          code: "duplicate_registration",
          message: `API "${api.endpointId}" is already claimed by "${peer.id}"`,
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}
