/* Regresi: teks buatan pengguna tanpa spasi tidak boleh melebarkan halaman.
 *
 * Dilaporkan 2026-09-05 dari lowongan sungguhan: employer menempel satu kata
 * ~500 karakter ke deskripsi, kartunya tertembus, dan seluruh halaman ikut
 * melebar sampai muncul gulir horizontal.
 *
 * BLOK B3 melewatkan ini karena datanya wajar — teks wajar selalu punya spasi
 * untuk dipatahkan. Tes ini sengaja memakai data yang TIDAK wajar.
 */
import { test, expect } from "@playwright/test";
import { idContoh, ID_HILANG } from "./bantu-lowongan.js";

const PANJANG = "a".repeat(300) + "w" + "a".repeat(300);

async function lebarMeluap(page) {
  return page.evaluate(() => ({
    gulir: document.documentElement.scrollWidth,
    tampak: document.documentElement.clientWidth,
  }));
}

for (const [nama, lebar, tinggi] of [
  ["desktop 1440", 1440, 900],
  ["mobile 390", 390, 844],
]) {
  test(`${nama}: kata 600 karakter tanpa spasi tidak melebarkan halaman`, async ({ page }) => {
    await page.setViewportSize({ width: lebar, height: tinggi });
    /* Panel detail dibuka lewat URL — di situlah teks employer dirender,
       dan di situlah bug-nya dilaporkan. Menyuntik ke kartu daftar tidak
       mereproduksi apa pun: daftar dan peta hidup di dalam `.app` yang
       ber-`overflow:hidden`, jadi apa pun di sana selalu terklip. */
    await page.goto(`/peta?lowongan=${await idContoh("jkt-001")}`);
    await page.waitForTimeout(2000);
    await expect(page.locator(".detail__isi")).toBeVisible();

    const disuntik = await page.evaluate((teks) => {
      const isi = document.querySelector(".detail__isi");
      const kandidat = [...isi.querySelectorAll("p, li, h2, h3")].filter(
        (el) => el.textContent.trim().length > 3
      );
      kandidat.forEach((el) => (el.textContent = teks));
      return kandidat.length;
    }, PANJANG);

    expect(disuntik, "panel detail kosong — tidak ada yang diuji").toBeGreaterThan(0);
    await page.waitForTimeout(400);

    /* Dua ukuran, karena bug-nya punya dua wajah:
       1. teks menembus KELUAR panelnya (yang terlihat di laporan), dan
       2. halaman ikut melebar (gulir horizontal). */
    const hasil = await page.evaluate(() => {
      const isi = document.querySelector(".detail__isi");
      const lebarIsi = isi.clientWidth;
      const terlebar = Math.max(
        ...[...isi.querySelectorAll("p, li, h2, h3")].map((el) => el.scrollWidth)
      );
      return {
        lebarIsi,
        terlebar,
        gulir: document.documentElement.scrollWidth,
        tampak: document.documentElement.clientWidth,
      };
    });

    console.log(
      `
  ${nama}: teks terlebar ${hasil.terlebar}px di panel ${hasil.lebarIsi}px · ` +
        `halaman ${hasil.gulir}/${hasil.tampak}`
    );
    expect(
      hasil.terlebar,
      `teks menembus ${hasil.terlebar - hasil.lebarIsi}px keluar panelnya`
    ).toBeLessThanOrEqual(hasil.lebarIsi + 1);
    expect(hasil.gulir, "halaman melebar").toBeLessThanOrEqual(hasil.tampak + 1);
  });
}

test("aturan overflow-wrap benar-benar terpasang di elemen teks", async ({ page }) => {
  await page.goto("/peta");
  await page.waitForTimeout(1200);
  const nilai = await page.evaluate(() => {
    const el = [...document.querySelectorAll("p")].find((e) => e.offsetParent !== null);
    return el ? getComputedStyle(el).overflowWrap : null;
  });
  expect(nilai, "elemen <p> tidak mewarisi overflow-wrap: anywhere").toBe("anywhere");
});
