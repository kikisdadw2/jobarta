import { createClient } from "@supabase/supabase-js";

/* Klien Supabase — SENGAJA boleh tidak ada.
 *
 * JOBARTA harus tetap bisa dibuka dan didemokan tanpa kunci apa pun: kalau
 * `.env.local` belum diisi, aplikasi jalan di MODE LOKAL (sesi ditandai di
 * localStorage, seperti sebelum autentikasi sungguhan masuk). Ini bukan
 * kemalasan — ini yang membuat tautan demo tidak pernah mati gara-gara satu
 * variabel lingkungan lupa dipasang di panel hosting, dan yang membuat rangkaian
 * tes bisa jalan tanpa menyentuh jaringan.
 *
 * Begitu kedua variabel diisi, seluruh aplikasi pindah ke Supabase tanpa satu
 * baris pun berubah di komponen. Lihat `.env.example`.
 *
 * 🔴 Anon key MEMANG untuk klien dan boleh terbaca publik — yang menjaga data
 *    adalah RLS di `supabase/schema.sql`, bukan kerahasiaan kunci ini. Yang
 *    TIDAK PERNAH boleh masuk ke berkas ini: service_role key.
 */

const url = import.meta.env.VITE_SUPABASE_URL;

/* Supabase sedang berpindah dari `anon` ke `publishable key`, dan `anon`
 * dipensiunkan akhir 2026. Keduanya diterima di sini supaya tidak ada yang
 * tersandung nama variabel: project baru mengeluarkan publishable key, project
 * lama masih memakai anon. Yang mana pun dipasang, dipakai apa adanya. */
const kunciKlien =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const adaSupabase = Boolean(url && kunciKlien);

export const supabase = adaSupabase
  ? createClient(url, kunciKlien, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // dipakai jalur Google OAuth saat kembali dari redirect
      },
    })
  : null;

/* Email sintetis untuk jalur username + password.
 *
 * `auth.users` di Supabase wajib punya email, sedangkan JOBARTA menjanjikan
 * masuk dengan username. Jalan tengahnya: alamat internal yang dibentuk dari
 * username. Alamat ini TIDAK PERNAH ditampilkan ke pengguna dan TIDAK PERNAH
 * dikirimi apa pun — domainnya sengaja `.local` supaya tidak mungkin
 * terkirim ke luar walau ada kode yang keliru mencoba.
 */
export const DOMAIN_SINTETIS = "pengguna.jobarta.local";

export function emailSintetis(username) {
  return `${String(username).trim().toLowerCase()}@${DOMAIN_SINTETIS}`;
}

/** true = alamat ini cuma penampung internal, tidak bisa dikirimi apa pun. */
export function emailItuSintetis(email) {
  return String(email || "").toLowerCase().endsWith("@" + DOMAIN_SINTETIS);
}

/**
 * Email yang dipakai untuk MASUK dengan sebuah username.
 *
 * 🔴 Sejak 2026-09-04 ini tidak bisa lagi ditebak dari usernamenya. Pendaftar
 *    yang mengisi email pemulihan memakai alamat ITU sebagai email auth, supaya
 *    `resetPasswordForEmail` punya kotak surat sungguhan untuk dituju — domain
 *    sintetis `.local` tidak bisa menerima apa pun. Jadi jawabannya harus
 *    ditanyakan ke basis data lewat RPC `email_login`.
 *
 * Kalau RPC gagal atau tidak menemukan apa-apa, jatuh ke alamat sintetis:
 * itu bentuk lama, dan akun yang mendaftar tanpa email pemulihan memang
 * memakainya. Login akan gagal dengan pesan yang sama seperti password salah,
 * yang memang benar — dan tetap tidak membocorkan mana yang keliru.
 */
/* Apakah RPC `email_login` sudah ada di database ini?
 *
 * 🔴 Ini pengaman urutan deploy, bukan kehati-hatian berlebihan. Kalau kode
 *    baru tayang SEBELUM schema.sql dijalankan, akun yang mendaftar dengan
 *    email pemulihan akan dibuat memakai alamat asli sebagai email auth —
 *    sementara layar Masuk tidak punya cara menemukannya, karena RPC-nya belum
 *    ada. Hasilnya: pengguna terkunci dari akun yang baru saja ia buat, dan
 *    tidak ada pesan yang bisa menjelaskannya.
 *
 *    Selama RPC belum ada, pendaftaran kembali memakai alamat sintetis: fitur
 *    lupa-password belum jalan, tapi tidak ada yang terkunci. Kehilangan fitur
 *    jauh lebih murah daripada kehilangan akun.
 */
let rpcAda = null;

export async function emailLoginTersedia() {
  if (!adaSupabase) return false;
  if (rpcAda !== null) return rpcAda;
  try {
    const { error } = await supabase.rpc("email_login", { nama: "__periksa__" });
    rpcAda = !(error && (error.code === "PGRST202" || /not.*found|does not exist/i.test(error.message || "")));
  } catch {
    rpcAda = false;
  }
  return rpcAda;
}

export async function emailUntukMasuk(username) {
  const u = String(username).trim().toLowerCase();
  if (!adaSupabase) return emailSintetis(u);
  try {
    const { data, error } = await supabase.rpc("email_login", { nama: u });
    if (!error && data) return data;
  } catch {
    /* jaringan gagal: pakai bentuk lama, biarkan login yang memutuskan */
  }
  return emailSintetis(u);
}
