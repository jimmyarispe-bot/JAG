export { createDemoCrmClient, type CrmClient, type CrmListPage } from "./client";
export { crmStore, type CrmStoreSnapshot } from "./store";
export {
  createCrmPlatformConnector,
  reconnectCrmConnector,
  type CrmConnectorSpec,
} from "./platform-connector";
export {
  buildCrmCatalog,
  crmCatalogForProvider,
  objectTypesForCrmProvider,
} from "./demo-catalog";
