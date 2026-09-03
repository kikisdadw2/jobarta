import { defineConfig, devices } from "@playwright/test";

/* Konfigurasi alat lihat, bukan uji: menangkap tiap layar di 375px dan 1440px
 * untuk dibandingkan dengan artboard di design-canvas/_export.
 * Jalankan: npm run banding */
export default defineConfig({
  testDir: "./tes",
  testMatch: "banding.spec.js",
  reporter: [["line"]],
  workers: 4,
  use: { baseURL: "http://localhost:5199" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --port 5199 --strictPort",
    url: "http://localhost:5199",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
