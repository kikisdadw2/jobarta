import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PenyediaAuth } from "./konteks/Auth";
import RuteTerlindungi from "./komponen-ui/RuteTerlindungi";
import Landing from "./halaman/Landing";
import Masuk from "./halaman/Masuk";
import Daftar from "./halaman/Daftar";
import Onboarding from "./halaman/Onboarding";
import Peta from "./halaman/Peta";
import Profil from "./halaman/Profil";
import LamaranSaya from "./halaman/LamaranSaya";
import LupaPassword from "./halaman/LupaPassword";
import AturUlang from "./halaman/AturUlang";
import VerifikasiEmail from "./halaman/VerifikasiEmail";
import Perusahaan from "./halaman/Perusahaan";
import PasangLowongan from "./halaman/PasangLowongan";
import VerifikasiUsaha from "./halaman/VerifikasiUsaha";
import "./App.css";
import "./halaman.css";
import "./landing.css";
import "./lengkapi.css";
import "./perusahaan.css";

/* Rute JOBARTA. URL mencerminkan state supaya hasil pencarian bisa
 * dibagikan dan di-bookmark — /peta?cari=kasir, /peta?kategori=Ritel.
 *
 * Tiga lapis akses, sengaja tidak seragam:
 *   TERBUKA      — landing, auth, dan /peta. Peta dibiarkan terbuka karena ia
 *                  momen "aha" produk ini: memaksa login sebelum orang melihat
 *                  ada lowongan dekat rumahnya adalah cara tercepat kehilangan
 *                  dia. Yang dijaga adalah AKSI (melamar), bukan melihat.
 *   PERLU MASUK  — /profil, /lamaran.
 *   PERLU PERAN  — /perusahaan/*, cuma untuk role "employer".
 */
export default function App() {
  return (
    <PenyediaAuth>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/masuk" element={<Masuk />} />
        <Route path="/daftar" element={<Daftar />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/peta" element={<Peta />} />
        <Route path="/lupa-password" element={<LupaPassword />} />
        <Route path="/atur-ulang" element={<AturUlang />} />
        <Route path="/verifikasi-email" element={<VerifikasiEmail />} />

        <Route
          path="/profil"
          element={
            <RuteTerlindungi>
              <Profil />
            </RuteTerlindungi>
          }
        />
        <Route
          path="/lamaran"
          element={
            <RuteTerlindungi>
              <LamaranSaya />
            </RuteTerlindungi>
          }
        />

        <Route
          path="/perusahaan"
          element={
            <RuteTerlindungi peran="employer">
              <Perusahaan />
            </RuteTerlindungi>
          }
        />
        <Route
          path="/perusahaan/pasang"
          element={
            <RuteTerlindungi peran="employer">
              <PasangLowongan />
            </RuteTerlindungi>
          }
        />
        {/* Ubah memakai komponen yang sama: form tambah dan form ubah yang
            terpisah akan menyimpang isinya begitu satu field ditambahkan. */}
        <Route
          path="/perusahaan/pasang/:id"
          element={
            <RuteTerlindungi peran="employer">
              <PasangLowongan />
            </RuteTerlindungi>
          }
        />
        <Route
          path="/perusahaan/verifikasi"
          element={
            <RuteTerlindungi peran="employer">
              <VerifikasiUsaha />
            </RuteTerlindungi>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </BrowserRouter>
    </PenyediaAuth>
  );
}
