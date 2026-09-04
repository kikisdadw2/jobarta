/* Profil pencari kerja — mengikuti artboard "Lengkapi Profil" (design-canvas/lengkapi-profil).
 *
 * Layar itu SENGAJA ringan: satu field nama, foto, dan kartu CV opsional.
 * CV yang sesungguhnya diminta belakangan — saat orang menekan "Lamar Sekarang"
 * (artboard "Lampirkan CV — just-in-time"), waktu motivasinya paling tinggi.
 *
 * Bentuk data mengikuti tabel `seeker_profiles`:
 *   namaLengkap, foto, domisili, cv { nama, ukuran, tipe, diunggahPada }
 *
 * 🔴 BERKAS CV TIDAK IKUT DISIMPAN, hanya metadata-nya. localStorage cuma ~5 MB
 *    dan batas CV saja sudah 5 MB; kalau kuota jebol SEMUA data profil ikut
 *    gagal tersimpan. Di produksi berkasnya naik ke Supabase Storage (bucket
 *    privat + signed URL) dan yang tersimpan di sini tinggal path-nya.
 */

import { supabase, adaSupabase } from "./supabase";

const KUNCI = "jobarta.profil";

export const PROFIL_KOSONG = {
  namaLengkap: "",
  foto: null, // dataURL kecil, lihat kecilkanFoto()
  domisili: "",
  cv: null,
  pengingatDitutup: false,
};

export function bacaProfil() {
  try {
    const mentah = localStorage.getItem(KUNCI);
    return mentah ? { ...PROFIL_KOSONG, ...JSON.parse(mentah) } : { ...PROFIL_KOSONG };
  } catch {
    return { ...PROFIL_KOSONG };
  }
}

export function simpanProfil(patch) {
  const baru = { ...bacaProfil(), ...patch };
  try {
    localStorage.setItem(KUNCI, JSON.stringify(baru));
  } catch {
    /* kuota penuh: profil tidak bertahan, tapi aplikasi tetap jalan */
  }
  return baru;
}

/* ---------- Profil di Supabase ---------- */
/* 🔴 localStorage di atas bukan lagi sumber kebenaran, ia CACHE.
 *
 * Selama profil hanya hidup di localStorage ia terikat satu perangkat: profil
 * yang diisi di laptop terbaca "0 dari 3 lengkap" begitu aplikasinya dibuka di
 * HP, karena penyimpanannya memang tidak pernah ikut pindah. Auth, lowongan,
 * dan lamaran sudah pindah ke Supabase lebih dulu; profil yang ketinggalan.
 *
 * Cache tetap dipakai supaya layar tidak berkedip: yang tersimpan di perangkat
 * tampil seketika, lalu ditimpa jawaban server begitu ia datang.
 */

/** Bentuk baris `profiles` → bentuk profil yang dipakai antarmuka. */
function dariBaris(baris) {
  if (!baris) return { ...PROFIL_KOSONG };
  return {
    ...PROFIL_KOSONG,
    namaLengkap: baris.full_name || "",
    foto: baris.foto_url || null,
    domisili: baris.domisili || "",
    cv: baris.cv_meta || null,
  };
}

/** Bentuk profil antarmuka → kolom `profiles`. Hanya yang disebut yang dikirim. */
function keKolom(patch) {
  const kolom = {};
  if ("namaLengkap" in patch) kolom.full_name = patch.namaLengkap;
  if ("foto" in patch) kolom.foto_url = patch.foto;
  if ("domisili" in patch) kolom.domisili = patch.domisili;
  if ("cv" in patch) kolom.cv_meta = patch.cv;
  return kolom;
}

/**
 * Ambil profil milik satu pengguna dari Supabase, lalu segarkan cache lokal.
 * @returns {Promise<object|null>} null bila tidak bisa diambil — pemanggil
 *          harus tetap memakai cache, bukan mengosongkan layar.
 */
/* Kolom `cv_meta` datang belakangan. Selama SQL-nya belum dijalankan di sebuah
 * database, Postgres menolak SELECT yang menyebutnya dengan 42703 — dan kalau
 * itu dibiarkan menggagalkan seluruh permintaan, foto dan domisili yang
 * kolomnya SUDAH ada ikut berhenti sinkron. Jadi kegagalan itu diturunkan
 * derajatnya: coba lagi tanpa kolom tersebut, catat sekali, lanjut jalan. */
const KOLOM_PENUH = "full_name, foto_url, domisili, cv_meta";
const KOLOM_LAMA = "full_name, foto_url, domisili";
let cvMetaAda = true;

function kolomHilang(error) {
  return error?.code === "42703" || error?.code === "PGRST204";
}

export async function muatProfil(id) {
  if (!adaSupabase || !id) return null;

  let { data, error } = await supabase
    .from("profiles")
    .select(cvMetaAda ? KOLOM_PENUH : KOLOM_LAMA)
    .eq("id", id)
    .maybeSingle();

  if (error && kolomHilang(error) && cvMetaAda) {
    cvMetaAda = false;
    console.warn(
      "[JOBARTA] Kolom profiles.cv_meta belum ada — jalankan supabase/schema.sql. " +
        "Foto dan domisili tetap sinkron; keterangan CV untuk sementara hanya di perangkat ini."
    );
    ({ data, error } = await supabase
      .from("profiles")
      .select(KOLOM_LAMA)
      .eq("id", id)
      .maybeSingle());
  }
  if (error || !data) return null;

  const jauh = dariBaris(data);
  /* `pengingatDitutup` sengaja TIDAK ikut ke server: "sudah kututup" adalah
     keputusan tentang layar ini, di perangkat ini. Menyeretnya ke perangkat
     lain berarti pengingat menghilang di HP karena ditutup di laptop. */
  const gabung = { ...jauh, pengingatDitutup: bacaProfil().pengingatDitutup };
  try {
    localStorage.setItem(KUNCI, JSON.stringify(gabung));
  } catch { /* kuota penuh: cache gagal, data server tetap benar */ }
  return gabung;
}

/** Kirim perubahan profil ke Supabase. Cache lokal sudah ditulis lebih dulu. */
export async function simpanProfilJauh(id, patch) {
  if (!adaSupabase || !id) return;
  const kolom = keKolom(patch);
  if (!cvMetaAda) delete kolom.cv_meta;
  if (Object.keys(kolom).length === 0) return; // cuma pengingatDitutup

  const { error } = await supabase.from("profiles").update(kolom).eq("id", id);
  if (error && kolomHilang(error) && cvMetaAda) {
    cvMetaAda = false;
    delete kolom.cv_meta;
    if (Object.keys(kolom).length) {
      await supabase.from("profiles").update(kolom).eq("id", id);
    }
  }
}

/* ---------- Berkas CV ---------- */
/* Batas dari artboard "Unggah CV": PDF, DOC, atau DOCX · maks 5 MB.
 * Ditolak di klien DAN nanti di server — validasi klien bisa dilewati. */
export const CV_MAKS_BYTE = 5 * 1024 * 1024;
export const CV_TIPE = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function formatMb(byte) {
  return `${(byte / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

/** Pesan galat menyebut SEBAB dan CARA MEMPERBAIKI — bukan "Upload gagal". */
export function periksaBerkasCv(file) {
  if (!file) return "Belum ada berkas yang dipilih.";
  if (!CV_TIPE.includes(file.type))
    return "Berkas harus PDF, DOC, atau DOCX. Coba simpan ulang CV-mu jadi PDF.";
  if (file.size > CV_MAKS_BYTE)
    return `Ukuran berkas ${formatMb(file.size)}, maksimal 5 MB. Coba kompres atau unggah versi lain.`;
  return null;
}

/** Potong nama berkas DI TENGAH supaya ekstensinya tetap kelihatan. */
export function potongNamaBerkas(nama, maks = 24) {
  if (nama.length <= maks) return nama;
  const titik = nama.lastIndexOf(".");
  const ekor = titik > -1 ? nama.slice(titik) : "";
  const kepala = nama.slice(0, maks - ekor.length - 1);
  return `${kepala}…${ekor}`;
}

/* ---------- Foto profil ---------- */
/* Foto dikecilkan ke 160px sebelum disimpan. Foto kamera HP 3–5 MB akan
 * menjebol localStorage sendirian; 160px sudah lebih dari cukup untuk
 * avatar 104px di layar 2x. */
export function kecilkanFoto(file, sisi = 160) {
  return new Promise((selesai, gagal) => {
    if (!file.type.startsWith("image/")) {
      gagal(new Error("Berkas itu bukan gambar. Pilih foto JPG atau PNG."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const potong = Math.min(img.width, img.height); // potong jadi bujur sangkar tengah
      const kanvas = document.createElement("canvas");
      kanvas.width = kanvas.height = sisi;
      const ctx = kanvas.getContext("2d");
      ctx.drawImage(
        img,
        (img.width - potong) / 2,
        (img.height - potong) / 2,
        potong,
        potong,
        0,
        0,
        sisi,
        sisi
      );
      URL.revokeObjectURL(url);
      selesai(kanvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      gagal(new Error("Foto itu tidak bisa dibaca. Coba pilih foto lain."));
    };
    img.src = url;
  });
}

/* ---------- Pengingat kelengkapan ---------- */
/* Tiga item, tidak lebih. Aturannya dari artboard "Pengingat setelah dilewati":
 * setiap item harus punya manfaat yang bisa DIJELASKAN ke pengguna. Item
 * keempat yang tidak lolos uji itu mengubah pengingat jadi pekerjaan rumah. */
export const ITEM_PENGINGAT = [
  { kunci: "foto", label: "Foto profil" },
  { kunci: "cv", label: "Berkas CV" },
  { kunci: "domisili", label: "Lokasi domisili" },
];

export function kelengkapan(profil = bacaProfil()) {
  const item = ITEM_PENGINGAT.map((i) => ({
    ...i,
    selesai: Boolean(
      i.kunci === "domisili" ? String(profil.domisili || "").trim() : profil[i.kunci]
    ),
  }));
  return { item, selesai: item.filter((i) => i.selesai).length, dari: item.length };
}

/** Sapaan judul dipotong ke dua kata pertama — nama 5 kata bikin judul 3 baris. */
export function sapaan(namaLengkap) {
  const kata = String(namaLengkap || "").trim().split(/\s+/).filter(Boolean);
  return kata.slice(0, 2).join(" ");
}
