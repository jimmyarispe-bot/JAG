export {
  createDemoMicrosoft365Client,
  allMicrosoft365ObjectTypes,
  type Microsoft365Client,
  type Microsoft365ListPage,
} from "./demo-client";
export { microsoft365Store, type Microsoft365StoreSnapshot } from "./store";
export {
  buildMicrosoft365IntelligenceFeed,
  getMicrosoft365Feed,
  type Microsoft365IntelligenceFeed,
} from "./intelligence-feed";
export {
  eventTypeForMicrosoftRecord,
  publishMicrosoft365Events,
} from "./events";
export {
  buildUnifiedCommunicationDashboard,
  type UnifiedCommunicationDashboard,
  type UnifiedMeetingCard,
  type UnifiedCommunicationCard,
} from "./unified-communication";
export {
  buildMicrosoft365EccWidgets,
  projectEccWidgets as projectMicrosoft365EccWidgets,
  type Microsoft365EccWidgets,
  type MicrosoftMeetingsWidget,
  type MicrosoftCommunicationWidget,
  type MicrosoftDocumentsWidget,
} from "./ecc-widgets";
