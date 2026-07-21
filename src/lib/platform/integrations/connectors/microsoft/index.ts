/** Compatibility shim — prefer `@/lib/platform/integrations/connectors/microsoft-365`. */
export {
  microsoftMetadata,
  microsoft365Metadata,
  createMicrosoft365Connector as createMicrosoftConnector,
  createMicrosoft365Connector,
  createMicrosoft365PlatformConnector,
  registerMicrosoft365PlatformConnector,
} from "@/lib/platform/integrations/connectors/microsoft-365";
