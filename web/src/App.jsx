import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PenyediaAuth } from "./konteks/Auth";
import RuteTerlindungi from "./komponen-ui/RuteTerlindungi";
import Landing from "./halaman/Landing";
import Masuk from "./halaman/Masuk";
import Callback from "./halaman/Callback";
import TidakDitemukan from "./halaman/TidakDitemukan";
import BatasGalat from "./komponen-ui/BatasGalat";
import useJudul from "./lib/useJudul";
import Daftar from "./halaman/Daftar";
import Onboarding from "./halaman/Onboarding";
import Peta from "./halaman/Peta";
import Profil from "./halaman/Profil";
import LamaranSaya from "./halaman/LamaranSaya";
import Tersimpan from "./halaman/Tersimpan";
import KebijakanPrivasi from "./halaman/KebijakanPrivasi";
import SyaratPenggunaan from "./halaman/SyaratPenggunaan";
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
/* Hook judul butuh konteks Router, jadi ia dibungkus komponen sendiri di
 * dalam <BrowserRouter> — memanggilnya langsung di App() akan melempar
 * "useLocation() may be used only in the context of a <Router>". */
function JudulRute() {
  useJudul();
  return null;
}

export default function App() {
  return (
    <BatasGalat>
      <PenyediaAuth>
      <BrowserRouter>
      <JudulRute />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/masuk" element={<Masuk />} />
        {/* Pendaratan dari Google. Menunggu sesi benar-benar jadi sebelum
            meneruskan — lihat alasannya di halaman/Callback.jsx. */}
        <Route path="/auth/callback" element={<Callback />} />
        <Route path="/daftar" element={<Daftar />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/peta" element={<Peta />} />
        <Route path="/kebijakan-privasi" element={<KebijakanPrivasi />} />
        <Route path="/syarat-penggunaan" element={<SyaratPenggunaan />} />
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
          path="/tersimpan"
          element={
            <RuteTerlindungi>
              <Tersimpan />
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

        {/* 404 sungguhan, bukan pengalihan diam-diam ke beranda: orang yang
            salah ketik satu huruf berhak tahu tautannya gagal, bukan mengira
            berhasil lalu bingung isinya bukan yang dicari. */}
        <Route path="*" element={<TidakDitemukan />} />
      </Routes>
      </BrowserRouter>
      </PenyediaAuth>
    </BatasGalat>
  );
}
