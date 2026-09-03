import { defineConfig, devices } from "@playwright/test";

/* Konfigurasi khusus build produksi — dijalankan terhadap `vite preview`,
 * bukan dev server. Dipisah supaya `npm test` tetap cepat. */
export default defineConfig({
  testDir: "./tes",
  testMatch: "produksi.spec.js",
  reporter: [["list"]],
  use: { baseURL: "http://localhost:5210" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npx vite preview --port 5210 --strictPort",
    url: "http://localhost:5210",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
