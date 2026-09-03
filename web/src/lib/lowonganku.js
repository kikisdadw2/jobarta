/* Lowongan yang DIPASANG perusahaan lewat JOBARTA.
 *
 * Bentuk tiap barisnya sama persis dengan `src/data/lowongan.js` — itu syarat,
 * bukan kebetulan. Peta, kartu, panel detail, dan halaman Lamaran Saya membaca
 * satu bentuk data saja; kalau lowongan buatan pengguna berbeda bentuk, setiap
 * komponen itu harus tahu asal-usul datanya. Lihat `semuaLowongan()` di bawah.
 *
 * Tambahan di luar kontrak itu cuma dua, dan keduanya milik sisi employer:
 *   dibuatPada  string  ISO — dipakai mengurutkan dasbor
 *   aktif       boolean false = ditutup, hilang dari peta tapi tetap di dasbor
 *
 * `terverifikasi` SENGAJA tidak disimpan di sini. Ia diturunkan dari status
 * perusahaan saat dibaca (lihat `semuaLowongan`), supaya satu persetujuan
 * admin langsung berlaku untuk semua lowongan lama — bukan cuma yang baru.
 */

import statis from "../data/lowongan";
import { bacaPerusahaan } from "./perusahaan";

const KUNCI = "jobarta.lowonganku";

export function bacaLowonganku() {
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
    /* kuota penuh: lowongan tidak bertahan setelah tab ditutup */
  }
  return daftar;
}

/* Id memakai cap waktu, bukan urutan (`lok-1`, `lok-2`): urutan akan bentrok
 * dengan lowongan yang sudah dihapus dan membuat satu lamaran lama menempel
 * ke lowongan baru yang kebetulan mewarisi nomornya. */
function idBaru() {
  return `lok-${Date.now().toString(36)}`;
}

export function tambahLowongan(isi) {
  return tulis([
    ...bacaLowonganku(),
    { ...isi, id: idBaru(), dibuatPada: new Date().toISOString(), aktif: true },
  ]);
}

export function perbaruiLowongan(id, patch) {
  return tulis(bacaLowonganku().map((l) => (l.id === id ? { ...l, ...patch } : l)));
}

export function hapusLowongan(id) {
  return tulis(bacaLowonganku().filter((l) => l.id !== id));
}

export function cariLowonganku(id) {
  return bacaLowonganku().find((l) => l.id === id) || null;
}

/* Ubah baris simpanan jadi bentuk yang dibaca peta.
 *
 * `dipostingHari` dihitung ULANG dari `dibuatPada` setiap kali dibaca. Kalau ia
 * disimpan sebagai angka, lowongan yang dipasang hari ini akan selamanya
 * berkata "1 hari lalu" — dan justru kesegaran itulah yang dinilai pencari
 * kerja saat memilih mau melamar ke mana. */
function keBentukPeta(l, perusahaan) {
  const hari = Math.max(
    0,
    Math.floor((Date.now() - new Date(l.dibuatPada).getTime()) / 86400000)
  );
  return {
    ...l,
    perusahaan: perusahaan.nama || l.perusahaan || "Perusahaan tanpa nama",
    terverifikasi: perusahaan.status === "terverifikasi",
    diverifikasiPada: perusahaan.diverifikasiPada ?? undefined,
    dipostingHari: hari,
  };
}

/* Katalog gabungan: 30 lowongan contoh + lowongan yang dipasang pengguna.
 *
 * Buatan pengguna diletakkan DI DEPAN supaya employer yang baru memasang
 * langsung menemukan miliknya di daftar — tanpa itu, lowongan barunya
 * tenggelam di antara 30 contoh dan alurnya terasa gagal.
 *
 * Lowongan dari perusahaan yang belum terverifikasi TETAP TAYANG, memakai pin
 * bergaris putus dan kalimat peringatan yang sudah ada di PanelDetail. Alasan:
 * verifikasi di JOBARTA adalah pembeda kepercayaan, bukan gerbang tayang —
 * kalau ia jadi gerbang, employer baru melihat kerjanya menghilang dan tidak
 * pernah kembali. Lihat catatan keputusan di decisions.md.
 */
export function semuaLowongan() {
  const perusahaan = bacaPerusahaan();
  const milikku = bacaLowonganku()
    .filter((l) => l.aktif !== false)
    .map((l) => keBentukPeta(l, perusahaan))
    .sort((a, b) => new Date(b.dibuatPada) - new Date(a.dibuatPada));
  return [...milikku, ...statis];
}

/** Semua lowongan termasuk yang ditutup — dipakai Lamaran Saya supaya lamaran
 *  ke lowongan yang sudah ditutup tidak menghilang dari riwayat pelamar. */
export function katalogLengkap() {
  const perusahaan = bacaPerusahaan();
  return [...bacaLowonganku().map((l) => keBentukPeta(l, perusahaan)), ...statis];
}
