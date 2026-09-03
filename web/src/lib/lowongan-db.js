/* Akses tabel `public.lowongan` di Supabase.
 *
 * Berkas ini HANYA menerjemahkan antara bentuk baris database (snake_case,
 * `geog` tersembunyi) dan kontrak bentuk data aplikasi (camelCase, lihat
 * `src/data/lowongan.js`). Tidak ada aturan bisnis di sini — itu milik
 * `lowonganku.js`, supaya satu-satunya tempat yang tahu soal Supabase adalah
 * berkas ini.
 */

import { supabase } from "./supabase";

/* Kolom yang diambil disebut SATU PER SATU, bukan `select("*")`. `geog` adalah
 * blob biner PostGIS yang tidak pernah dipakai klien; menariknya di setiap
 * permintaan memboroskan kuota data pengguna di jaringan seluler. */
const KOLOM =
  "id,pemilik,posisi,perusahaan,kategori,tipe,gaji_min,gaji_max,lat,lng," +
  "alamat,deskripsi,syarat,terverifikasi,diverifikasi_pada,aktif,dibuat_pada";

export function keAplikasi(b) {
  return {
    id: b.id,
    pemilik: b.pemilik,
    posisi: b.posisi,
    perusahaan: b.perusahaan,
    kategori: b.kategori,
    tipe: b.tipe,
    gajiMin: b.gaji_min,
    gajiMax: b.gaji_max,
    lat: b.lat,
    lng: b.lng,
    alamat: b.alamat,
    deskripsi: b.deskripsi ?? "",
    syarat: b.syarat ?? [],
    terverifikasi: b.terverifikasi ?? false,
    diverifikasiPada: b.diverifikasi_pada ?? undefined,
    aktif: b.aktif ?? true,
    dibuatPada: b.dibuat_pada,
  };
}

function keBaris(l) {
  const baris = {
    posisi: l.posisi,
    perusahaan: l.perusahaan,
    kategori: l.kategori,
    tipe: l.tipe,
    gaji_min: l.gajiMin ?? null,
    gaji_max: l.gajiMax ?? null,
    lat: l.lat,
    lng: l.lng,
    alamat: l.alamat,
    deskripsi: l.deskripsi ?? "",
    syarat: l.syarat ?? [],
  };
  if ("aktif" in l) baris.aktif = l.aktif;
  // Kolom yang TIDAK pernah dikirim klien: pemilik (diisi dari sesi),
  // terverifikasi & diverifikasi_pada (hak admin), geog (dihitung database).
  Object.keys(baris).forEach((k) => baris[k] === undefined && delete baris[k]);
  return baris;
}

/** Lowongan aktif milik siapa pun — isi peta. */
export async function ambilPublik() {
  const { data, error } = await supabase
    .from("lowongan")
    .select(KOLOM)
    .eq("aktif", true)
    .order("dibuat_pada", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(keAplikasi);
}

/** Lowongan milik satu employer, TERMASUK yang sudah ditutup (untuk dasbor). */
export async function ambilMilik(pemilik) {
  const { data, error } = await supabase
    .from("lowongan")
    .select(KOLOM)
    .eq("pemilik", pemilik)
    .order("dibuat_pada", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(keAplikasi);
}

export async function ambilSatu(id) {
  const { data, error } = await supabase
    .from("lowongan").select(KOLOM).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? keAplikasi(data) : null;
}

export async function sisipkan(isi, pemilik) {
  const { data, error } = await supabase
    .from("lowongan")
    .insert({ ...keBaris(isi), pemilik })
    .select(KOLOM)
    .single();
  if (error) throw error;
  return keAplikasi(data);
}

export async function perbarui(id, patch) {
  const { data, error } = await supabase
    .from("lowongan").update(keBaris(patch)).eq("id", id).select(KOLOM).single();
  if (error) throw error;
  return keAplikasi(data);
}

export async function hapus(id) {
  const { error } = await supabase.from("lowongan").delete().eq("id", id);
  if (error) throw error;
}

/** Pencarian radius lewat PostGIS — ST_DWithin berjalan di database. */
export async function dekat(lat, lng, radiusM = 5000) {
  const { data, error } = await supabase.rpc("lowongan_dekat", {
    p_lat: lat, p_lng: lng, p_radius_m: radiusM,
  });
  if (error) throw error;
  return (data ?? []).map((b) => ({ ...keAplikasi(b), jarakM: b.jarak_m }));
}
