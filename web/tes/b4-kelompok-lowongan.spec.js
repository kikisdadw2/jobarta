/* Dasbor employer mengelompokkan lowongan menurut status.
 *
 * Sebelumnya satu daftar datar: employer harus memindai badge satu per satu
 * untuk memisahkan yang tayang dari yang sudah ditutup — padahal itu dua
 * pertanyaan berbeda yang dia bawa saat membuka dasbor.
 */
import { test, expect } from "@playwright/test";
import { employerSiap, bersihkanLowonganku } from "./bantu-sesi.js";

test.describe("kelompok status di dasbor employer", () => {
  test.afterEach(async ({ page }) => {
    await bersihkanLowonganku(page);
  });

  async function pasangSatuLowongan(page, posisi) {
    await page.goto("/perusahaan/pasang");
    await page.getByLabel("Nama pekerjaan").fill(posisi);
    await page.getByLabel("Kategori").selectOption("Ritel");
    await page.getByLabel("Tipe kerja").selectOption("Penuh Waktu");
    await page.getByLabel("Minimum").fill("4500000");
    await page.getByLabel("Alamat tempat kerja").fill("Jl. Uji Kelompok, Jakarta");
    await page.getByLabel("Apa yang dikerjakan?").fill("Lowongan untuk menguji pengelompokan status di dasbor.");
    await page.locator(".peta-pilih").click({ position: { x: 200, y: 140 } });
    await page.getByRole("button", { name: "Pasang lowongan", exact: true }).click();
    await expect(page).toHaveURL(/\/perusahaan/, { timeout: 20000 });
  }

  test("lowongan tayang muncul di bawah judul kelompoknya", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await employerSiap(page);
    await pasangSatuLowongan(page, "Kasir Uji Kelompok");
    await page.waitForTimeout(1500);

    const kelompok = page.locator(".kelompok");
    await expect(kelompok).toHaveCount(1);
    await expect(kelompok.locator(".kelompok__judul")).toContainText(/sedang tayang/i);
    await expect(kelompok.locator(".kelompok__jumlah")).toHaveText("1");
    console.log(`\n  ${(await kelompok.locator(".kelompok__judul").innerText()).replace(/\n/g, " ")}`);
  });

  test("menutup lowongan memindahkannya ke kelompok lain", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await employerSiap(page);
    await pasangSatuLowongan(page, "Gudang Uji Kelompok");
    await page.waitForTimeout(1500);

    await page.getByRole("button", { name: "Tutup lowongan" }).first().click();
    await page.waitForTimeout(2500);

    const judul = page.locator(".kelompok__judul");
    await expect(judul).toHaveCount(1);
    await expect(judul).toContainText(/sudah ditutup/i);
    /* Kelompok kosong tidak dirender: judul "Sedang tayang 0" adalah
       kekosongan yang mengambil ruang tanpa memberi kabar apa pun. */
    await expect(page.locator(".kelompok__judul", { hasText: /sedang tayang/i })).toHaveCount(0);
    console.log(`  sesudah ditutup → ${(await judul.innerText()).replace(/\n/g, " ")}`);
  });

  test("jumlah pelamar per lowongan tetap tampil", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await employerSiap(page);
    await pasangSatuLowongan(page, "Barista Uji Kelompok");
    await page.waitForTimeout(1500);
    await expect(page.locator(".riwayat__baris").first()).toContainText(/pelamar/i);
  });
});
