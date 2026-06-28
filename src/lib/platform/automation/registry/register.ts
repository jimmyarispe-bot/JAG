import { AUTOMATION_ACTION_CATALOG } from "@/lib/platform/automation/catalog/actions";
import { AUTOMATION_CONDITION_CATALOG } from "@/lib/platform/automation/catalog/conditions";
import { PLATFORM_REFERENCE_AUTOMATION_DEFINITIONS } from "@/lib/platform/automation/catalog/reference-definitions";
import { AUTOMATION_TRIGGER_CATALOG } from "@/lib/platform/automation/catalog/triggers";
import { registerDefaultAutomationActionHandlers } from "@/lib/platform/automation/actions/register-defaults";
import { registerDefaultAutomationConditionEvaluators } from "@/lib/platform/automation/conditions/evaluators";
import { registerAutomationDefinitions } from "@/lib/platform/automation/registry/automation-registry";
import { registerActionDefinitions } from "@/lib/platform/automation/registry/action-registry";
import { registerConditionDefinitions } from "@/lib/platform/automation/registry/condition-registry";
import { markAutomationRegistryRegistered } from "@/lib/platform/automation/registry/registry";
import { registerTriggerDefinitions } from "@/lib/platform/automation/registry/trigger-registry";
import { registerDefaultAutomationTriggerHandlers } from "@/lib/platform/automation/triggers/register-defaults";
import { registerWorkflowAutomationBridge } from "@/lib/platform/automation/triggers/workflow-bridge";

import "@/lib/platform/events/registry/register";
import "@/lib/platform/decision/registry/register";

registerTriggerDefinitions(AUTOMATION_TRIGGER_CATALOG);
registerActionDefinitions(AUTOMATION_ACTION_CATALOG);
registerConditionDefinitions(AUTOMATION_CONDITION_CATALOG);
registerAutomationDefinitions(PLATFORM_REFERENCE_AUTOMATION_DEFINITIONS);

registerDefaultAutomationTriggerHandlers();
registerDefaultAutomationActionHandlers();
registerDefaultAutomationConditionEvaluators();
registerWorkflowAutomationBridge();

markAutomationRegistryRegistered();
