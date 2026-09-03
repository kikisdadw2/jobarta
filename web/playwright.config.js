import { defineConfig, devices } from "@playwright/test";

/* Server dinyalakan Playwright sendiri di port khusus uji, supaya tidak bentrok
 * dengan `npm run dev` yang mungkin sedang jalan. */
export default defineConfig({
  testDir: "./tes",
  // produksi.spec.js punya konfigurasi sendiri (playwright.produksi.js).
  testIgnore: ["produksi.spec.js", "banding.spec.js"],
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5199",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --port 5199 --strictPort",
    url: "http://localhost:5199",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
