import { useEffect } from "react";
import { useLocation, matchPath } from "react-router-dom";

/* Judul & deskripsi per rute.
 *
 * 🔴 Satu registry, bukan `document.title` bertebaran di 15 halaman. Judul
 *    adalah hal yang paling mudah menyimpang diam-diam: satu halaman baru
 *    ditambahkan, penulisnya lupa memasang judul, dan tab-nya mewarisi judul
 *    halaman sebelumnya tanpa ada yang sadar. Di sini kelalaian itu terlihat
 *    sebagai baris yang hilang dari tabel.
 *
 * 🔴 Meta Open Graph TIDAK disuntikkan di sini, dan itu disengaja. JOBARTA
 *    adalah SPA Vite tanpa prerender — scraper WhatsApp, Twitter, dan
 *    LinkedIn membaca HTML mentah dan tidak menjalankan JavaScript, jadi tag
 *    OG yang ditulis dari React tidak akan pernah mereka lihat. Menulisnya di
 *    sini cuma akan menciptakan ilusi bahwa preview tautan sudah beres.
 *    OG statis untuk seluruh situs ada di `index.html`, dan itu batasnya.
 *
 * Yang dinamis di sini tetap berguna: tab peramban, riwayat, bookmark, dan
 * Googlebot (yang memang menjalankan JavaScript).
 */

const SITUS = "JOBARTA";

/* Deskripsi ditulis per rute, berbahasa Indonesia, dan menyebut Jakarta —
   Googlebot memakainya sebagai cuplikan hasil pencarian. */
export const META_RUTE = [
  ["/", "Cari kerja di sekitarmu, lewat peta", "Cari lowongan kerja di Jakarta lewat peta interaktif. Lihat lowongan yang benar-benar dekat rumahmu, lengkap dengan jarak dan gaji.", true],
  ["/masuk", "Masuk", "Masuk ke akun JOBARTA untuk melamar lowongan di Jakarta dan memantau status lamaranmu."],
  ["/daftar", "Daftar", "Buat akun JOBARTA gratis. Cukup username dan password — cari lowongan di Jakarta yang dekat dari rumahmu."],
  ["/auth/callback", "Menyelesaikan masuk", "Sedang menyelesaikan proses masuk ke JOBARTA."],
  ["/onboarding", "Lengkapi akun", "Tiga langkah singkat sebelum kamu bisa melamar lowongan di JOBARTA."],
  ["/peta", "Peta lowongan", "Peta lowongan kerja Jakarta. Saring menurut kategori, tipe kerja, dan gaji, lalu lihat mana yang paling dekat dari lokasimu."],
  ["/profil", "Profil", "Lengkapi profil dan CV kamu. Perusahaan lebih sering membalas pelamar yang profilnya lengkap."],
  ["/lamaran", "Lamaran Saya", "Riwayat lamaran kamu di JOBARTA beserta status balasannya."],
  ["/tersimpan", "Lowongan Tersimpan", "Lowongan di Jakarta yang kamu simpan untuk dilamar nanti."],
  ["/lupa-password", "Lupa password", "Atur ulang password akun JOBARTA kamu lewat email pemulihan."],
  ["/atur-ulang", "Atur ulang password", "Buat password baru untuk akun JOBARTA kamu."],
  ["/verifikasi-email", "Verifikasi email", "Verifikasi alamat email pemulihan akun JOBARTA kamu."],
  ["/perusahaan", "Dasbor perusahaan", "Kelola lowongan yang kamu pasang di JOBARTA dan lihat siapa saja yang melamar."],
  ["/perusahaan/pasang", "Pasang lowongan", "Pasang lowongan kerja di Jakarta dan tampilkan langsung di peta JOBARTA."],
  ["/perusahaan/pasang/:id", "Ubah lowongan", "Ubah detail lowongan yang sudah kamu pasang di JOBARTA."],
  ["/perusahaan/verifikasi", "Verifikasi usaha", "Verifikasi usahamu supaya lowonganmu bertanda terverifikasi dan lebih dipercaya pelamar."],
];

const CADANGAN = ["Halaman tidak ditemukan", "Halaman yang kamu cari tidak ada di JOBARTA."];

/** Cari entri yang cocok untuk sebuah pathname. */
export function metaUntuk(pathname) {
  for (const [pola, judul, deskripsi, akar] of META_RUTE) {
    /* `end: true` supaya "/" tidak menelan semua rute lain — matchPath
       memperlakukan "/" sebagai awalan kalau tidak dikunci. */
    if (matchPath({ path: pola, end: true }, pathname)) {
      return { judul, deskripsi, akar: Boolean(akar) };
    }
  }
  return { judul: CADANGAN[0], deskripsi: CADANGAN[1], akar: false };
}

/** Beranda memakai tagline sebagai judul; sisanya "Halaman · JOBARTA". */
export function rakitJudul({ judul, akar }) {
  return akar ? `${SITUS} — ${judul}` : `${judul} · ${SITUS}`;
}

/** Pasang di dalam Router sekali saja. Tidak merender apa pun. */
export default function useJudul() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = metaUntuk(pathname);
    document.title = rakitJudul(meta);

    /* Deskripsi diperbarui, bukan ditambah — kalau tagnya digandakan tiap
       navigasi, Googlebot membaca yang pertama dan halaman kedua dan
       seterusnya mewarisi deskripsi beranda selamanya. */
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "description");
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", meta.deskripsi);
  }, [pathname]);
}
