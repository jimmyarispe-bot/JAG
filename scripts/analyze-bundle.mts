/**
 * P010 — run production build with ANALYZE=true for @next/bundle-analyzer.
 */
import { spawnSync } from "child_process";

process.env.ANALYZE = "true";

const result = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
