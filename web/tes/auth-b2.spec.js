/* BLOK B2 — sesi di header, logout bersih, callback OAuth, reset password. */
import { test, expect } from "@playwright/test";

const PASS = "jobarta2026";
const baru = (p) => p + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100);

async function daftar(page, { email } = {}) {
  const u = baru("b2");
  await page.goto("/daftar");
  await page.fill("#d-username", u);
  await page.fill("#d-password", PASS);
  if (email) await page.fill("#d-email", email);
  await page.locator(".consent input[type=checkbox]").check();
  await page.click("button[type=submit]");
  const dlg = page.locator("text=Ya, lanjut tanpa email");
  if (await dlg.count()) await dlg.click();
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 20000 });
  return u;
}

test.describe("B2 header sadar sesi", () => {
  test("tamu melihat Masuk + Daftar di landing", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".akun-tamu")).toBeVisible();
    await expect(page.locator(".akun")).toHaveCount(0);
  });

  test("yang sudah masuk TIDAK melihat tombol Masuk di landing", async ({ page }) => {
    await daftar(page);
    await page.goto("/");
    await page.waitForTimeout(2000);

    await expect(page.locator(".akun__pemicu"), "menu akun tidak muncul").toBeVisible();
    await expect(page.locator(".akun-tamu"), "tombol Masuk masih tampil padahal sudah login").toHaveCount(0);
  });

  test("tidak ada kedipan tombol Masuk saat sesi masih dimuat", async ({ page }) => {
    await daftar(page);

    /* Tahan permintaan sesi supaya keadaan `memuat` sempat teramati. Tanpa
       penundaan ini, penantiannya lewat terlalu cepat untuk diperiksa. */
    await page.route("**/auth/v1/user**", async (route) => {
      await new Promise((r) => setTimeout(r, 1200));
      route.continue();
    });

    await page.goto("/");
    // Pada milidetik pertama yang tampil harus KERANGKA, bukan menu tamu.
    await expect(page.locator(".akun-kerangka")).toBeVisible({ timeout: 3000 });
    await expect(page.locator(".akun-tamu"), "menu tamu berkedip saat memuat").toHaveCount(0);
    console.log("\n  kerangka tampil, tombol Masuk tidak berkedip");
  });

  test("menu akun memuat Profil, Lamaran Saya, dan Keluar", async ({ page }) => {
    await daftar(page);
    await page.goto("/");
    await page.waitForTimeout(1500);
    await page.click(".akun__pemicu");

    const menu = page.locator(".akun__menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Profil" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Lamaran Saya" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Keluar" })).toBeVisible();
  });

  test("menu tertutup dengan Escape", async ({ page }) => {
    await daftar(page);
    await page.goto("/");
    await page.waitForTimeout(1500);
    await page.click(".akun__pemicu");
    await expect(page.locator(".akun__menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".akun__menu")).toHaveCount(0);
  });
});

test("B2 logout membersihkan sesi DAN cache profil", async ({ page }) => {
  await daftar(page);

  // Isi profil supaya ada cache yang harus dibuang.
  await page.goto("/profil");
  await page.waitForTimeout(1500);
  await page.fill("#domisili", "Pasar Minggu");
  await page.click("button[type=submit]");
  await page.waitForTimeout(2000);

  const sebelum = await page.evaluate(() => localStorage.getItem("jobarta.profil"));
  expect(sebelum, "profil belum tersimpan, tes tidak bermakna").not.toBeNull();

  await page.goto("/");
  await page.waitForTimeout(1500);
  await page.click(".akun__pemicu");
  await page.click(".akun__keluar");
  await page.waitForTimeout(2000);

  const sesudah = await page.evaluate(() => ({
    profil: localStorage.getItem("jobarta.profil"),
    url: location.pathname,
  }));
  console.log(`\n  setelah keluar: url=${sesudah.url} cache profil=${sesudah.profil}`);

  expect(sesudah.url, "tidak diarahkan ke landing").toBe("/");
  expect(sesudah.profil, "cache profil tertinggal untuk pengguna berikutnya").toBeNull();
  await expect(page.locator(".akun-tamu")).toBeVisible();
});

test.describe("B2 callback OAuth", () => {
  test("rute /auth/callback ada dan menunggu, tidak melempar balik", async ({ page }) => {
    await page.goto("/auth/callback");
    await page.waitForTimeout(1200);
    // Tanpa token: menunggu dulu, bukan langsung dianggap gagal masuk.
    await expect(page.locator(".kotak-tunggu")).toBeVisible();
    console.log("\n  /auth/callback terdaftar dan menahan sebelum meneruskan");
  });

  test("pembatalan dari Google dijelaskan, bukan ditampilkan sebagai kerusakan", async ({ page }) => {
    await page.goto("/auth/callback#error=access_denied&error_description=access_denied");
    await page.waitForTimeout(1200);
    await expect(page.locator(".kotak-tunggu")).toContainText("membatalkan");
  });
});

test.describe("B2 reset password", () => {
  test("LupaPassword memanggil Supabase dan responsnya seragam", async ({ page }) => {
    const dipanggil = [];
    await page.route("**/auth/v1/recover**", (route) => {
      dipanggil.push(route.request().url());
      route.fulfill({ status: 200, body: "{}" });
    });

    await page.goto("/lupa-password");
    await page.fill("#lp-email", "tidak-ada-sama-sekali@contoh.com");
    await page.click("button[type=submit]");
    await page.waitForTimeout(1500);

    console.log(`\n  panggilan recover: ${dipanggil.length}`);
    expect(dipanggil.length, "resetPasswordForEmail tidak dipanggil").toBeGreaterThan(0);
    // Alamat yang pasti tidak terdaftar tetap melihat layar "terkirim".
    await expect(page.locator(".auth__kotak")).toContainText(/terkirim|cek email|kirim ulang/i);
  });

  test("AturUlang tanpa token menolak, bukan menampilkan form", async ({ page }) => {
    await page.goto("/atur-ulang");
    await page.waitForTimeout(2500);
    const kotak = page.locator(".auth__kotak");
    await expect(kotak).not.toContainText("Simpan password baru");
    await expect(kotak).toContainText(/lewat|kedaluwarsa|tautan baru/i);
    console.log("\n  tanpa token: form tidak ditampilkan");
  });
});

test.describe("B2 email auth: sintetis vs asli", () => {
  test("daftar TANPA email pemulihan tetap bisa masuk (jalur sintetis)", async ({ page }) => {
    const u = await daftar(page);
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto("/masuk");
    await page.fill("#username", u);
    await page.fill("#password", PASS);
    await page.click("button[type=submit]");
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 20000 });
    console.log(`\n  ${u} (sintetis) bisa masuk`);
  });

  test("daftar DENGAN email pemulihan tetap bisa masuk pakai username", async ({ page }) => {
    /* Inilah yang dijaga RPC email_login: emailnya bukan lagi tebakan dari
       username, jadi tanpa RPC login akan gagal walau passwordnya benar. */
    const alamat = `b2${Date.now().toString(36)}@contoh-jobarta.test`;
    const u = await daftar(page, { email: alamat });
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto("/masuk");
    await page.fill("#username", u);
    await page.fill("#password", PASS);
    await page.click("button[type=submit]");
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 20000 });
    console.log(`  ${u} (email asli ${alamat}) bisa masuk lewat username`);
  });
});
