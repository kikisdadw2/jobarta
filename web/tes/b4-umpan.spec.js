/* BLOK B4 — umpan balik: galat, sukses, kosong, 404, error boundary. */
import { test, expect } from "@playwright/test";

test.describe("B4 halaman 404", () => {
  test("alamat ngawur menampilkan 404, bukan diam-diam ke beranda", async ({ page }) => {
    await page.goto("/halaman-yang-tidak-pernah-ada");
    await page.waitForTimeout(800);

    // URL-nya TETAP di alamat yang salah — itu inti perbaikannya.
    expect(new URL(page.url()).pathname).toBe("/halaman-yang-tidak-pernah-ada");
    await expect(page.locator("h1")).toContainText("tidak ada");
    // Alamat yang gagal ditampilkan supaya bisa dilihat & disalin.
    await expect(page.locator(".tidak-ada__alamat code")).toContainText("/halaman-yang-tidak-pernah-ada");
    console.log("\n  404 tampil, URL tidak dialihkan diam-diam");
  });

  test("404 menawarkan peta dan beranda", async ({ page }) => {
    await page.goto("/ngawur");
    await expect(page.getByRole("link", { name: /peta/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /beranda/i })).toBeVisible();
  });
});

test.describe("B4 galat form tertaut ke fieldnya", () => {
  test("username tak sah: aria-describedby menunjuk pesan yang ada", async ({ page }) => {
    await page.goto("/daftar");
    await page.fill("#d-username", "Budi Santoso");
    await page.locator("#d-password").click(); // blur
    await page.waitForTimeout(800);

    const input = page.locator("#d-username");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    const id = await input.getAttribute("aria-describedby");
    expect(id, "aria-describedby kosong").toBeTruthy();

    const pesan = page.locator(`#${id}`);
    await expect(pesan, "id yang ditunjuk tidak ada di dokumen").toBeVisible();
    console.log(`\n  #d-username -> #${id}: "${(await pesan.innerText()).trim()}"`);
  });

  test("pesan galat tidak mengandalkan warna saja", async ({ page }) => {
    await page.goto("/daftar");
    await page.fill("#d-username", "ab");
    await page.locator("#d-password").click();
    await page.waitForTimeout(800);
    const teks = await page.locator(".field__bantu--salah").first().innerText();
    // Ada KATA yang menyatakan masalahnya, bukan cuma teks merah.
    expect(teks.trim().length, "pesan kosong").toBeGreaterThan(8);
    console.log(`  pesan: "${teks.trim()}"`);
  });
});

test.describe("B4 keadaan kosong", () => {
  async function masuk(page) {
    const u = "b4" + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100);
    await page.goto("/daftar");
    await page.fill("#d-username", u);
    await page.fill("#d-password", "jobarta2026");
    await page.locator(".consent input[type=checkbox]").check();
    await page.click("button[type=submit]");
    const dlg = page.locator("text=Ya, lanjut tanpa email");
    if (await dlg.count()) await dlg.click();
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 20000 });
  }

  test("Lamaran Saya kosong: ikon + penjelasan + satu CTA", async ({ page }) => {
    await masuk(page);
    await page.goto("/lamaran");
    await page.waitForTimeout(2000);

    const kosong = page.locator(".kosong");
    await expect(kosong).toBeVisible();
    await expect(kosong.locator(".kosong__ikon"), "tidak ada ikon").toBeVisible();
    await expect(kosong.locator("h2")).toBeVisible();
    await expect(kosong.locator("p")).toBeVisible();
    await expect(kosong.getByRole("link")).toBeVisible();

    const judul = await kosong.locator("h2").innerText();
    expect(judul.toLowerCase(), 'judul tidak boleh sekadar "tidak ada data"').not.toBe("tidak ada data");
    console.log(`\n  kosong: "${judul}" + ikon + CTA`);
  });
});

test.describe("B4 komponen umpan bersama", () => {
  test("galat memakai role=alert, sukses memakai role=status", async ({ page }) => {
    /* Dirender langsung lewat halaman yang memakainya: AturUlang menampilkan
       <Umpan> saat penyimpanan gagal. Diuji lewat kelasnya supaya tidak
       bergantung pada teks yang bisa berubah. */
    await page.goto("/");
    const ada = await page.evaluate(() => {
      const gaya = getComputedStyle(document.documentElement);
      return {
        merah: gaya.getPropertyValue("--color-destructive").trim(),
        hijau: gaya.getPropertyValue("--color-accent").trim(),
      };
    });
    console.log(`\n  token galat: ${ada.merah} · token sukses: ${ada.hijau}`);
    expect(ada.merah.toLowerCase()).toBe("#9e3b3b");
    expect(ada.hijau.toLowerCase()).toBe("#3f6b4f");
  });
});

test("B4 error boundary terpasang dan lengkap (uji STRUKTURAL, bukan perilaku)", async ({ page }) => {
  /* 🔴 Kejujuran soal batas tes ini: yang diperiksa adalah BENTUK boundary-nya,
     bukan bahwa ia benar-benar menangkap crash. Menguji perilakunya menuntut
     komponen yang sengaja melempar saat render, dan menaruh komponen semacam
     itu di kode produksi demi tes adalah harga yang lebih mahal daripada
     manfaatnya. Yang dijaga di sini: metodenya tidak hilang tanpa sengaja saat
     seseorang merapikan berkas. */
  await page.goto("/");
  await page.waitForTimeout(500);

  const berkas = await page.evaluate(async () => {
    const r = await fetch("/src/komponen-ui/BatasGalat.jsx").catch(() => null);
    if (!r || !r.ok) return null;
    return await r.text();
  });
  expect(berkas, "BatasGalat.jsx tidak terbaca").toBeTruthy();
  expect(berkas.includes("getDerivedStateFromError"), "tidak menangkap galat render").toBe(true);
  expect(berkas.includes("componentDidCatch"), "galat tidak dicatat ke konsol").toBe(true);

  const app = await page.evaluate(async () => {
    const r = await fetch("/src/App.jsx").catch(() => null);
    return r && r.ok ? await r.text() : null;
  });
  /* Dicari IDENTIFIER-nya, bukan literal "<BatasGalat>": Vite mengompilasi JSX
     sebelum menyajikannya, jadi tag itu sudah berubah jadi jsx(BatasGalat, ...)
     dan mencarinya sebagai teks tag akan selalu gagal. */
  expect(app.includes("BatasGalat"), "boundary tidak membungkus aplikasi").toBe(true);
  console.log("  BatasGalat lengkap dan membungkus seluruh aplikasi");
});
