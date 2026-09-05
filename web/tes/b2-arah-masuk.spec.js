/* Redirect sesudah masuk menghormati peran.
 *
 * Bug (2026-09-05): `Masuk.jsx` dan `Callback.jsx` sama-sama menulis
 * `navigate("/onboarding")` tanpa syarat. Akibatnya akun yang sudah lama
 * terdaftar ditanyai lagi "kamu ke sini untuk apa?" SETIAP KALI login —
 * produk yang terasa lupa siapa penggunanya, tepat setelah ia membuktikan
 * identitasnya.
 *
 * Jebakan yang hampir terulang saat memperbaikinya: `onboardingSelesai()` di
 * lib/sesi.js membaca localStorage, yang diabaikan di mode Supabase. Karena
 * itu keputusan arah diambil dari sesi konteks Auth lewat lib/arah.js.
 */
import { test, expect } from "@playwright/test";
import { arahSetelahMasuk, onboardingBeres } from "../src/lib/arah.js";
import { daftar, tulisProfil } from "./bantu-sesi.js";

test.describe("arahSetelahMasuk — keputusan murni", () => {
  const aktif = (role) => ({ role, accountStatus: "active" });

  test("employer yang sudah onboarding ke dasbornya, seeker ke peta", () => {
    expect(arahSetelahMasuk(aktif("employer"))).toBe("/perusahaan");
    expect(arahSetelahMasuk(aktif("seeker"))).toBe("/peta");
  });

  test("onboarding belum selesai selalu menang", () => {
    expect(arahSetelahMasuk({ role: null, accountStatus: "active" })).toBe("/onboarding");
    expect(arahSetelahMasuk({ role: "seeker", accountStatus: "pending_consent" })).toBe("/onboarding");
    // Bahkan kalau ada tujuan asal: peran adalah gerbang, bukan formalitas.
    expect(arahSetelahMasuk({ role: null, accountStatus: "active" }, "/lamaran")).toBe("/onboarding");
  });

  test("tujuan asal dihormati bagi akun yang sudah lengkap", () => {
    expect(arahSetelahMasuk(aktif("seeker"), "/lamaran")).toBe("/lamaran");
    expect(arahSetelahMasuk(aktif("employer"), "/perusahaan/pasang")).toBe("/perusahaan/pasang");
  });

  test("tujuan luar ditolak — `?lanjut=` bukan open redirect", () => {
    /* Tanpa penjagaan ini, tautan "masuk" yang tampak sah bisa memulangkan
       orang ke domain penyerang persis setelah ia mengetik password. */
    for (const jahat of ["https://jahat.example", "//jahat.example", "javascript:alert(1)"]) {
      expect(arahSetelahMasuk(aktif("seeker"), jahat)).toBe("/peta");
    }
  });

  test("onboardingBeres menuntut peran DAN akun aktif", () => {
    expect(onboardingBeres({ role: "seeker", accountStatus: "active" })).toBe(true);
    expect(onboardingBeres({ role: "seeker", accountStatus: "deactivated" })).toBe(false);
    expect(onboardingBeres({ role: null, accountStatus: "active" })).toBe(false);
    expect(onboardingBeres(null)).toBe(false);
  });
});

test.describe("masuk ulang tidak menanyai peran lagi", () => {
  /** Daftar, tetapkan peran, keluar, lalu masuk lagi. */
  async function daftarLaluMasukUlang(page, role) {
    const u = await daftar(page, "ar");
    await tulisProfil(page, { role, account_status: "active", full_name: "Penguji Arah" });

    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto("/masuk");
    await page.fill("#username", u);
    await page.fill("#password", "jobarta2026");
    await page.click("button[type=submit]");
    await page.waitForTimeout(6000);
    return new URL(page.url()).pathname;
  }

  test("seeker mendarat di peta, bukan di onboarding", async ({ page }) => {
    const jalur = await daftarLaluMasukUlang(page, "seeker");
    console.log(`\n  seeker masuk ulang → ${jalur}`);
    expect(jalur, "seeker dilempar ke onboarding lagi").toBe("/peta");
  });

  test("employer mendarat di dasbornya, bukan di onboarding", async ({ page }) => {
    const jalur = await daftarLaluMasukUlang(page, "employer");
    console.log(`  employer masuk ulang → ${jalur}`);
    expect(jalur, "employer dilempar ke onboarding lagi").toBe("/perusahaan");
  });

  test("tujuan asal dari rute terlindungi dibawa serta", async ({ page }) => {
    const u = await daftar(page, "ar");
    await tulisProfil(page, { role: "seeker", account_status: "active", full_name: "Penguji Arah" });
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Persis yang dilakukan RuteTerlindungi saat menolak tamu.
    await page.goto("/masuk?lanjut=%2Flamaran");
    await page.fill("#username", u);
    await page.fill("#password", "jobarta2026");
    await page.click("button[type=submit]");
    await page.waitForTimeout(6000);
    const jalur = new URL(page.url()).pathname;
    console.log(`  masuk dengan ?lanjut=/lamaran → ${jalur}`);
    expect(jalur).toBe("/lamaran");
  });
});
