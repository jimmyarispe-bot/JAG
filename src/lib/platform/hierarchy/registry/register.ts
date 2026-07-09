import {
  JAG_CAPABILITY_BINDINGS,
  JAG_HIERARCHY_REFERENCE_NODES,
} from "@/lib/platform/hierarchy/catalog/reference-definitions";
import {
  markHierarchyRegistryRegistered,
  registerCapabilityBindings,
  registerHierarchyNodes,
} from "@/lib/platform/hierarchy/registry/registry";

registerHierarchyNodes(JAG_HIERARCHY_REFERENCE_NODES);
registerCapabilityBindings(JAG_CAPABILITY_BINDINGS);
markHierarchyRegistryRegistered();
