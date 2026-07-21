/**
 * AcademyOS CRUD Completion Gate
 *
 * Fails when any entity marked releaseStatus=complete does not meet
 * the CRUD Standard. New modules must stay partial until compliant.
 */

import {
  CRUD_COMPLETION_RULE,
  validateCrudCompletionGate,
  listEntityCapabilities,
  getEntityReleaseStatus,
} from "../src/lib/platform/crud/index";

const result = validateCrudCompletionGate();

console.log(CRUD_COMPLETION_RULE);
console.log("");

const caps = listEntityCapabilities();
const complete = caps.filter((c) => getEntityReleaseStatus(c.entityKey) === "complete");
const partial = caps.filter((c) => getEntityReleaseStatus(c.entityKey) === "partial");
const deferred = caps.filter((c) => getEntityReleaseStatus(c.entityKey) === "deferred");

console.log(`Registered entities: ${caps.length}`);
console.log(`  complete: ${complete.length}`);
console.log(`  partial:  ${partial.length}`);
console.log(`  deferred: ${deferred.length}`);
console.log("");

if (!result.ok) {
  console.error("CRUD completion gate FAILED:\n");
  for (const issue of result.issues) {
    console.error(`  [${issue.code}] ${issue.entityKey}: ${issue.message}`);
  }
  console.error("\nFix: implement missing lifecycle actions, then keep releaseStatus=complete.");
  console.error("Or set ENTITY_RELEASE_STATUS to partial until the standard is met.");
  console.error("See docs/platform/crud-standards.md\n");
  process.exit(1);
}

console.log("CRUD completion gate passed.");
console.log("Reminder: do not mark new modules complete until they comply with the CRUD Standard.");
