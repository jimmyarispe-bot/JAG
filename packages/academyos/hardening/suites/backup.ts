/**
 * Backup & recovery — procedure documentation gates (execution is ops-runbook).
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { HardeningSuiteDefinition } from "../harness";

const REQUIRED_TOPICS = [
  "backup",
  "restore",
  "rollback",
  "disaster",
  "configuration",
] as const;

export const backupRecoverySuite: HardeningSuiteDefinition = {
  id: "backup_recovery",
  name: "Backup & Recovery",
  run(ctx) {
    const docPath = join(
      ctx.repositoryRoot,
      "docs/academyos/rc2/04_OPERATIONS.md"
    );
    ctx.assert(
      "backup.doc_present",
      existsSync(docPath),
      "missing operations doc",
      "critical"
    );
    if (!existsSync(docPath)) return;

    const body = readFileSync(docPath, "utf8").toLowerCase();
    for (const topic of REQUIRED_TOPICS) {
      ctx.assert(
        `backup.topic.${topic}`,
        body.includes(topic),
        `operations doc must cover ${topic}`,
        "major"
      );
    }

    ctx.assert(
      "backup.assumptions_documented",
      body.includes("recovery") || body.includes("rpo") || body.includes("rto"),
      "document RPO/RTO or recovery assumptions"
    );
  },
};
