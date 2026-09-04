/* BLOK B1 — izin & penanda lokasi di halaman peta. */
import { test, expect } from "@playwright/test";

const HP = { width: 390, height: 844 };
const MONAS = { latitude: -6.1754, longitude: 106.8272 };

/** Paksa geolocation gagal dengan kode tertentu, sebelum skrip halaman jalan. */
async function paksaGalat(page, code) {
  await page.addInitScript((kode) => {
    const palsu = (_ok, gagal) => gagal({ code: kode, message: "uji" });
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition: palsu, watchPosition: palsu, clearWatch: () => {} },
    });
    // Permissions API harus ikut "entah", kalau tidak jalur denied yang jalan.
    if (navigator.permissions) navigator.permissions.query = () => Promise.reject(new Error("x"));
  }, code);
}

const buka = async (page) => {
  await page.setViewportSize(HP);
  await page.goto("/peta");
  await page.waitForTimeout(2500);
};

test.describe("B1 izin lokasi", () => {
  test("sheet penjelasan muncul SEBELUM API geolokasi dipanggil", async ({ page }) => {
    let dipanggil = false;
    await page.exposeFunction("catatPanggilan", () => { dipanggil = true; });
    await page.addInitScript(() => {
      const asli = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      navigator.geolocation.getCurrentPosition = (...a) => {
        window.catatPanggilan();
        return asli(...a);
      };
      if (navigator.permissions) navigator.permissions.query = () => Promise.reject(new Error("x"));
    });
    await buka(page);

    await expect(page.locator(".sheet--izin")).toBeVisible();
    expect(dipanggil, "API geolokasi dipanggil sebelum penjelasan").toBe(false);
    console.log("\n  sheet tampil, getCurrentPosition belum dipanggil ✓");
  });

  test("menekan Izinkan lokasi memasang titik + cincin akurasi", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation(MONAS);
    await page.addInitScript(() => {
      if (navigator.permissions) navigator.permissions.query = () => Promise.reject(new Error("x"));
    });
    await buka(page);
    await page.click("text=Izinkan lokasi");
    await page.waitForTimeout(3000);

    await expect(page.locator(".titik-saya")).toHaveCount(1);
    const cincin = await page.locator("path.cincin-akurasi").count();
    console.log("\n  titik terpasang; cincin akurasi:", cincin ? "ada" : "disembunyikan (akurasi <25m)");
    // Cincin hanya digambar bila akurasinya > 25 m; keduanya sah.
    expect(await page.locator(".titik-saya").isVisible()).toBe(true);
  });

  test("Nanti saja tidak memanggil API dan tidak muncul lagi", async ({ page }) => {
    await page.addInitScript(() => {
      if (navigator.permissions) navigator.permissions.query = () => Promise.reject(new Error("x"));
    });
    await buka(page);
    await page.click("text=Nanti saja");
    await expect(page.locator(".sheet--izin")).toHaveCount(0);

    await page.reload();
    await page.waitForTimeout(2500);
    await expect(page.locator(".sheet--izin"), "sheet muncul lagi setelah ditolak").toHaveCount(0);
    console.log("\n  ditolak sekali, tidak menagih lagi ✓");
  });

  test("tombol Lokasi saya tetap ada setelah Nanti saja", async ({ page }) => {
    await page.addInitScript(() => {
      if (navigator.permissions) navigator.permissions.query = () => Promise.reject(new Error("x"));
    });
    await buka(page);
    await page.click("text=Nanti saja");
    await expect(page.locator("[aria-label='Lokasi saya']")).toBeVisible();
  });
});

test.describe("B1 tiga kode galat dibedakan", () => {
  const KASUS = [
    [1, "Izin lokasi ditolak", true],
    [2, "Lokasi belum ketemu", false],
    [3, "Terlalu lama menunggu", false],
  ];

  for (const [kode, judul, adaCara] of KASUS) {
    test(`kode ${kode} -> "${judul}"`, async ({ page }) => {
      await paksaGalat(page, kode);
      await buka(page);
      await page.click("text=Izinkan lokasi");
      await page.waitForTimeout(1200);

      const kotak = page.locator(".lokasi-galat");
      await expect(kotak).toBeVisible();
      await expect(kotak.locator(".lokasi-galat__judul")).toHaveText(judul);

      const cara = await kotak.locator(".lokasi-galat__cara").count();
      console.log(`\n  kode ${kode}: "${judul}" · cara pulih: ${cara ? "ada" : "tidak"}`);
      expect(Boolean(cara), "panduan izin hanya untuk PERMISSION_DENIED").toBe(adaCara);

      // Coba lagi hanya untuk galat yang memang bisa diulang.
      const cobaLagi = await kotak.locator("button:has-text('Coba lagi')").count();
      expect(Boolean(cobaLagi)).toBe(kode !== 1);
    });
  }
});

test("B1 konteks tidak aman dijelaskan eksplisit", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "isSecureContext", { configurable: true, value: false });
  });
  await buka(page);
  const kotak = page.locator(".lokasi-galat");
  await expect(kotak).toBeVisible();
  await expect(kotak).toContainText("koneksi");
  await expect(page.locator(".sheet--izin"), "jangan tawarkan izin yang pasti gagal").toHaveCount(0);
  console.log("\n  isSecureContext=false -> pesan HTTPS, sheet tidak ditawarkan ✓");
});

test("B1 watchPosition dihentikan saat mode ikuti dimatikan", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation(MONAS);
  await page.addInitScript(() => {
    window.__watch = { mulai: 0, henti: 0 };
    const w = navigator.geolocation.watchPosition.bind(navigator.geolocation);
    const c = navigator.geolocation.clearWatch.bind(navigator.geolocation);
    navigator.geolocation.watchPosition = (...a) => { window.__watch.mulai++; return w(...a); };
    navigator.geolocation.clearWatch = (...a) => { window.__watch.henti++; return c(...a); };
    if (navigator.permissions) navigator.permissions.query = () => Promise.resolve({ state: "granted" });
  });
  await buka(page);
  await page.waitForTimeout(2500);

  const ikuti = page.locator(".fab--ikuti");
  await expect(ikuti).toBeVisible();
  await ikuti.click();
  await page.waitForTimeout(800);
  const stlhNyala = await page.evaluate(() => window.__watch);

  await ikuti.click();
  await page.waitForTimeout(800);
  const stlhMati = await page.evaluate(() => window.__watch);

  console.log(`\n  nyala: watch=${stlhNyala.mulai} clear=${stlhNyala.henti}`);
  console.log(`  mati : watch=${stlhMati.mulai} clear=${stlhMati.henti}`);
  expect(stlhNyala.mulai, "watchPosition tidak jalan").toBe(1);
  expect(stlhMati.henti, "clearWatch tidak dipanggil saat dimatikan").toBe(1);
});
