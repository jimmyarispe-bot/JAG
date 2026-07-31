/**
 * Framework reflection — graph consumes metadata; frameworks do not depend on graph.
 */

import { listEndpoints } from "@/lib/platform/api/registry";
import { listEntityTypes } from "@/lib/platform/entities/registry";
import { listFormDefinitions } from "@/lib/platform/forms/registry";
import { linkNodes } from "@/lib/platform/graph/edge";
import { ensureNode, nodeId } from "@/lib/platform/graph/node";
import {
  clearReflectionLayer,
  listEdges,
  listNodes,
} from "@/lib/platform/graph/registry";
import { dependencyReport } from "@/lib/platform/graph/query";
import type { GraphDocumentation, GraphStats } from "@/lib/platform/graph/types";
import { graphStats } from "@/lib/platform/graph/query";
import { listRegisteredSchemas } from "@/lib/platform/schema/registry";
import { listWorkflowDefinitions } from "@/lib/platform/workflows/framework/registry";

function ensureApplication(applicationId: string | null | undefined): string | null {
  if (!applicationId?.trim()) return null;
  const node = ensureNode("application", applicationId, {
    label: applicationId,
    applicationId,
    source: "reflection",
  });
  return node.id;
}

function ensureOrganization(organizationId: string | null | undefined): string | null {
  if (!organizationId?.trim()) return null;
  const node = ensureNode("organization", organizationId, {
    label: organizationId,
    organizationId,
    source: "reflection",
  });
  return node.id;
}

function ensurePermission(permission: string, applicationId: string | null): string {
  return ensureNode("permission", permission, {
    label: permission,
    applicationId,
    source: "reflection",
  }).id;
}

function ensureCapability(
  kind: "decision" | "notification" | "automation" | "forecasting",
  key: string,
  applicationId: string | null
): string {
  return ensureNode(kind, key, {
    label: key,
    applicationId,
    source: "reflection",
    metadata: { capability: true },
  }).id;
}

/**
 * Rebuild reflection layer from Schema / Entity / Forms / Workflow / API registries.
 * Manual nodes/edges are preserved.
 */
export function reflectFrameworks(): GraphStats {
  clearReflectionLayer();

  // --- Schemas ---
  for (const schema of listRegisteredSchemas()) {
    const appId = ensureApplication(schema.applicationId);
    const orgId = ensureOrganization(schema.organizationId);

    const schemaNode = ensureNode("schema", schema.id, {
      label: schema.label,
      applicationId: schema.applicationId,
      organizationId: schema.organizationId,
      source: "reflection",
      metadata: {
        entityType: schema.entityType,
        version: schema.version,
        layer: schema.layer,
      },
    });

    if (appId) {
      linkNodes("OWNS", appId, schemaNode.id, { source: "reflection" });
    }
    if (orgId && appId) {
      linkNodes("ENABLES", orgId, appId, { source: "reflection" });
    }

    if (schema.extends) {
      const parent = ensureNode("schema", schema.extends, {
        source: "reflection",
        stub: !listRegisteredSchemas().some((s) => s.id === schema.extends),
        label: schema.extends,
      });
      linkNodes("EXTENDS", schemaNode.id, parent.id, { source: "reflection" });
    }

    const entityNode = ensureNode("entity_type", schema.entityType, {
      label: schema.label,
      applicationId: schema.applicationId,
      source: "reflection",
    });
    linkNodes("PROJECTS_TO", schemaNode.id, entityNode.id, {
      source: "reflection",
    });
    if (appId) {
      linkNodes("OWNS", appId, entityNode.id, { source: "reflection" });
    }

    for (const formRef of schema.forms) {
      const formNode = ensureNode("form", formRef.formId, {
        source: "reflection",
        stub: !listFormDefinitions().some((f) => f.id === formRef.formId),
        applicationId: schema.applicationId,
        label: formRef.formId,
      });
      linkNodes("REFERENCES", schemaNode.id, formNode.id, {
        source: "reflection",
        label: formRef.role ?? null,
      });
    }

    for (const wfRef of schema.workflows) {
      const wfNode = ensureNode("workflow", wfRef.workflowId, {
        source: "reflection",
        stub: !listWorkflowDefinitions().some((w) => w.id === wfRef.workflowId),
        applicationId: schema.applicationId,
        label: wfRef.workflowId,
      });
      linkNodes("REFERENCES", schemaNode.id, wfNode.id, {
        source: "reflection",
        label: wfRef.role ?? null,
      });
    }

    for (const perm of schema.permissions) {
      const permId = ensurePermission(perm.permission, schema.applicationId);
      linkNodes("GOVERNS", permId, schemaNode.id, {
        source: "reflection",
        label: perm.action,
      });
    }

    if (schema.intelligence?.forecastableFields?.length) {
      const forecastId = ensureCapability(
        "forecasting",
        `${schema.entityType}.forecast`,
        schema.applicationId
      );
      linkNodes("USES", schemaNode.id, forecastId, { source: "reflection" });
    }
  }

  // --- Entity types (may exist without schema) ---
  for (const entity of listEntityTypes()) {
    const appId = ensureApplication(entity.applicationId);
    const entityNode = ensureNode("entity_type", entity.entityType, {
      label: entity.label,
      applicationId: entity.applicationId,
      source: "reflection",
      metadata: { capabilities: entity.capabilities },
    });
    if (appId) {
      linkNodes("OWNS", appId, entityNode.id, { source: "reflection" });
    }
    for (const perm of entity.permissions) {
      const permId = ensurePermission(perm.permission, entity.applicationId);
      linkNodes("GOVERNS", permId, entityNode.id, {
        source: "reflection",
        label: perm.action,
      });
    }
  }

  // --- Forms ---
  for (const form of listFormDefinitions()) {
    const appId = ensureApplication(form.applicationId);
    const formNode = ensureNode("form", form.id, {
      label: form.title,
      applicationId: form.applicationId,
      source: "reflection",
      stub: false,
      metadata: { version: form.version },
    });
    if (appId) {
      linkNodes("OWNS", appId, formNode.id, { source: "reflection" });
    }
    if (form.entityType) {
      const entityNode = ensureNode("entity_type", form.entityType, {
        applicationId: form.applicationId,
        source: "reflection",
        label: form.entityType,
      });
      linkNodes("EDITS", formNode.id, entityNode.id, { source: "reflection" });
    }
    const startWf = form.workflow?.startOnSubmit;
    if (startWf) {
      const wfNode = ensureNode("workflow", startWf, {
        applicationId: form.applicationId,
        source: "reflection",
        stub: !listWorkflowDefinitions().some((w) => w.id === startWf),
        label: startWf,
      });
      linkNodes("BINDS", formNode.id, wfNode.id, { source: "reflection" });
    }
    for (const perm of form.permissions) {
      const permId = ensurePermission(perm.permission, form.applicationId);
      linkNodes("GOVERNS", permId, formNode.id, {
        source: "reflection",
        label: perm.action,
      });
    }
  }

  // --- Workflows ---
  for (const workflow of listWorkflowDefinitions()) {
    const appId = ensureApplication(workflow.applicationId);
    const wfNode = ensureNode("workflow", workflow.id, {
      label: workflow.name,
      applicationId: workflow.applicationId,
      source: "reflection",
      stub: false,
      metadata: { version: workflow.version },
    });
    if (appId) {
      linkNodes("OWNS", appId, wfNode.id, { source: "reflection" });
    }
    for (const entityType of workflow.entityTypes) {
      const entityNode = ensureNode("entity_type", entityType, {
        applicationId: workflow.applicationId,
        source: "reflection",
        label: entityType,
      });
      linkNodes("USES", entityNode.id, wfNode.id, { source: "reflection" });
    }
    for (const perm of workflow.permissions) {
      const permId = ensurePermission(perm.permission, workflow.applicationId);
      linkNodes("GOVERNS", permId, wfNode.id, {
        source: "reflection",
        label: perm.action,
      });
    }
    for (const transition of workflow.transitions) {
      if (transition.permission) {
        const permId = ensurePermission(
          transition.permission,
          workflow.applicationId
        );
        linkNodes("GOVERNS", permId, wfNode.id, {
          source: "reflection",
          label: transition.key,
        });
      }
      for (const action of transition.actions ?? []) {
        if (
          action.type === "create_decision" ||
          action.type === "assign_decision"
        ) {
          const decisionId = ensureCapability(
            "decision",
            "platform.decision",
            workflow.applicationId
          );
          linkNodes("TRIGGERS", wfNode.id, decisionId, {
            source: "reflection",
            label: action.type,
          });
        }
        if (action.type === "send_notification") {
          const notifId = ensureCapability(
            "notification",
            "platform.notification",
            workflow.applicationId
          );
          linkNodes("TRIGGERS", wfNode.id, notifId, {
            source: "reflection",
            label: action.type,
          });
        }
        if (action.type === "run_automation") {
          const autoId = ensureCapability(
            "automation",
            "platform.automation",
            workflow.applicationId
          );
          linkNodes("TRIGGERS", wfNode.id, autoId, {
            source: "reflection",
            label: action.type,
          });
        }
      }
    }
  }

  // --- API endpoints ---
  for (const endpoint of listEndpoints()) {
    const appId = ensureApplication(endpoint.applicationId);
    const apiNode = ensureNode("api_endpoint", endpoint.id, {
      label: `${endpoint.method} ${endpoint.path}`,
      applicationId: endpoint.applicationId,
      source: "reflection",
      metadata: {
        method: endpoint.method,
        path: endpoint.path,
        version: endpoint.version,
        deprecated: endpoint.deprecated,
      },
    });
    if (appId) {
      linkNodes("OWNS", appId, apiNode.id, { source: "reflection" });
    }
    if (endpoint.entityType) {
      const entityNode = ensureNode("entity_type", endpoint.entityType, {
        applicationId: endpoint.applicationId,
        source: "reflection",
        label: endpoint.entityType,
      });
      linkNodes("EXPOSES", apiNode.id, entityNode.id, { source: "reflection" });
    }
    for (const ref of [endpoint.requestSchema, endpoint.responseSchema]) {
      if (!ref) continue;
      const schemaNode = ensureNode("schema", ref.schemaId, {
        applicationId: endpoint.applicationId,
        source: "reflection",
        stub: !listRegisteredSchemas().some((s) => s.id === ref.schemaId),
        label: ref.schemaId,
      });
      linkNodes("OPERATES_ON", apiNode.id, schemaNode.id, {
        source: "reflection",
      });
    }
    for (const perm of endpoint.permissions) {
      const permId = ensurePermission(perm.permission, endpoint.applicationId);
      linkNodes("GOVERNS", permId, apiNode.id, {
        source: "reflection",
        label: perm.action,
      });
    }
  }

  return graphStats();
}

/**
 * Generate dependency / application / framework / schema maps from the graph.
 */
export function generateGraphDocumentation(): GraphDocumentation {
  const nodes = listNodes();
  const edges = listEdges();

  const dependencyMaps: GraphDocumentation["dependencyMaps"] = {};
  for (const node of nodes) {
    const report = dependencyReport(node.id);
    if (!report) continue;
    dependencyMaps[node.id] = {
      upstream: report.upstream,
      downstream: report.downstream,
    };
  }

  const applicationMaps: Record<string, string[]> = {};
  for (const app of nodes.filter((n) => n.kind === "application")) {
    applicationMaps[app.key] = (dependencyMaps[app.id]?.downstream ?? []).slice();
  }

  const frameworkMaps: Record<string, string[]> = {
    schema: nodes.filter((n) => n.kind === "schema").map((n) => n.id),
    entity_type: nodes.filter((n) => n.kind === "entity_type").map((n) => n.id),
    form: nodes.filter((n) => n.kind === "form").map((n) => n.id),
    workflow: nodes.filter((n) => n.kind === "workflow").map((n) => n.id),
    api_endpoint: nodes.filter((n) => n.kind === "api_endpoint").map((n) => n.id),
    permission: nodes.filter((n) => n.kind === "permission").map((n) => n.id),
  };

  const schemaMaps: Record<string, string[]> = {};
  for (const schema of nodes.filter((n) => n.kind === "schema")) {
    schemaMaps[schema.key] = (dependencyMaps[schema.id]?.downstream ?? []).slice();
  }

  const lines: string[] = [
    "# Knowledge Graph",
    "",
    `_Derived from ${nodes.length} node(s) and ${edges.length} edge(s)._`,
    "",
    "## Framework map",
    "",
  ];

  for (const [framework, ids] of Object.entries(frameworkMaps)) {
    lines.push(`### ${framework}`);
    lines.push("");
    if (!ids.length) {
      lines.push("_None._");
    } else {
      for (const id of ids) lines.push(`- \`${id}\``);
    }
    lines.push("");
  }

  lines.push("## Application maps", "");
  const appKeys = Object.keys(applicationMaps).sort();
  if (!appKeys.length) {
    lines.push("_No applications reflected._", "");
  } else {
    for (const key of appKeys) {
      lines.push(`### application:${key}`, "");
      const downstream = applicationMaps[key] ?? [];
      if (!downstream.length) lines.push("_No downstream nodes._");
      else for (const id of downstream) lines.push(`- \`${id}\``);
      lines.push("");
    }
  }

  lines.push("## Schema relationship maps", "");
  const schemaKeys = Object.keys(schemaMaps).sort();
  if (!schemaKeys.length) {
    lines.push("_No schemas reflected._", "");
  } else {
    for (const key of schemaKeys) {
      lines.push(`### schema:${key}`, "");
      for (const id of schemaMaps[key] ?? []) lines.push(`- \`${id}\``);
      lines.push("");
    }
  }

  lines.push("## Edges", "");
  if (!edges.length) {
    lines.push("_No edges._", "");
  } else {
    for (const edge of edges) {
      lines.push(`- \`${edge.from}\` —${edge.type}→ \`${edge.to}\``);
    }
    lines.push("");
  }

  return {
    title: "Knowledge Graph",
    generatedAt: new Date().toISOString(),
    nodeCount: nodes.length,
    edgeCount: edges.length,
    markdown: lines.join("\n"),
    dependencyMaps,
    applicationMaps,
    frameworkMaps,
    schemaMaps,
  };
}

export { nodeId };
