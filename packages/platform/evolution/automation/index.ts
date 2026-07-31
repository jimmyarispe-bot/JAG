/**
 * Automation — proposal workflow helpers only (no production code generation).
 */

export { formatTeachJagMessage } from "./mr-jag-response";

export const EVOLUTION_AUTOMATION_GUARDS = Object.freeze({
  modifiesProductionCode: false,
  bypassesStudio: false,
  bypassesReleaseGates: false,
  output: "proposals-only" as const,
});
