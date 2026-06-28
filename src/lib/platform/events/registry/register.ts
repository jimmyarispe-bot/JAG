import { PLATFORM_REFERENCE_EVENT_DEFINITIONS } from "@/lib/platform/events/catalog/catalog";
import {
  markEventRegistryRegistered,
  registerEventDefinitions,
} from "@/lib/platform/events/registry/registry";

registerEventDefinitions(PLATFORM_REFERENCE_EVENT_DEFINITIONS);
markEventRegistryRegistered();
