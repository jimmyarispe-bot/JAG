#!/usr/bin/env tsx
/**
 * Local CLI: generate The Jag / Mr. Jag HeyGen videos from a manifest.
 *
 * Examples:
 *   npm run heygen:videos -- --dry-run
 *   npm run heygen:videos -- --discover-assets
 *   npm run heygen:videos -- --inspect-candidates
 *   npm run heygen:videos -- --id jag-001
 *   npm run heygen:videos
 *   npm run heygen:videos -- --force --id jag-001
 */

import { resolve } from "node:path";
import { loadDotEnvFiles } from "../rc5/load-dotenv";
import {
  runDiscoverAssetsCli,
  runDiscoverPrivateAvatarGroupsCli,
  runInspectCandidateAvatarsCli,
  runInspectCandidateLookVisualsCli,
} from "./discover";
import { generateJagVideos } from "./generate";
import { safeLog } from "./redact";

function parseArgs(argv: string[]) {
  const flags = new Set<string>();
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!;
    if (
      arg === "--dry-run" ||
      arg === "--force" ||
      arg === "--no-poll" ||
      arg === "--discover-assets" ||
      arg === "--inspect-candidates" ||
      arg === "--inspect-candidate-visuals" ||
      arg === "--list-private-groups"
    ) {
      flags.add(arg);
      continue;
    }
    if (arg === "--id" || arg === "--manifest" || arg === "--state") {
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      values.set(arg, next);
      i += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      flags.add("--help");
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return { flags, values };
}

function printHelp(): void {
  console.log(`HeyGen local video generator (The Jag / Mr. Jag)

Usage:
  npm run heygen:videos -- --dry-run
  npm run heygen:videos -- --discover-assets
  npm run heygen:videos -- --inspect-candidates
  npm run heygen:videos -- --inspect-candidate-visuals
  npm run heygen:videos -- --list-private-groups
  npm run heygen:videos -- --id jag-001
  npm run heygen:videos
  npm run heygen:videos -- --force --id jag-001

Environment:
  HEYGEN_API_KEY      required for discovery and live generation
  HEYGEN_AVATAR_ID    approved Mr. Jag avatar look ID (generation)
  HEYGEN_VOICE_ID     approved Sawyer voice ID (generation)

--discover-assets, --inspect-candidates, --inspect-candidate-visuals,
and --list-private-groups are READ-ONLY (GET lists only).
They never call POST /v3/videos.

Spoken scripts should use "Mr. Jag" / "The Jag" (not "Mr. J-A-G").
`);
}

async function main(): Promise<void> {
  loadDotEnvFiles();
  const { flags, values } = parseArgs(process.argv.slice(2));
  if (flags.has("--help")) {
    printHelp();
    return;
  }

  if (flags.has("--discover-assets")) {
    await runDiscoverAssetsCli();
    return;
  }

  if (flags.has("--inspect-candidates")) {
    await runInspectCandidateAvatarsCli();
    return;
  }

  if (flags.has("--inspect-candidate-visuals")) {
    await runInspectCandidateLookVisualsCli();
    return;
  }

  if (flags.has("--list-private-groups")) {
    await runDiscoverPrivateAvatarGroupsCli();
    return;
  }

  const root = process.cwd();
  const dryRun = flags.has("--dry-run");
  const result = await generateJagVideos({
    manifestPath: resolve(
      root,
      values.get("--manifest") ?? "videos/jag-video-library.json"
    ),
    statePath: resolve(
      root,
      values.get("--state") ?? "artifacts/heygen/generation-state.json"
    ),
    dryRun,
    force: flags.has("--force"),
    id: values.get("--id"),
    poll: !flags.has("--no-poll"),
    pollIntervalMs: 10_000,
    pollTimeoutMs: 15 * 60_000,
  });

  safeLog(
    `Done. processed=${result.processed} created=${result.created} skipped=${result.skipped} failed=${result.failed} dryRun=${result.dryRun}`
  );

  if (result.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  safeLog(`Fatal: ${message}`, process.env.HEYGEN_API_KEY);
  process.exitCode = 1;
});
