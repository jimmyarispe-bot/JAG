import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    setupFiles: ["tests/setup/vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@academyos": path.resolve(__dirname, "./packages/academyos"),
      "@academyos/api": path.resolve(__dirname, "./packages/academyos/api"),
      "@studio": path.resolve(__dirname, "./packages/studio"),
      "@studio/architecture": path.resolve(
        __dirname,
        "./packages/studio/architecture"
      ),
      "@mr-jag": path.resolve(__dirname, "./packages/platform/mr-jag"),
      "@evolution": path.resolve(__dirname, "./packages/platform/evolution"),
      "@innovation": path.resolve(__dirname, "./packages/platform/innovation"),
      "@organization": path.resolve(
        __dirname,
        "./packages/platform/organization"
      ),
      "@finance": path.resolve(__dirname, "./packages/platform/finance"),
      "@cfo": path.resolve(__dirname, "./packages/platform/cfo"),
    },
  },
});


