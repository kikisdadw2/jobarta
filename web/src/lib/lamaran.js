/* Lamaran yang sudah dikirim.
 *
 * BENTUK DATA (kontrak yang dipakai seluruh UI):
 *   id           string  uuid
 *   lowonganId   string  FK ke lowongan.id
 *   status       enum    terkirim | dilihat | diproses | ditolak | diterima
 *   dilamarPada  string  ISO 8601 (UTC)
 *
 * PENYIMPANAN: tabel `lamaran` di Supabase. Ini bagian yang menutup lingkaran
 * produk — selama lamaran hidup di localStorage, ia tidak pernah sampai ke
 * employer, dan dasbor perusahaan selamanya menampilkan nol pelamar.
 * localStorage tetap dipakai sebagai cadangan saat kredensial tidak ada.
 */

import { supabase, adaSupabase } from "./supabase";

const KUNCI = "jobarta.lamaran";

export const STATUS_LAMARAN = {
  terkirim: { label: "Terkirim", nada: "netral" },
  dilihat: { label: "Dilihat perusahaan", nada: "info" },
  diproses: { label: "Diproses", nada: "info" },
  ditolak: { label: "Belum cocok", nada: "error" },
  diterima: { label: "Diterima", nada: "sukses" },
};

/* --------------------------------------------------------------------------
 * Cadangan localStorage
 * ------------------------------------------------------------------------ */
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
    /* penyimpanan penuh atau diblokir: lamaran cuma tidak bertahan */
  }
  return daftar;
}

async function idPengguna() {
  const { data } = await supabase.auth.getSession();
  const id = data?.session?.user?.id;
  if (!id) throw new Error("Kamu harus masuk dulu untuk melamar.");
  return id;
}

function keAplikasi(b) {
  return {
    id: b.id,
    lowonganId: b.lowongan_id,
    status: b.status,
    dilamarPada: b.dilamar_pada,
  };
}

/* --------------------------------------------------------------------------
 * Sisi pencari kerja
 * ------------------------------------------------------------------------ */

/** Lamaran milik pengguna yang sedang masuk. */
export async function bacaLamaran() {
  if (!adaSupabase) return bacaLokal();
  const { data, error } = await supabase
    .from("lamaran")
    .select("id,lowongan_id,status,dilamar_pada")
    .eq("pelamar", await idPengguna())
    .order("dilamar_pada", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(keAplikasi);
}

export async function sudahMelamar(lowonganId) {
  return (await bacaLamaran()).some((l) => l.lowonganId === lowonganId);
}

/** Idempoten: melamar dua kali ke lowongan yang sama tidak menambah baris.
 *
 *  Keidempotenan ditegakkan DATABASE lewat `unique (pelamar, lowongan_id)`,
 *  bukan dengan memeriksa dulu di klien — dua ketukan cepat di koneksi lambat
 *  bisa lolos dari pemeriksaan semacam itu. Kode 23505 = pelanggaran unique,
 *  dan di sini artinya "sudah pernah melamar", yang bukan kegagalan. */
export async function tambahLamaran(lowonganId) {
  if (!adaSupabase) {
    const daftar = bacaLokal();
    if (daftar.some((l) => l.lowonganId === lowonganId)) return daftar;
    return tulisLokal([
      ...daftar,
      {
        id: `app-${lowonganId}`,
        lowonganId,
        status: "terkirim",
        dilamarPada: new Date().toISOString(),
      },
    ]);
  }
  const { error } = await supabase
    .from("lamaran")
    .insert({ pelamar: await idPengguna(), lowongan_id: lowonganId });
  if (error && error.code !== "23505") throw error;
  return bacaLamaran();
}

export async function batalkanLamaran(lowonganId) {
  if (!adaSupabase) {
    return tulisLokal(bacaLokal().filter((l) => l.lowonganId !== lowonganId));
  }
  const { error } = await supabase
    .from("lamaran")
    .delete()
    .eq("pelamar", await idPengguna())
    .eq("lowongan_id", lowonganId);
  if (error) throw error;
  return bacaLamaran();
}

/** Set berisi id lowongan yang sudah dilamar — dipakai peta untuk menandai
 *  kartu yang sudah dilamar tanpa memanggil server per kartu. */
export async function idLamaran() {
  try {
    return new Set((await bacaLamaran()).map((l) => l.lowonganId));
  } catch {
    return new Set(); // belum masuk: tidak ada lamaran untuk ditandai
  }
}

/* --------------------------------------------------------------------------
 * Sisi employer
 * ------------------------------------------------------------------------ */

/** Lamaran yang MASUK ke lowongan milik pengguna yang sedang masuk.
 *
 *  Nama pelamar ikut diambil dalam satu permintaan lewat relasi FK. Yang
 *  membuatnya boleh terbaca adalah policy "profil pelamar: baca oleh employer"
 *  di schema-lamaran.sql — tanpa policy itu daftar ini muncul tanpa nama. */
export async function lamaranMasuk() {
  if (!adaSupabase) return [];
  const { data, error } = await supabase
    .from("lamaran")
    .select(
      "id,lowongan_id,status,dilamar_pada," +
        "profiles!lamaran_pelamar_fkey(username,full_name,domisili)"
    )
    .order("dilamar_pada", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((b) => ({
    ...keAplikasi(b),
    pelamar: {
      username: b.profiles?.username ?? null,
      nama: b.profiles?.full_name ?? null,
      domisili: b.profiles?.domisili ?? null,
    },
  }));
}

/** Employer mengubah status satu lamaran. RLS memastikan hanya pemilik
 *  lowongan yang bisa — pelamar tidak bisa menandai dirinya "diterima". */
export async function ubahStatusLamaran(id, status) {
  const { error } = await supabase.from("lamaran").update({ status }).eq("id", id);
  if (error) throw error;
}
