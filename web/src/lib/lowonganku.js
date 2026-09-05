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
 * PENYIMPANAN: sejak lowongan harus terlihat LINTAS PENGGUNA (employer pasang,
 * pencari kerja lain melihat), sumber kebenarannya adalah tabel `lowongan` di
 * Supabase — lihat `lowongan-db.js`. localStorage hanya dipakai sebagai
 * cadangan saat kredensial Supabase tidak ada, supaya UI tetap bisa
 * didemokan tanpa backend.
 *
 * Semua fungsi di bawah ASINKRON. Itu konsekuensi tak terhindarkan dari pindah
 * ke jaringan, dan sengaja tidak disembunyikan di balik cache sinkron: cache
 * seperti itu akan menampilkan data basi tepat pada kasus yang paling penting,
 * yaitu employer yang baru saja memasang lowongan.
 */

import statis from "../data/lowongan";
import { bacaPerusahaan } from "./perusahaan";
import { supabase, adaSupabase } from "./supabase";
import * as db from "./lowongan-db";

const KUNCI = "jobarta.lowonganku";

/* ---------------------------------------------------------------------------
 * Cadangan localStorage (dipakai hanya bila !adaSupabase)
 * ------------------------------------------------------------------------- */
function bacaLokal() {
  try {
    const isi = JSON.parse(localStorage.getItem(KUNCI) || "[]");
    return Array.isArray(isi) ? isi : [];
  } catch {
    return [];
  }
}

function tulisLokal(daftar) {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(daftar));
  } catch {
    /* kuota penuh / mode privat: biarkan, data sesi ini saja yang hilang */
  }
  return daftar;
}

async function idPengguna() {
  const { data } = await supabase.auth.getSession();
  const id = data?.session?.user?.id;
  if (!id) throw new Error("Kamu harus masuk dulu untuk mengelola lowongan.");
  return id;
}

/* ---------------------------------------------------------------------------
 * CRUD
 * ------------------------------------------------------------------------- */

/** Lowongan milik employer yang sedang masuk, termasuk yang sudah ditutup. */
export async function bacaLowonganku() {
  if (!adaSupabase) return bacaLokal();
  return db.ambilMilik(await idPengguna());
}

export async function tambahLowongan(isi) {
  if (!adaSupabase) {
    return tulisLokal([
      ...bacaLokal(),
      {
        ...isi,
        id: `lok-${Date.now().toString(36)}`,
        dibuatPada: new Date().toISOString(),
        aktif: true,
      },
    ]);
  }
  await db.sisipkan(isi, await idPengguna());
  return bacaLowonganku();
}

export async function perbaruiLowongan(id, patch) {
  if (!adaSupabase) {
    return tulisLokal(
      bacaLokal().map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  }
  await db.perbarui(id, patch);
  return bacaLowonganku();
}

export async function hapusLowongan(id) {
  if (!adaSupabase) return tulisLokal(bacaLokal().filter((l) => l.id !== id));
  await db.hapus(id);
  return bacaLowonganku();
}

export async function cariLowonganku(id) {
  if (!adaSupabase) return bacaLokal().find((l) => l.id === id) || null;
  return db.ambilSatu(id);
}

/* ---------------------------------------------------------------------------
 * Katalog untuk peta
 * ------------------------------------------------------------------------- */

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
  /* Status verifikasi berasal dari DATABASE bila ada (kolom `terverifikasi`,
   * yang hanya boleh ditulis admin), dan hanya jatuh ke profil perusahaan
   * lokal pada mode cadangan. Sebelumnya ia selalu diturunkan dari profil
   * lokal — itu tidak bisa dipertahankan begitu lowongan dilihat orang lain,
   * karena profil perusahaan si employer tidak ada di perangkat mereka. */
  const verif = adaSupabase
    ? { terverifikasi: l.terverifikasi === true, diverifikasiPada: l.diverifikasiPada }
    : {
        terverifikasi: perusahaan.status === "terverifikasi",
        diverifikasiPada: perusahaan.diverifikasiPada ?? undefined,
      };
  return {
    ...l,
    perusahaan: l.perusahaan || perusahaan.nama || "Perusahaan tanpa nama",
    ...verif,
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
 *
 * 30 lowongan contoh dipakai sebagai JARING PENGAMAN, bukan tambahan tetap.
 *
 * 🔴 Sampai 2026-09-05 mereka selalu ditempelkan (`[...dinamis, ...statis]`),
 *    dan itu menyembunyikan kerusakan serius: lowongan contoh hidup hanya di
 *    JavaScript, sehingga TIDAK BISA DILAMAR — kolom `lamaran.lowongan_id`
 *    bertipe uuid dan kebijakan RLS menuntut lowongannya ada di tabel. Peta
 *    terlihat penuh, tombol "Lamar Sekarang" ada, dan yang menekannya
 *    mendapat galat yang menyalahkan koneksinya.
 *
 *    Ke-30 lowongan itu kini ditanam sebagai baris sungguhan
 *    (`supabase/tanam-lowongan.mjs`). Salinan klien tetap disimpan, tapi hanya
 *    muncul kalau database TIDAK mengembalikan apa pun — risiko "peta kosong
 *    saat pengunjung datang" tetap dijaga, tanpa lagi menyajikan lowongan
 *    yang tidak bisa dilamar sebagai kalau-kalau ia bisa.
 */
export async function semuaLowongan() {
  const perusahaan = bacaPerusahaan();
  let dari;
  try {
    dari = adaSupabase ? await db.ambilPublik() : bacaLokal();
  } catch {
    dari = []; // backend bermasalah — peta tetap tampil dengan 30 contoh
  }
  const dinamis = dari
    .filter((l) => l.aktif !== false)
    .map((l) => keBentukPeta(l, perusahaan))
    .sort((a, b) => new Date(b.dibuatPada) - new Date(a.dibuatPada));
  /* Jaring pengaman, bukan tambahan: contoh statis hanya menutupi peta kosong
     saat database tidak menjawab. Selama ia menjawab, yang tampil semuanya
     lowongan yang benar-benar bisa dilamar. */
  return dinamis.length ? dinamis : statis;
}

/** Semua lowongan termasuk yang ditutup — dipakai Lamaran Saya supaya lamaran
 *  ke lowongan yang sudah ditutup tidak menghilang dari riwayat pelamar. */
export async function katalogLengkap() {
  const perusahaan = bacaPerusahaan();
  let dari = [];
  try {
    dari = adaSupabase ? await db.ambilPublik() : bacaLokal();
  } catch {
    dari = [];
  }
  const dinamis = dari.map((l) => keBentukPeta(l, perusahaan));
  return dinamis.length ? dinamis : statis;
}

/** Pencarian radius lewat PostGIS. Dipakai saat peta perlu jawaban dari
 *  database alih-alih menyaring seluruh katalog di HP. */
export async function lowonganDekat(lat, lng, radiusM = 5000) {
  if (!adaSupabase) return [];
  const perusahaan = bacaPerusahaan();
  return (await db.dekat(lat, lng, radiusM)).map((l) => keBentukPeta(l, perusahaan));
}
