/* Sesi SUNGGUHAN untuk tes.
 *
 * 🔴 Sampai 2026-09-05 fixture tes menyemai `jobarta.sesi` ke localStorage.
 *    Itu berhenti bekerja begitu autentikasi pindah ke Supabase: konteks Auth
 *    mengambil sesi dari server dan mengabaikan localStorage sepenuhnya. Jadi
 *    13 tes menguji pengguna yang menurut aplikasi TIDAK PERNAH MASUK — dan
 *    gagal dengan "element(s) not found" yang menyesatkan, seolah UI-nya yang
 *    rusak.
 *
 *    Semua fixture di bawah mendaftarkan akun betulan lewat layar Daftar,
 *    persis seperti pengguna. Lebih lambat beberapa detik, dan itu harga yang
 *    pantas: tes yang memalsukan hal yang sedang diujinya tidak menjaga apa
 *    pun.
 */
import { expect } from "@playwright/test";
import fs from "node:fs";

const env = (() => {
  const teks = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const ambil = (n) =>
    (teks.match(new RegExp(`^${n}=(.*)$`, "m"))?.[1] ?? "").trim().replace(/^["']|["']$/g, "");
  return {
    url: ambil("VITE_SUPABASE_URL"),
    kunci: ambil("VITE_SUPABASE_PUBLISHABLE_KEY") || ambil("VITE_SUPABASE_ANON_KEY"),
  };
})();

function usernameBaru(awalan) {
  return awalan + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100);
}

/** Daftar akun baru lewat layar Daftar dan berhenti di /onboarding. */
export async function daftar(page, awalan = "ts") {
  const u = usernameBaru(awalan);
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

/* Menulis kolom profil lewat REST memakai access token MILIK AKUN ITU SENDIRI
   — jalur yang sama dengan halaman Profil. Tidak ada RLS yang ditembus dan
   tidak ada kunci rahasia yang dipakai; kalau kebijakan melarangnya, fixture
   ini ikut gagal, dan itu memang informasi yang berguna. */
export async function tulisProfil(page, patch) {
  const galat = await page.evaluate(
    async ({ url, kunci, isi }) => {
      const k = Object.keys(localStorage).find((x) => x.startsWith("sb-") && x.endsWith("-auth-token"));
      if (!k) return "tidak ada sesi Supabase";
      const mentah = JSON.parse(localStorage.getItem(k));
      const sesi = mentah.currentSession ?? mentah;
      const r = await fetch(`${url}/rest/v1/profiles?id=eq.${sesi.user.id}`, {
        method: "PATCH",
        headers: {
          apikey: kunci,
          Authorization: `Bearer ${sesi.access_token}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(isi),
      });
      return r.ok ? null : `${r.status} ${(await r.text()).slice(0, 200)}`;
    },
    { url: env.url, kunci: env.kunci, isi: patch }
  );
  expect(galat, galat ?? "").toBeNull();
}

const CV_CONTOH = {
  nama: "CV-Rizky-2026.pdf",
  ukuran: 1887436,
  tipe: "application/pdf",
  diunggahPada: new Date().toISOString(),
};

/** Pencari kerja yang sudah selesai onboarding, dengan atau tanpa CV. */
export async function seekerSiap(page, { denganCv = true } = {}) {
  const u = await daftar(page, "sk");
  await tulisProfil(page, {
    role: "seeker",
    full_name: "Rizky Ghazirah Himawan",
    domisili: "Tebet",
    cv_meta: denganCv ? CV_CONTOH : null,
  });
  await page.addInitScript(() => {
    /* Riwayat lamaran dibersihkan supaya tes yang menghitung baris tidak
       mewarisi keadaan dari tes sebelumnya. */
    localStorage.removeItem("jobarta.lamaran");
    /* Sheet penjelasan izin lokasi ditandai SUDAH DILIHAT. Ia muncul otomatis
       di /peta dan menutupi tombol di bawahnya — termasuk "Lamar Sekarang".
       Tanpa ini setiap tes melamar gagal dengan timeout yang menyesatkan,
       seolah tombolnya hilang. Perilaku sheet-nya sendiri diuji terpisah di
       tes/lokasi.spec.js, jadi tidak ada cakupan yang hilang. */
    localStorage.setItem("jobarta.lokasi.dijelaskan", "1");
  });
  return u;
}

/** Employer yang sudah selesai onboarding. `perusahaan` opsional: status
 *  verifikasi usaha masih disimpan di perangkat, bukan di server. */
export async function employerSiap(page, perusahaan = null) {
  const u = await daftar(page, "em");
  await tulisProfil(page, { role: "employer", full_name: "Toko Sejahtera" });
  await page.addInitScript((p) => {
    localStorage.removeItem("jobarta.lowonganku");
    if (p) localStorage.setItem("jobarta.perusahaan", JSON.stringify(p));
    else localStorage.removeItem("jobarta.perusahaan");
  }, perusahaan);
  return u;
}
