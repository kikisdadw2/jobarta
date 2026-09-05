/* Satu sumber kebenaran untuk semua jalur kontak.
 *
 * 🔴 Alamat kontak TIDAK BOLEH diketik ulang di tiap halaman. Kebijakan
 *    Privasi, Syarat Penggunaan, footer, dan tombol laporan semuanya
 *    menjanjikan kanal yang sama; begitu salah satunya menyimpang, ada
 *    pengguna yang mengirim keluhan ke alamat yang tidak ada dan mengira
 *    laporannya sudah sampai. UU PDP menuntut kanal yang benar-benar
 *    terjangkau, bukan sekadar tercantum.
 */

export const EMAIL_KONTAK = "daada4446@gmail.com";

/* Belum ada nomor telepon resmi JOBARTA. Yang terlihat seperti nomor di
   VerifikasiUsaha.jsx adalah CONTOH untuk diisi employer sendiri, dan field
   itu memang tidak pernah ditampilkan ke pencari kerja. Konstanta ini sengaja
   null, bukan diisi nomor karangan: nomor palsu di halaman legal lebih buruk
   daripada tidak ada nomor sama sekali. */
export const TELEPON_KONTAK = null;

/**
 * Rakit `mailto:` dengan subjek — dan, bila ada, badan surat yang sudah terisi.
 *
 * Subjek diisi supaya orang tidak perlu merumuskan sendiri keperluannya, dan
 * supaya yang membaca kotak masuk bisa memilah tanpa membuka satu per satu.
 */
export function mailto(subjek, badan) {
  const q = new URLSearchParams({ subject: subjek });
  if (badan) q.set("body", badan);
  /* URLSearchParams memakai `+` untuk spasi; sebagian klien surel menampilkan
     `+` itu apa adanya di kolom subjek. %20 dibaca benar di semuanya. */
  return `mailto:${EMAIL_KONTAK}?${q.toString().replace(/\+/g, "%20")}`;
}

/** Tanggal berlaku kedua halaman legal. Diubah manual saat isinya berubah. */
export const TERAKHIR_DIPERBARUI = "5 September 2026";
