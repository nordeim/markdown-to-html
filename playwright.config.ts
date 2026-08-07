import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/accessibility",
  webServer: { command: "npm run preview", port: 4173, reuseExistingServer: false },
});
