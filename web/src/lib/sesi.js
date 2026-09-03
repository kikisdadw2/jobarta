/* Sesi MODE LOKAL — disimpan di browser, BUKAN autentikasi sungguhan.
 *
 * Sejak autentikasi Supabase masuk, berkas ini cuma dipakai saat `.env.local`
 * kosong: aplikasi tetap bisa dibuka dan didemokan tanpa kunci apa pun.
 * Sumber kebenaran "siapa yang sedang masuk" ada di `src/konteks/Auth.jsx`;
 * jangan memanggil fungsi di sini langsung dari komponen baru — pakai
 * `useAuth()` supaya kedua mode berperilaku sama. Bentuk
 * datanya sengaja dibuat sama dengan tabel `profiles` di 01b-erd-auth.mmd
 * supaya penggantinya (Supabase Auth) tidak mengubah komponen mana pun:
 *
 *   username, auth_method, full_name, role, account_status, recovery_email
 *
 * 🔴 JANGAN pernah menyimpan password di sini, sekarang atau nanti. Password
 *    di-hash Supabase; JOBARTA tidak pernah memegangnya.
 */

const KUNCI = "jobarta.sesi";

export const KOSONG = {
  username: null,
  authMethod: null, // "google" | "password"
  fullName: null,
  role: null, // null | "seeker" | "employer"
  accountStatus: null, // "pending_consent" | "active" | "deactivated"
  recoveryEmail: null,
};

export function bacaSesi() {
  // localStorage bisa melempar di mode privat atau saat cookie diblokir —
  // aplikasi harus tetap jalan, cuma dianggap belum masuk.
  try {
    const mentah = localStorage.getItem(KUNCI);
    return mentah ? { ...KOSONG, ...JSON.parse(mentah) } : { ...KOSONG };
  } catch {
    return { ...KOSONG };
  }
}

export function simpanSesi(patch) {
  const baru = { ...bacaSesi(), ...patch };
  try {
    localStorage.setItem(KUNCI, JSON.stringify(baru));
  } catch {
    /* tidak apa-apa: sesi cuma tidak bertahan setelah halaman ditutup */
  }
  return baru;
}

export function hapusSesi() {
  try {
    localStorage.removeItem(KUNCI);
  } catch {
    /* abaikan */
  }
}

export function sudahMasuk() {
  return Boolean(bacaSesi().username);
}

/** Onboarding dianggap selesai kalau peran sudah dipilih DAN akun aktif. */
export function onboardingSelesai() {
  const s = bacaSesi();
  return Boolean(s.role) && s.accountStatus === "active";
}
