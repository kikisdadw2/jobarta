/* Regresi: seluruh kartu lowongan harus bisa ditekan, bukan judulnya saja.
 *
 * Sebelum ini `.kartu__tombol` hanya membungkus <h3>, jadi sasaran tekannya
 * 309×27px — di bawah minimum 44px — dan menekan gaji, alamat, atau nama
 * perusahaan tidak melakukan apa pun. Diperbaiki dengan pola stretched link:
 * `::after` absolut yang membentang ke seluruh kartu.
 *
 * 🔴 Diuji dengan KOORDINAT, bukan `locator.click()` pada anak kartu: kalau
 *    ::after bekerja, ia memang MENCEGAT klik ke anak-anaknya, dan Playwright
 *    akan menolak klik itu sebagai "element intercepts pointer events". Itu
 *    tanda berhasil, bukan gagal — jadi yang ditekan harus titiknya.
 */
import { test, expect } from "@playwright/test";

const HP = { width: 375, height: 812 };

/** Naikkan sheet sampai kartu pertama tampil utuh di layar. */
async function siapkan(page) {
  await page.goto("/peta");
  await page.waitForTimeout(3000);
  await page.click(".panel__pegangan");
  await page.waitForTimeout(600);
  await page.locator(".kartu").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
}

test("seluruh tinggi kartu menerima tekanan", async ({ page }) => {
  await page.setViewportSize(HP);
  await siapkan(page);

  const hasil = await page.evaluate(() => {
    const kartu = document.querySelector(".kartu");
    const r = kartu.getBoundingClientRect();
    const tinggiLayar = window.innerHeight;
    const titik = [0.1, 0.3, 0.5, 0.7, 0.9].map((f) => {
      const y = r.top + r.height * f;
      if (y < 0 || y > tinggiLayar) return "di luar layar";
      const el = document.elementFromPoint(r.left + r.width / 2, y);
      return el?.closest(".kartu__tombol") ? "kena" : `meleset → ${el?.className}`;
    });
    return { tinggi: Math.round(r.height), lebar: Math.round(r.width), titik };
  });
  console.log(`\n  kartu ${hasil.lebar}×${hasil.tinggi}px`);
  hasil.titik.forEach((t, i) => console.log(`    ${[10,30,50,70,90][i]}% → ${t}`));

  expect(hasil.tinggi, "tinggi area tekan").toBeGreaterThanOrEqual(44);
  const diuji = hasil.titik.filter((t) => t !== "di luar layar");
  expect(diuji.length, "tidak ada titik yang bisa diuji").toBeGreaterThan(2);
  expect(diuji.every((t) => t === "kena"), `ada titik meleset: ${JSON.stringify(diuji)}`).toBe(true);
});

test("menekan bagian bawah kartu membuka detail lowongan", async ({ page }) => {
  await page.setViewportSize(HP);
  await siapkan(page);

  const judul = await page.locator(".kartu__posisi").first().innerText();
  const kotak = await page.locator(".kartu").first().boundingBox();
  // 80% ke bawah = area gaji/alamat, dulu mati total
  await page.mouse.click(kotak.x + kotak.width / 2, kotak.y + kotak.height * 0.8);
  await page.waitForTimeout(800);

  console.log(`\n  ditekan di 80% tinggi kartu "${judul}"`);
  await expect(page.locator(".detail").first()).toBeVisible();
});

test("cincin fokus melingkari kartu, bukan barisan judul", async ({ page }) => {
  await page.setViewportSize(HP);
  await siapkan(page);

  /* 🔴 Harus lewat Tab sungguhan. `locator.focus()` TIDAK memicu
     `:focus-visible` di Chromium — cincinnya memang tidak muncul untuk fokus
     programatik, dan itu perilaku yang benar, bukan bug. Menguji dengan
     .focus() akan melaporkan kegagalan palsu. */
  let sampai = false;
  for (let i = 0; i < 40 && !sampai; i++) {
    await page.keyboard.press("Tab");
    sampai = await page.evaluate(() =>
      document.activeElement?.classList.contains("kartu__tombol")
    );
  }
  expect(sampai, "tombol kartu tidak terjangkau papan ketik").toBe(true);

  const gaya = await page.evaluate(() => {
    const g = getComputedStyle(document.activeElement, "::after");
    return { outline: g.outlineStyle, lebar: g.outlineWidth };
  });
  console.log(`  ::after saat fokus → outline ${gaya.outline} ${gaya.lebar}`);
  expect(gaya.outline, "cincin fokus hilang dari kartu").not.toBe("none");
});
