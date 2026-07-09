import { registerEventDefinitions } from "@/lib/platform/events/registry/registry";
import { INSTRUCTION_EVENT_DEFINITIONS } from "@/lib/instruction/catalog/events";

registerEventDefinitions(INSTRUCTION_EVENT_DEFINITIONS);
