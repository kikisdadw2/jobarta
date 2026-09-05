/* Ke mana orang dibawa sesudah berhasil masuk.
 *
 * 🔴 Satu fungsi, dipakai jalur password DAN jalur Google. Sebelum 2026-09-05
 *    keduanya menulis `navigate("/onboarding")` tanpa syarat, jadi akun yang
 *    sudah lama terdaftar ditanyai lagi "kamu ke sini untuk apa?" setiap kali
 *    login. Pertanyaan itu bukan cuma mengganggu: ia membuat produk terasa
 *    lupa siapa penggunanya, tepat pada detik ia baru saja membuktikan
 *    identitasnya.
 *
 * 🔴 Keputusan diambil dari sesi yang DIBERIKAN pemanggil — bukan dari
 *    `bacaSesi()` di lib/sesi.js. Helper `onboardingSelesai()` di sana membaca
 *    localStorage, yang diabaikan sepenuhnya di mode Supabase; memakainya di
 *    halaman login hanya akan melahirkan kembali kelas bug yang sama.
 */

/** Onboarding selesai = peran sudah dipilih DAN akun sudah aktif. */
export function onboardingBeres(sesi) {
  return Boolean(sesi?.role) && sesi?.accountStatus === "active";
}

/* Hanya path internal yang boleh diikuti. Tanpa penjagaan ini, `?lanjut=` jadi
   open redirect: tautan "masuk" yang tampak sah bisa memulangkan orang ke
   domain penyerang persis setelah ia mengetik password. `//jahat.com` ditolak
   karena peramban membacanya sebagai URL berprotokol-relatif. */
function tujuanAman(lanjut) {
  if (!lanjut) return null;
  if (!lanjut.startsWith("/") || lanjut.startsWith("//")) return null;
  return lanjut;
}

/**
 * @param {object} sesi   bentuk sesi dari konteks Auth
 * @param {string} [lanjut] tujuan asal dari RuteTerlindungi (`?lanjut=`)
 * @returns {string} path tujuan
 */
export function arahSetelahMasuk(sesi, lanjut) {
  /* Onboarding belum selesai selalu menang: peran adalah gerbang yang
     menentukan separuh aplikasi, dan melompatinya membawa orang ke layar yang
     tidak bisa ia pakai. */
  if (!onboardingBeres(sesi)) return "/onboarding";

  /* Tujuan asal dihormati lebih dulu — orang yang diminta masuk saat menuju
     /lamaran harus mendarat di /lamaran, bukan di beranda perannya. */
  const aman = tujuanAman(lanjut);
  if (aman) return aman;

  return sesi.role === "employer" ? "/perusahaan" : "/peta";
}
