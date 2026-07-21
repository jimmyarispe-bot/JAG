export {
  createDemoEducationClient,
  type EducationClient,
  type EducationListPage,
} from "./client";
export { educationStore, type EducationStoreSnapshot } from "./store";
export {
  createEducationPlatformConnector,
  reconnectEducationConnector,
  type EducationConnectorSpec,
} from "./platform-connector";
export {
  buildEducationCatalog,
  educationCatalogForProvider,
  objectTypesForEducationProvider,
} from "./demo-catalog";
