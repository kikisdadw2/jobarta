import { supabase, adaSupabase } from "./supabase";

/* Aturan username — SATU SUMBER, seperti `password.js`.
 *
 * 🔴 Kenapa aturan ini harus hidup sebagai kode, bukan cuma teks bantuan di
 *    bawah field: username diterjemahkan jadi email sintetis
 *    `<username>@pengguna.jobarta.local`. Kalau formatnya tidak diperiksa di
 *    sini, satu-satunya yang memvalidasi adalah parser email milik Supabase —
 *    dan ia menjawab "Unable to validate email address: invalid format", istilah
 *    yang menyebut EMAIL kepada orang yang merasa sedang mengisi USERNAME.
 *    Sebelum ada berkas ini, "Budi Santoso" ditolak sebagai "Pendaftaran gagal.
 *    Periksa koneksi lalu coba lagi." padahal koneksinya sehat.
 */

export const PANJANG_MIN = 3;
export const PANJANG_MAKS = 20;

/** Karakter yang aman jadi bagian kiri alamat email sekaligus enak dibaca. */
const POLA = /^[a-z0-9._]+$/;

/**
 * Periksa format saja — tidak menyentuh jaringan.
 * @returns {string|null} pesan galat siap tampil, atau null bila lolos.
 */
export function galatFormat(username) {
  const u = String(username).trim().toLowerCase();
  if (!u) return "Username belum diisi.";
  if (u.length < PANJANG_MIN) return `Username minimal ${PANJANG_MIN} karakter.`;
  if (u.length > PANJANG_MAKS) return `Username maksimal ${PANJANG_MAKS} karakter.`;
  if (!POLA.test(u)) return "Hanya huruf, angka, titik, dan garis bawah — tanpa spasi.";
  // Titik di ujung membuat alamat email sintetisnya ditolak server.
  if (u.startsWith(".") || u.endsWith(".")) return "Username tidak boleh diawali atau diakhiri titik.";
  return null;
}

export function formatLolos(username) {
  return galatFormat(username) === null;
}

/**
 * Tanya backend apakah username masih bebas.
 *
 * Memakai RPC `username_tersedia` (schema.sql bagian 4) — bukan SELECT ke tabel
 * `profiles`, yang akan membocorkan seluruh daftar pengguna ke anon. Fungsi itu
 * menjawab satu boolean dan tidak mengembalikan baris apa pun.
 *
 * @returns {Promise<boolean|null>} true bebas, false terpakai,
 *          null = tidak bisa memastikan (mode lokal / jaringan gagal).
 */
export async function cekTersedia(username) {
  if (!adaSupabase) return null;
  const { data, error } = await supabase.rpc("username_tersedia", {
    nama: String(username).trim().toLowerCase(),
  });
  /* Gagal bertanya BUKAN berarti "terpakai". Menandai merah username yang
   * sebenarnya bebas hanya karena jaringan berkedip akan membuat orang
   * mengganti nama yang sudah benar. Biarkan pendaftaran yang memutuskan. */
  if (error) return null;
  return data === true;
}
