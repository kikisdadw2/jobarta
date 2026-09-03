import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../konteks/useAuth";

/* Penjaga rute.
 *
 * 🔴 `memuat` harus dihormati, bukan dilewati. Di mode Supabase, membaca sesi
 *    butuh perjalanan ke jaringan; kalau penjaga ini memutuskan sebelum
 *    jawabannya datang, pengguna yang SUDAH login akan dilempar ke layar Masuk
 *    setiap kali me-refresh halaman. Itu bug yang paling sering lolos ke
 *    produksi di aplikasi ber-auth, karena di mesin pengembang jaringannya
 *    terlalu cepat untuk memperlihatkannya.
 *
 * `peran` opsional. Kalau diisi, rute cuma boleh dibuka pemilik peran itu —
 * seeker yang mengetik /perusahaan di URL tidak boleh mendarat di dasbor
 * perusahaan kosong dan mengira produknya rusak.
 */
export default function RuteTerlindungi({ peran, children }) {
  const { sudahMasuk, memuat, sesi } = useAuth();
  const lokasi = useLocation();

  if (memuat) {
    return (
      <div className="halaman memuat" role="status" aria-live="polite">
        <p>Memuat&hellip;</p>
      </div>
    );
  }

  if (!sudahMasuk) {
    /* Tujuan asal dibawa serta supaya sesudah masuk orang kembali ke tempat
       yang tadi ia tuju, bukan ke beranda. */
    const tujuan = `${lokasi.pathname}${lokasi.search}`;
    const ke = peran === "employer" ? "/masuk?peran=employer&lanjut=" : "/masuk?lanjut=";
    return <Navigate to={`${ke}${encodeURIComponent(tujuan)}`} replace />;
  }

  /* Peran belum dipilih = onboarding belum selesai. Ini bukan penolakan;
     orangnya cuma belum sampai. */
  if (peran && !sesi.role) return <Navigate to="/onboarding" replace />;

  if (peran && sesi.role !== peran) {
    return <Navigate to={sesi.role === "employer" ? "/perusahaan" : "/peta"} replace />;
  }

  return children;
}
