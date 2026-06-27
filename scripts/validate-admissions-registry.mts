import { validateAdmissionsRegistry } from "../src/lib/admissions/registry/validate";

const result = validateAdmissionsRegistry();

if (!result.ok) {
  console.error("Admissions registry validation failed:\n");
  for (const issue of result.issues) {
    console.error(`  [${issue.code}] ${issue.message}`);
  }
  process.exit(1);
}

console.log("Admissions registry validation passed.");
