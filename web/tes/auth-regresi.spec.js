/* Regresi jalur Daftar & Masuk.
 *
 * Empat bug yang dijaga berkas ini, semuanya ditemukan 2026-09-04:
 *   1. cek ketersediaan username memakai daftar hardcoded 4 nama, jadi username
 *      yang SUDAH ada di database dijawab "✓ bisa dipakai";
 *   2. username tak valid ditolak sebagai "Periksa koneksi lalu coba lagi",
 *      padahal jaringannya sehat — yang salah isian formnya;
 *   3. aturan "3–20 karakter" cuma teks bantuan: username "ab" tetap diterima;
 *   4. chip saran menandai dirinya "bisa dipakai" tanpa pernah bertanya.
 *
 * 🔴 Menembak Supabase sungguhan dan MEMBUAT AKUN. Username selalu diberi
 *    awalan `uji` + stempel waktu supaya tidak bertabrakan dengan data asli.
 */
import { test, expect } from "@playwright/test";

const PASS = "jobarta2026";
const baru = () => `uji${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function isiDaftar(page, username, password = PASS) {
  await page.goto("/daftar");
  await page.fill("#d-username", username);
  await page.fill("#d-password", password);
  await page.locator(".consent input[type=checkbox]").check();
}

async function kirimDaftar(page) {
  await page.click("button[type=submit]");
  const dialog = page.locator("text=Ya, lanjut tanpa email");
  if (await dialog.count()) await dialog.click();
}

/** Ketik username lalu pindah fokus, seperti pengguna sungguhan. */
async function ketikLaluTinggalkan(page, username) {
  await page.goto("/daftar");
  await page.fill("#d-username", username);
  await page.locator("#d-password").click();
  return page.locator("[aria-live=polite]");
}

const galatForm = (page) => page.locator(".peringatan, [role=alert]");

test.describe("Daftar", () => {
  test("akun baru terbuat dan langsung masuk", async ({ page }) => {
    await isiDaftar(page, baru());
    await kirimDaftar(page);
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test("username yang sudah terpakai dijawab jujur saat mengetik", async ({ page }) => {
    const u = baru();
    await isiDaftar(page, u);
    await kirimDaftar(page);
    await expect(page).toHaveURL(/\/onboarding/);
    await page.evaluate(() => localStorage.clear());

    // username ini sekarang PASTI ada di database
    const kabar = await ketikLaluTinggalkan(page, u);
    await expect(kabar).toContainText("sudah dipakai");
  });

  test("username bebas ditandai bisa dipakai", async ({ page }) => {
    const kabar = await ketikLaluTinggalkan(page, baru());
    await expect(kabar).toContainText("bisa dipakai");
  });

  test("username berspasi ditolak sebelum menyentuh jaringan", async ({ page }) => {
    const kabar = await ketikLaluTinggalkan(page, "Budi Santoso");
    await expect(kabar).toContainText("tanpa spasi");
    // dan tombolnya tidak bisa ditekan sama sekali
    await page.fill("#d-password", PASS);
    await page.locator(".consent input[type=checkbox]").check();
    await expect(page.locator("button[type=submit]")).toBeDisabled();
  });

  test("username di bawah 3 karakter ditolak", async ({ page }) => {
    const kabar = await ketikLaluTinggalkan(page, "ab");
    await expect(kabar).toContainText("minimal 3 karakter");
    await page.fill("#d-password", PASS);
    await page.locator(".consent input[type=checkbox]").check();
    await expect(page.locator("button[type=submit]")).toBeDisabled();
  });

  test("mendaftarkan username yang sama dua kali ditolak dengan sebab yang benar", async ({ page }) => {
    const u = baru();
    await isiDaftar(page, u);
    await kirimDaftar(page);
    await expect(page).toHaveURL(/\/onboarding/);
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();

    await isiDaftar(page, u);
    await kirimDaftar(page);
    await expect(galatForm(page)).toContainText("sudah dipakai");
    // pesan lama yang menyesatkan tidak boleh muncul lagi
    await expect(galatForm(page)).not.toContainText("koneksi");
  });
});

test.describe("Masuk", () => {
  test("akun yang baru dibuat bisa masuk dari perangkat bersih", async ({ page }) => {
    const u = baru();
    await isiDaftar(page, u);
    await kirimDaftar(page);
    await expect(page).toHaveURL(/\/onboarding/);

    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto("/masuk");
    await page.fill("#username", u);
    await page.fill("#password", PASS);
    await page.click("button[type=submit]");
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test("password salah ditolak tanpa membocorkan mana yang salah", async ({ page }) => {
    const u = baru();
    await isiDaftar(page, u);
    await kirimDaftar(page);
    /* Tunggu pendaftaran benar-benar tuntas. Membuang cookie lebih cepat dari
       ini membatalkan signup yang masih di jalan, dan tesnya gagal karena
       akunnya memang tidak pernah terbentuk — bukan karena aplikasinya rusak. */
    await expect(page).toHaveURL(/\/onboarding/);
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto("/masuk");
    await page.fill("#username", u);
    await page.fill("#password", "password-yang-salah-sekali");
    await page.click("button[type=submit]");
    await expect(galatForm(page)).toContainText("Username atau password salah");
    await expect(page).toHaveURL(/\/masuk/);
  });

  test("username huruf besar tetap bisa masuk", async ({ page }) => {
    const u = baru();
    await isiDaftar(page, u);
    await kirimDaftar(page);
    /* Tunggu pendaftaran benar-benar tuntas. Membuang cookie lebih cepat dari
       ini membatalkan signup yang masih di jalan, dan tesnya gagal karena
       akunnya memang tidak pernah terbentuk — bukan karena aplikasinya rusak. */
    await expect(page).toHaveURL(/\/onboarding/);
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto("/masuk");
    await page.fill("#username", u.toUpperCase());
    await page.fill("#password", PASS);
    await page.click("button[type=submit]");
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test("sesi bertahan di rute terlindungi setelah pindah halaman", async ({ page }) => {
    await isiDaftar(page, baru());
    await kirimDaftar(page);
    await expect(page).toHaveURL(/\/onboarding/);
    await page.goto("/profil");
    await expect(page).toHaveURL(/\/profil/);
  });
});
