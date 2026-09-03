/* Lamaran yang sudah dikirim — disimpan di browser.
 *
 * Kenapa localStorage: tanpa ini lamaran hilang setiap refresh, dan juri yang
 * membuka ulang halaman akan melihat alur inti seperti tidak berfungsi.
 *
 * BENTUK DATA = kontrak tabel `applications`. Jangan diubah tanpa mengubah ERD:
 *   id           string  "app-<jobId>" — stabil, mencegah lamaran ganda
 *   lowonganId   string  FK ke jobs.id
 *   status       enum    terkirim | dilihat | diproses | ditolak | diterima
 *   dilamarPada  string  ISO 8601 (UTC)
 */

const KUNCI = "jobarta.lamaran";

export const STATUS_LAMARAN = {
  terkirim: { label: "Terkirim", nada: "netral" },
  dilihat: { label: "Dilihat perusahaan", nada: "info" },
  diproses: { label: "Diproses", nada: "info" },
  ditolak: { label: "Belum cocok", nada: "error" },
  diterima: { label: "Diterima", nada: "sukses" },
};

export function bacaLamaran() {
  try {
    const mentah = localStorage.getItem(KUNCI);
    const isi = mentah ? JSON.parse(mentah) : [];
    return Array.isArray(isi) ? isi : [];
  } catch {
    return [];
  }
}

function tulis(daftar) {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(daftar));
  } catch {
    /* penyimpanan penuh atau diblokir: lamaran cuma tidak bertahan */
  }
  return daftar;
}

export function sudahMelamar(lowonganId) {
  return bacaLamaran().some((l) => l.lowonganId === lowonganId);
}

/** Idempoten: melamar dua kali ke lowongan yang sama tidak menambah baris. */
export function tambahLamaran(lowonganId) {
  const daftar = bacaLamaran();
  if (daftar.some((l) => l.lowonganId === lowonganId)) return daftar;
  return tulis([
    ...daftar,
    {
      id: `app-${lowonganId}`,
      lowonganId,
      status: "terkirim",
      dilamarPada: new Date().toISOString(),
    },
  ]);
}

export function batalkanLamaran(lowonganId) {
  return tulis(bacaLamaran().filter((l) => l.lowonganId !== lowonganId));
}

export function idLamaran() {
  return new Set(bacaLamaran().map((l) => l.lowonganId));
}
