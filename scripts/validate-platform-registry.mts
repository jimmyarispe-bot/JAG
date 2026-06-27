import { validatePlatformRegistry } from "../src/lib/platform/diagnostics/validate-registry";

const result = validatePlatformRegistry();

if (!result.ok) {
  console.error("Platform registry validation failed:\n");
  for (const issue of result.issues) {
    console.error(`  [${issue.code}] ${issue.message}`);
  }
  process.exit(1);
}

console.log("Platform registry validation passed.");
