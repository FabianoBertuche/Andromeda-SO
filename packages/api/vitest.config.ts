import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
        "@andromeda/core": path.resolve(__dirname, "../core/src/index.ts"),
        },
    },
});
