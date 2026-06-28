import { PLATFORM_REFERENCE_DECISION_DEFINITIONS } from "@/lib/platform/decision/catalog/reference-definitions";
import {
  markDecisionRegistryRegistered,
  registerDecisionDefinitions,
} from "@/lib/platform/decision/registry/registry";

registerDecisionDefinitions(PLATFORM_REFERENCE_DECISION_DEFINITIONS);
markDecisionRegistryRegistered();
