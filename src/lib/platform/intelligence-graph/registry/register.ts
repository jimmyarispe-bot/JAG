import {
  PLATFORM_REFERENCE_EDGE_DEFINITIONS,
  PLATFORM_REFERENCE_NODE_DEFINITIONS,
} from "@/lib/platform/intelligence-graph/catalog/reference-definitions";
import { registerPlatformGraphProviders } from "@/lib/platform/intelligence-graph/providers";
import { registerGraphEdgeDefinitions } from "@/lib/platform/intelligence-graph/registry/edge-registry";
import {
  markGraphRegistryRegistered,
  registerGraphNodeDefinitions,
} from "@/lib/platform/intelligence-graph/registry/registry";

import "@/lib/platform/workflow/registry/register";
import "@/lib/platform/decision/registry/register";
import "@/lib/platform/profile";

registerGraphNodeDefinitions(PLATFORM_REFERENCE_NODE_DEFINITIONS);
registerGraphEdgeDefinitions(PLATFORM_REFERENCE_EDGE_DEFINITIONS);
registerPlatformGraphProviders();
markGraphRegistryRegistered();
