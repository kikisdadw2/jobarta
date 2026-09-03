/* Lowongan yang disimpan ("Simpan Lowongan" di panel detail).
 *
 * Bentuk datanya sengaja paling sederhana yang cukup: himpunan id. Tidak ada
 * catatan, tidak ada folder, tidak ada tanggal — begitu backend masuk, tabel
 * `saved_jobs` cuma butuh (user_id, job_id, created_at) dan pemanggil di UI
 * tidak berubah sama sekali.
 *
 * Kenapa ini ada padahal melamar sudah ada: melamar itu keputusan yang tidak
 * bisa dibatalkan, sedangkan orang sering menemukan lowongan bagus saat belum
 * siap melamar — misalnya CV-nya ada di komputer, bukan di HP. Tanpa tempat
 * menyimpan, satu-satunya cara mengingat lowongan itu adalah tidak menutup
 * tab-nya.
 */

const KUNCI = "jobarta.simpanan";

export function bacaSimpanan() {
  try {
    const mentah = localStorage.getItem(KUNCI);
    const isi = mentah ? JSON.parse(mentah) : [];
    return new Set(Array.isArray(isi) ? isi : []);
  } catch {
    return new Set();
  }
}

function tulis(kumpulan) {
  try {
    localStorage.setItem(KUNCI, JSON.stringify([...kumpulan]));
  } catch {
    /* penyimpanan penuh atau diblokir: simpanan cuma tidak bertahan */
  }
  return kumpulan;
}

export function sudahDisimpan(id) {
  return bacaSimpanan().has(id);
}

/** Kembalikan himpunan baru supaya React melihatnya sebagai state yang berubah. */
export function togglSimpanan(id) {
  const baru = new Set(bacaSimpanan());
  if (baru.has(id)) baru.delete(id);
  else baru.add(id);
  return tulis(baru);
}
