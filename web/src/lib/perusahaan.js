/* Profil perusahaan + status verifikasi legalitas.
 *
 * Kenapa terpisah dari `profil.js`: seeker dan employer memakai layar yang
 * berbeda dan tidak pernah dipakai bersamaan oleh satu akun. Menggabungkannya
 * jadi satu objek berarti setiap pembaca harus tahu peran dulu sebelum boleh
 * percaya isinya.
 *
 * BENTUK DATA = kontrak tabel `companies`. Jangan diubah tanpa mengubah ERD:
 *   nama         string
 *   bidang       enum    sama persis dengan KATEGORI lowongan
 *   alamat       string
 *   lat, lng     number  WGS84 — kelak geography(Point,4326)
 *   telepon      string
 *   status       enum    belum | diproses | terverifikasi | ditolak
 *   dokumen      { nama, ukuran, tipe, diunggahPada } | null
 *   alasanTolak  string|null
 *   diverifikasiPada string|null  ISO — tanggal INI yang ditampilkan ke seeker
 *
 * 🔴 BERKAS DOKUMEN TIDAK IKUT DISIMPAN, hanya metadata-nya — alasan yang sama
 *    dengan CV di `profil.js`: localStorage cuma ~5 MB. Di produksi berkasnya
 *    naik ke Supabase Storage (bucket PRIVAT — ini akta dan NPWP, bukan foto
 *    profil) dan yang tersimpan di sini tinggal path-nya.
 */

const KUNCI = "jobarta.perusahaan";

export const PERUSAHAAN_KOSONG = {
  nama: "",
  bidang: "",
  alamat: "",
  lat: null,
  lng: null,
  telepon: "",
  status: "belum",
  dokumen: null,
  alasanTolak: null,
  diverifikasiPada: null,
};

/* Label status ditulis dari sudut pandang perusahaan, bukan sistem.
 * "ditolak" tidak pernah muncul sebagai kata di layar — yang berguna bagi
 * pengguna adalah APA yang harus diperbaiki, dan itu ada di `alasanTolak`. */
export const STATUS_VERIFIKASI = {
  belum: {
    label: "Belum diverifikasi",
    nada: "netral",
    ringkas: "Lowongan kamu tetap tayang, tapi tanpa badge terverifikasi.",
  },
  diproses: {
    label: "Sedang diperiksa",
    nada: "info",
    ringkas: "Dokumen kamu sedang kami periksa. Biasanya selesai 1–2 hari kerja.",
  },
  terverifikasi: {
    label: "Terverifikasi",
    nada: "sukses",
    ringkas: "Semua lowongan kamu sekarang membawa badge terverifikasi.",
  },
  ditolak: {
    label: "Perlu diperbaiki",
    nada: "error",
    ringkas: "Ada yang perlu diperbaiki sebelum kami bisa memverifikasi.",
  },
};

export function bacaPerusahaan() {
  try {
    const mentah = localStorage.getItem(KUNCI);
    return mentah
      ? { ...PERUSAHAAN_KOSONG, ...JSON.parse(mentah) }
      : { ...PERUSAHAAN_KOSONG };
  } catch {
    return { ...PERUSAHAAN_KOSONG };
  }
}

export function simpanPerusahaan(patch) {
  const baru = { ...bacaPerusahaan(), ...patch };
  try {
    localStorage.setItem(KUNCI, JSON.stringify(baru));
  } catch {
    /* kuota penuh: profil perusahaan tidak bertahan, aplikasi tetap jalan */
  }
  return baru;
}

export function terverifikasi() {
  return bacaPerusahaan().status === "terverifikasi";
}

/* ---------- Dokumen legalitas ---------- */
/* Batasnya lebih longgar dari CV (10 MB): hasil pindaian akta notaris beberapa
 * halaman rutin lebih besar dari 5 MB, dan menyuruh pemilik warung mengompres
 * PDF adalah cara tercepat kehilangan dia. */
export const DOK_MAKS_BYTE = 10 * 1024 * 1024;
export const DOK_TIPE = ["application/pdf", "image/jpeg", "image/png"];

export function periksaBerkasDokumen(file) {
  if (!file) return "Belum ada berkas yang dipilih.";
  if (!DOK_TIPE.includes(file.type))
    return "Berkas harus PDF, JPG, atau PNG. Foto dokumen dari HP juga boleh.";
  if (file.size > DOK_MAKS_BYTE)
    return `Ukuran berkas ${(file.size / 1024 / 1024).toFixed(1).replace(".", ",")} MB, maksimal 10 MB.`;
  return null;
}

/* Verifikasi disimulasikan: di produksi admin yang memutuskan, lewat tabel
 * `verification_requests`. Yang dijaga di sini cuma bentuk keadaannya supaya
 * layar tidak perlu diubah saat admin sungguhan masuk. */
export function ajukanVerifikasi(dokumen) {
  return simpanPerusahaan({ status: "diproses", dokumen, alasanTolak: null });
}

/** Dipakai tombol demo di dasbor supaya juri bisa melihat kedua keadaan. */
export function setujuiVerifikasi() {
  return simpanPerusahaan({
    status: "terverifikasi",
    alasanTolak: null,
    diverifikasiPada: new Date().toISOString().slice(0, 10),
  });
}

export function lengkapProfilPerusahaan(p = bacaPerusahaan()) {
  return Boolean(p.nama?.trim() && p.bidang && p.alamat?.trim() && p.lat != null);
}
