import { test, expect } from "@playwright/test";

/* Uji BUILD PRODUKSI, bukan dev server.
 *
 * Kenapa terpisah: `npm run dev` memaafkan banyak hal yang dipatahkan build —
 * path aset, chunk yang hilang, dan aset Leaflet yang di dev diambil dari
 * node_modules. Layar yang mulus di dev bisa kosong di Vercel.
 *
 * Jalankan: npm run build && npx vite preview --port 5210
 * lalu: npx playwright test tes/produksi.spec.js --config playwright.produksi.js
 */

const RUTE = ["/", "/masuk", "/daftar", "/peta", "/profil", "/lamaran", "/lupa-password", "/atur-ulang", "/verifikasi-email"];

for (const rute of RUTE) {
  test(`build produksi: ${rute} tampil tanpa error konsol`, async ({ page }) => {
    const galat = [];
    page.on("console", (m) => m.type() === "error" && galat.push(m.text()));
    page.on("pageerror", (e) => galat.push(String(e)));

    await page.goto(rute);
    // Halaman kosong = build rusak. Minimal harus ada teks yang terlihat.
    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page.locator("#root")).not.toBeEmpty();

    // Galat tile peta diabaikan: itu jaringan, bukan build.
    const nyata = galat.filter((g) => !/tile|openstreetmap|ERR_/i.test(g));
    expect(nyata, `error konsol di ${rute}`).toEqual([]);
  });
}

test("build produksi: peta benar-benar menggambar pin", async ({ page }) => {
  await page.goto("/peta");
  // Aset Leaflet paling sering hilang justru di build, bukan di dev.
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.locator(".leaflet-marker-icon").first()).toBeVisible();
});
