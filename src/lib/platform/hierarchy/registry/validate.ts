import { getDecisionDefinition } from "@/lib/platform/decision/registry/registry";
import { getEventDefinition } from "@/lib/platform/events/registry/registry";
import {
  getAllCapabilityBindings,
  getAllHierarchyNodes,
  getDuplicateCapabilityRegistrations,
  getDuplicateHierarchyNodeRegistrations,
  getHierarchyNode,
} from "@/lib/platform/hierarchy/registry/registry";
import type {
  HierarchyValidationIssue,
  HierarchyValidationResult,
  JagHierarchyLayerKind,
} from "@/lib/platform/hierarchy/types";
import { JAG_HIERARCHY_LAYER_KINDS } from "@/lib/platform/hierarchy/types";
import { getRuleSet } from "@/lib/platform/rules/registry/registry";
import { getUlrDomain, isKnownUlrCompetencyKey } from "@/lib/platform/ulr/registry/registry";
import { getWorkflowDefinition } from "@/lib/platform/workflow/registry/registry";

export function validateHierarchyRegistry(): HierarchyValidationResult {
  const issues: HierarchyValidationIssue[] = [];

  for (const key of getDuplicateHierarchyNodeRegistrations()) {
    issues.push({ code: "duplicate_node_key", message: `Duplicate hierarchy node key "${key}"` });
  }

  for (const key of getDuplicateCapabilityRegistrations()) {
    issues.push({ code: "duplicate_capability_key", message: `Duplicate capability key "${key}"` });
  }

  for (const node of getAllHierarchyNodes()) {
    if (node.parentKey && !getHierarchyNode(node.parentKey)) {
      issues.push({
        code: "missing_parent",
        message: `Node "${node.nodeKey}" references missing parent "${node.parentKey}"`,
      });
    }
  }

  for (const kind of JAG_HIERARCHY_LAYER_KINDS) {
    const published = getAllHierarchyNodes().filter((n) => n.kind === kind && n.status === "published");
    if (!published.length) {
      issues.push({
        code: "missing_layer_kind",
        message: `No published hierarchy node for layer kind "${kind}"`,
      });
    }
  }

  for (const binding of getAllCapabilityBindings()) {
    for (const key of [
      binding.standardKey,
      binding.protocolKey,
      binding.processKey,
      binding.procedureKey,
      ...binding.parameterKeys,
      ...binding.evidenceTypeKeys,
      ...binding.knowledgeAssetKeys,
    ]) {
      if (!getHierarchyNode(key)) {
        issues.push({
          code: "binding_unknown_node",
          message: `Capability "${binding.capabilityKey}" references unknown node "${key}"`,
        });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}

/** Validate cross-platform registry links (rules, workflows, events, ULR). */
export function validateHierarchyPlatformLinks(): HierarchyValidationResult {
  const issues: HierarchyValidationIssue[] = [];

  for (const node of getAllHierarchyNodes()) {
    const refs = node.platformRefs;
    if (!refs) continue;

    if (refs.ruleSetKey && !getRuleSet(refs.ruleSetKey)) {
      issues.push({
        code: "unknown_rule_set",
        message: `Node "${node.nodeKey}" references unknown rule set "${refs.ruleSetKey}"`,
      });
    }
    if (refs.workflowKey && !getWorkflowDefinition(refs.workflowKey)) {
      issues.push({
        code: "unknown_workflow",
        message: `Node "${node.nodeKey}" references unknown workflow "${refs.workflowKey}"`,
      });
    }
    if (refs.eventType && !getEventDefinition(refs.eventType)) {
      issues.push({
        code: "unknown_event_type",
        message: `Node "${node.nodeKey}" references unknown event "${refs.eventType}"`,
      });
    }
    if (refs.decisionTypeKey && !getDecisionDefinition(refs.decisionTypeKey)) {
      issues.push({
        code: "unknown_decision_type",
        message: `Node "${node.nodeKey}" references unknown decision type "${refs.decisionTypeKey}"`,
      });
    }
    if (refs.ulrCompetencyKey && !isKnownUlrCompetencyKey(refs.ulrCompetencyKey)) {
      issues.push({
        code: "unknown_ulr_competency",
        message: `Node "${node.nodeKey}" references unknown ULR competency "${refs.ulrCompetencyKey}"`,
      });
    }
    if (refs.ulrDomainKey && !getUlrDomain(refs.ulrDomainKey)) {
      issues.push({
        code: "unknown_ulr_domain",
        message: `Node "${node.nodeKey}" references unknown ULR domain "${refs.ulrDomainKey}"`,
      });
    }
  }

  for (const binding of getAllCapabilityBindings()) {
    for (const ruleSetKey of binding.ruleSetKeys) {
      if (!getRuleSet(ruleSetKey)) {
        issues.push({
          code: "binding_unknown_rule_set",
          message: `Capability "${binding.capabilityKey}" references unknown rule set "${ruleSetKey}"`,
        });
      }
    }
    if (binding.workflowKey && !getWorkflowDefinition(binding.workflowKey)) {
      issues.push({
        code: "binding_unknown_workflow",
        message: `Capability "${binding.capabilityKey}" references unknown workflow "${binding.workflowKey}"`,
      });
    }
    if (binding.eventType && !getEventDefinition(binding.eventType)) {
      issues.push({
        code: "binding_unknown_event",
        message: `Capability "${binding.capabilityKey}" references unknown event "${binding.eventType}"`,
      });
    }
    if (binding.decisionTypeKey && !getDecisionDefinition(binding.decisionTypeKey)) {
      issues.push({
        code: "binding_unknown_decision",
        message: `Capability "${binding.capabilityKey}" references unknown decision "${binding.decisionTypeKey}"`,
      });
    }
  }

  return { ok: issues.length === 0, issues };
}

export function validateHierarchyRegistryComplete(): HierarchyValidationResult {
  const structural = validateHierarchyRegistry();
  const links = validateHierarchyPlatformLinks();
  const issues = [...structural.issues, ...links.issues];
  return { ok: issues.length === 0, issues };
}

export function getRegisteredLayerKinds(): JagHierarchyLayerKind[] {
  return [...new Set(getAllHierarchyNodes().map((n) => n.kind))].sort() as JagHierarchyLayerKind[];
}
