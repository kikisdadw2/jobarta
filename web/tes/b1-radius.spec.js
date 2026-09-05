/* Label radius menampilkan nilainya, dan menjelaskan diri saat mati.
 *
 * Dilaporkan sebagai "RADIUS — tanpa angka, terbaca seperti kontrol rusak".
 * Ternyata bukan kerusakan: menyaring "dalam radius 5 km" dari titik yang
 * tidak diketahui itu mustahil, jadi kontrolnya sengaja mati sampai lokasi
 * menyala. Yang kurang adalah ALASANNYA — dan itu yang dijaga di sini.
 */
import { test, expect } from "@playwright/test";

const LOKASI = { latitude: -6.2088, longitude: 106.8456 };

test.describe("kontrol radius", () => {
  test("lokasi menyala: nilai tampil dan ikut berubah saat digeser", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      permissions: ["geolocation"],
      geolocation: LOKASI,
    });
    const page = await ctx.newPage();
    await page.addInitScript(() => localStorage.setItem("jobarta.lokasi.dijelaskan", "1"));
    await page.goto("/peta");
    await page.waitForTimeout(3000);

    const label = page.locator(".saring__grup--radius label").first();
    const slider = page.locator("#bar-radius, #sheet-radius").first();

    await expect(slider).toBeEnabled();
    await expect(label).toContainText(/\d/);
    const awal = await label.innerText();

    await slider.fill("12");
    await page.waitForTimeout(500);
    const sesudah = await label.innerText();
    expect(sesudah, "label tidak ikut berubah saat slider digeser").not.toBe(awal);
    expect(sesudah).toMatch(/12/);
    console.log(`\n  ${awal.trim()} → ${sesudah.trim()}`);
    await ctx.close();
  });

  test("lokasi mati: kontrol menjelaskan sebabnya, bukan diam", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => localStorage.setItem("jobarta.lokasi.dijelaskan", "1"));
    await page.goto("/peta");
    await page.waitForTimeout(2500);

    const label = page.locator(".saring__grup--radius label").first();
    const slider = page.locator("#bar-radius, #sheet-radius").first();

    await expect(slider).toBeDisabled();
    /* Angka palsu di sini akan membuat UI berbohong: ia terlihat menyaring
       padahal tidak ada satu pun lowongan yang tersaring olehnya. */
    await expect(label).toContainText("—");

    const alasan = await label.getAttribute("title");
    expect(alasan, "kontrol mati tanpa alasan terbaca seperti rusak").toMatch(/lokasi/i);
    const bagiPembacaLayar = await slider.getAttribute("aria-label");
    expect(bagiPembacaLayar).toMatch(/lokasi/i);
    console.log(`  mati → title: "${alasan}"`);
    await ctx.close();
  });
});
