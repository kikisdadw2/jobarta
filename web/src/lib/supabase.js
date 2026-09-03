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
