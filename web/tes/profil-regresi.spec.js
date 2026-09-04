/* Regresi sinkronisasi profil (bug ditemukan 2026-09-04).
 *
 * Profil dulu hanya hidup di localStorage, jadi ia terikat satu perangkat:
 * yang diisi di laptop terbaca "0 dari 3 lengkap" begitu dibuka di HP.
 * Tes ini memerankan dua perangkat dengan satu akun yang sama.
 *
 * 🔴 Menembak Supabase sungguhan dan MEMBUAT AKUN ber-awalan `uji`.
 */
import { test, expect } from "@playwright/test";

const PASS = "jobarta2026";
const baru = () => `uji${Date.now()}${Math.floor(Math.random() * 1000)}`;

test("BUG 3 — profil yang diisi ikut pindah ke perangkat lain", async ({ page }) => {
  const galat = [];
  page.on("response", async (r) => {
    if (r.status() >= 400 && /supabase/i.test(r.url())) {
      let b = ""; try { b = (await r.text()).slice(0, 250); } catch { /* */ }
      galat.push(`[${r.status()}] ${r.url().split("/rest/v1/")[1] || r.url()}\n        ${b}`);
    }
  });

  const u = baru();

  // --- PERANGKAT 1: daftar lalu isi profil ---
  await page.goto("/daftar");
  await page.fill("#d-username", u);
  await page.fill("#d-password", PASS);
  await page.locator(".consent input[type=checkbox]").check();
  await page.click("button[type=submit]");
  await page.click("text=Ya, lanjut tanpa email");
  await expect(page).toHaveURL(/\/onboarding/);

  await page.goto("/profil");
  await page.waitForTimeout(1500);
  await page.fill("#nama", "Budi Santoso");
  await page.fill("#domisili", "Pasar Minggu, Jakarta Selatan");
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(/\/peta/);
  await page.waitForTimeout(2500);
  console.log(`\n  perangkat 1 — profil disimpan untuk ${u}`);
  console.log(`  galat REST: ${galat.length ? "\n    " + galat.join("\n    ") : "(bersih)"}`);

  // --- PERANGKAT 2: browser bersih, login akun yang sama ---
  await page.evaluate(() => localStorage.clear());
  await page.context().clearCookies();
  galat.length = 0;

  await page.goto("/masuk");
  await page.fill("#username", u);
  await page.fill("#password", PASS);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(/\/onboarding/);

  await page.goto("/peta");
  await page.waitForTimeout(3000);

  const kartu = page.locator(".pengingat");
  const adaKartu = await kartu.count();
  const teks = adaKartu ? await kartu.innerText() : "(kartu pengingat tidak ada)";
  console.log(`\n  perangkat 2 — pengingat berbunyi: ${JSON.stringify(teks.split("\n")[0] + " / " + (teks.split("\n")[1] || ""))}`);
  console.log(`  galat REST: ${galat.length ? "\n    " + galat.join("\n    ") : "(bersih)"}`);

  // domisili sudah diisi di perangkat 1 -> minimal 1 dari 3
  await expect(kartu).not.toContainText("0 dari 3");
});
