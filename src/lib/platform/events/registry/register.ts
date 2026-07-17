import { PLATFORM_REFERENCE_EVENT_DEFINITIONS } from "@/lib/platform/events/catalog/catalog";
import { CATEGORY_REFERENCE_EVENT_DEFINITIONS } from "@/lib/platform/events/schemas/catalog-schemas";
import {
  markEventRegistryRegistered,
  registerEventDefinitions,
} from "@/lib/platform/events/registry/registry";

registerEventDefinitions(PLATFORM_REFERENCE_EVENT_DEFINITIONS);
registerEventDefinitions(CATEGORY_REFERENCE_EVENT_DEFINITIONS);
markEventRegistryRegistered();
