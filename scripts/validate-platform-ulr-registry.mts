import { validateUlrRegistry, validateUlrPrerequisiteGraph } from "../src/lib/platform/ulr/registry/validate";
import {
  SL_LIBRARY_MANIFEST,
  SL_TOTAL_COMPETENCY_COUNT,
} from "../src/lib/platform/ulr/catalog/structured-literacy/competencies/all-libraries";
import "@/lib/platform/ulr/registry/register";

const result = validateUlrRegistry();

if (!result.ok) {
  console.error("ULR registry validation failed:\n");
  for (const issue of result.issues) {
    console.error(`  [${issue.code}] ${issue.message}`);
  }
  process.exit(1);
}

if (SL_TOTAL_COMPETENCY_COUNT < 280) {
  console.error(`Expected ≥280 SL competencies, got ${SL_TOTAL_COMPETENCY_COUNT}`);
  process.exit(1);
}

if (SL_LIBRARY_MANIFEST.length !== 16) {
  console.error(`Expected 16 SL competency libraries, got ${SL_LIBRARY_MANIFEST.length}`);
  process.exit(1);
}

const prereq = validateUlrPrerequisiteGraph();
if (!prereq.ok) {
  console.error("ULR prerequisite graph validation failed");
  for (const issue of prereq.issues) {
    console.error(`  [${issue.code}] ${issue.message}`);
  }
  process.exit(1);
}

console.log(
  `ULR registry validation passed (${SL_TOTAL_COMPETENCY_COUNT} SL competencies, ${SL_LIBRARY_MANIFEST.length} libraries).`
);
