import { PLATFORM_REFERENCE_RULE_SETS } from "@/lib/platform/rules/catalog/reference-definitions";
import {
  markRuleRegistryRegistered,
  registerRuleSets,
} from "@/lib/platform/rules/registry/registry";

registerRuleSets(PLATFORM_REFERENCE_RULE_SETS);
markRuleRegistryRegistered();
