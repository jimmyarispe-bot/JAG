/**
 * Server-oriented Learning Center barrel.
 *
 * Client Components must import from `./client` (or types/catalog/
 * preferences-helpers) — never this module — to avoid pulling
 * createAuthClient / @mr-jag / node:fs into the client bundle.
 */

export * from "./types";
export * from "./catalog";
export * from "./preferences-helpers";
export * from "./authorization";
export * from "./service";
export * from "./coach";
export * from "./walkthrough";
export {
  setLearningPersistenceForTests,
  createMemoryLearningPersistence,
  getLearningPersistence,
} from "./store";
