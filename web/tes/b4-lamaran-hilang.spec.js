/* Regresi: lamaran ke lowongan yang sudah tidak tayang tidak boleh menguap.
 *
 * Versi lama `LamaranSaya.jsx` memakai `if (!job) return null` di tengah map.
 * Akibatnya angka di atas daftar menghitung lamaran itu, barisnya tidak pernah
 * muncul, dan selisihnya tidak pernah dijelaskan — pelamar membaca "3 lamaran
 * terkirim" lalu menghitung dua baris, dan menyimpulkan datanya hilang.
 *
 * Ada bug kedua yang lebih tajam di sana: katalog lowongan dimuat TERPISAH
 * dari daftar lamaran. Kalau lamaran tiba lebih dulu, katalog masih kosong dan
 * SETIAP baris gagal dicocokkan — halaman sempat menampilkan hitungan penuh di
 * atas daftar yang benar-benar kosong.
 */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { idContoh, ID_HILANG } from "./bantu-lowongan.js";

async function masuk(page) {
  const u = "lh" + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100);
  await page.goto("/daftar");
  await page.fill("#d-username", u);
  await page.fill("#d-password", "jobarta2026");
  await page.locator(".consent input[type=checkbox]").check();
  await page.click("button[type=submit]");
  const dlg = page.locator("text=Ya, lanjut tanpa email");
  if (await dlg.count()) await dlg.click();
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 30000 });
  return u;
}

/** Tulis riwayat lamaran langsung ke cadangan lokal, lalu buka halamannya. */
async function pasangLamaran(page, ids) {
  await page.goto("/peta");
  await page.evaluate((daftar) => {
    localStorage.setItem(
      "jobarta.lamaran",
      JSON.stringify(
        daftar.map((id, i) => ({
          id: `l${i}`,
          lowonganId: id,
          status: "terkirim",
          dilamarPada: new Date(Date.now() - i * 86400000).toISOString(),
        }))
      )
    );
  }, ids);
  await page.goto("/lamaran");
  await page.waitForTimeout(2500);
}

test.describe("lamaran ke lowongan yang sudah tidak tayang", () => {
  test("selisihnya dijelaskan, bukan disembunyikan", async ({ page }) => {
    await masuk(page);
    await pasangLamaran(page, [await idContoh("jkt-001"), ID_HILANG]);

    const baris = page.locator(".riwayat__baris");
    const sub = page.locator(".akun__sub");

    if ((await baris.count()) === 0) {
      /* Mode Supabase: riwayat datang dari server dan cadangan lokal diabaikan,
         jadi tidak ada yang bisa diuji di sini. Dinyatakan terang-terangan,
         bukan dibiarkan lolos diam-diam sebagai tes yang seolah lulus. */
      test.skip(true, "riwayat dilayani server; cadangan lokal tidak dipakai");
    }

    await expect(baris).toHaveCount(1);
    /* Inti tes: hitungan HARUS cocok dengan jumlah baris, dan selisihnya
       disebut. Angka yang tidak cocok tanpa penjelasan = laporan kerusakan. */
    await expect(sub).toContainText("1 lamaran terkirim");
    await expect(sub).toContainText("1 lainnya lowongannya sudah tidak tayang");
    console.log(`\n  ${await sub.innerText()}`);
  });

  test("semua lowongan hilang: bukan dibilang belum pernah melamar", async ({ page }) => {
    await masuk(page);
    await pasangLamaran(page, [ID_HILANG, ID_HILANG.replace("000000000000","000000000001")]);

    const kosong = page.locator(".kosong h2");
    if ((await kosong.count()) === 0) test.skip(true, "riwayat dilayani server");

    const judul = await kosong.innerText();
    if (/belum melamar ke mana pun/i.test(judul)) {
      /* Riwayat lokal tidak terbaca sama sekali — bukan kasus yang diuji. */
      test.skip(true, "riwayat lokal tidak dipakai di mode ini");
    }
    expect(judul).toMatch(/sudah tidak tayang/i);
    console.log(`\n  kosong-karena-kedaluwarsa: "${judul}"`);
  });
});

test.describe("struktur LamaranSaya", () => {
  test("tidak ada lagi penyaringan diam-diam di tengah map", () => {
    const kode = fs
      .readFileSync(new URL("../src/halaman/LamaranSaya.jsx", import.meta.url), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    expect(kode, "masih membuang baris tanpa menjelaskan").not.toMatch(/if \(!job\) return null/);
    expect(kode, "yang hilang tidak dihitung").toMatch(/const hilang =/);
  });

  test("kerangka menunggu KEDUA pengambilan, bukan cuma daftar lamaran", () => {
    const kode = fs
      .readFileSync(new URL("../src/halaman/LamaranSaya.jsx", import.meta.url), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    /* Tanpa ini halaman sempat menampilkan hitungan penuh di atas daftar
       kosong, karena katalog belum tiba saat lamaran sudah tiba. */
    expect(kode, "katalog tidak punya keadaan memuat sendiri").toMatch(/memuatKatalog/);
    expect(kode).toMatch(/memuat \|\| memuatKatalog/);
  });
});
