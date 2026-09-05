import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../konteks/useAuth";
import { sapaan } from "../lib/profil";

/* Sudut kanan setiap header: tamu melihat tombol masuk, yang sudah masuk
 * melihat dirinya sendiri.
 *
 * 🔴 SATU komponen untuk semua header. Sebelumnya Landing, NavAkun, dan
 *    NavPerusahaan masing-masing menulis logikanya sendiri — Landing bahkan
 *    tidak pernah membaca sesi sama sekali, jadi orang yang sudah masuk tetap
 *    disodori tombol "Masuk" di beranda. Menu yang ditulis tiga kali akan
 *    menyimpang tiga arah.
 *
 * 🔴 Keadaan `memuat` bukan hiasan. Di mode Supabase, membaca sesi butuh
 *    perjalanan ke jaringan. Merender menu TAMU selama penantian itu membuat
 *    tombol "Masuk" berkedip sepersekian detik di layar orang yang sebenarnya
 *    sudah login — dan kedipan itu terbaca sebagai "aku ter-logout", bukan
 *    sebagai loading. Jadi selama memuat yang tampil adalah kerangka, bukan
 *    tebakan.
 */

/** Inisial untuk avatar saat pengguna belum memasang foto. */
function inisial(nama, username) {
  const sumber = String(nama || username || "").trim();
  if (!sumber) return "?";
  const kata = sumber.split(/\s+/).filter(Boolean);
  const huruf = kata.length > 1 ? kata[0][0] + kata[1][0] : sumber.slice(0, 2);
  return huruf.toUpperCase();
}

export default function MenuAkun({ ke = "/masuk", peran = "seeker" }) {
  const { sesi, memuat, sudahMasuk, keluar } = useAuth();
  const [buka, setBuka] = useState(false);
  const bungkus = useRef(null);
  const navigate = useNavigate();
  const idMenu = useId();

  /* Tutup saat menekan di luar atau menekan Escape. Menu yang hanya bisa
     ditutup lewat tombolnya sendiri terasa macet, terutama di layar sentuh. */
  useEffect(() => {
    if (!buka) return;
    const diLuar = (e) => {
      if (!bungkus.current?.contains(e.target)) setBuka(false);
    };
    const esc = (e) => e.key === "Escape" && setBuka(false);
    document.addEventListener("pointerdown", diLuar);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", diLuar);
      document.removeEventListener("keydown", esc);
    };
  }, [buka]);

  if (memuat) {
    return (
      <span className="akun-kerangka" role="status" aria-label="Memuat status akun">
        <span className="akun-kerangka__bulat" />
        <span className="akun-kerangka__garis" />
      </span>
    );
  }

  if (!sudahMasuk) {
    return (
      <span className="akun-tamu">
        <Link to={ke} className="tombol tombol--sekunder navbar__masuk">
          Masuk
        </Link>
        {peran === "seeker" && (
          /* 🔴 Sekunder, bukan primer. Di landing 1440px tombol ini bertarung
             dengan "Cari di Peta" di hero — dua CTA primer di satu layar, dan
             yang kalah justru yang lebih penting. App.jsx menyatakan peta
             adalah momen "aha" produk ini dan sengaja TIDAK dikunci di balik
             login; menyorot "Daftar" lebih terang melawan keputusan itu.
             Tombolnya tetap ada, tetap 44px, cuma tidak lagi berteriak. */
          <Link to="/daftar" className="tombol tombol--sekunder">
            Daftar
          </Link>
        )}
      </span>
    );
  }

  const nama = sapaan(sesi.fullName) || sesi.username || "Akun";

  async function keluarSekarang() {
    setBuka(false);
    await keluar();
    /* navigate, bukan window.location.assign: memuat ulang seluruh dokumen
       membuang state React tanpa alasan dan terasa seperti aplikasi tersentak.
       Keadaan sesi sudah dibersihkan oleh keluar(). */
    navigate("/", { replace: true });
  }

  return (
    <span className="akun" ref={bungkus}>
      <button
        type="button"
        className="akun__pemicu"
        aria-expanded={buka}
        aria-haspopup="menu"
        aria-controls={idMenu}
        onClick={() => setBuka((v) => !v)}
      >
        {sesi.foto ? (
          <img className="akun__foto" src={sesi.foto} alt="" width="32" height="32" />
        ) : (
          <span className="akun__inisial" aria-hidden="true">
            {inisial(sesi.fullName, sesi.username)}
          </span>
        )}
        <span className="akun__nama">{nama}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={buka ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
        </svg>
      </button>

      {buka && (
        <div className="akun__menu" id={idMenu} role="menu">
          <Link to="/profil" role="menuitem" onClick={() => setBuka(false)}>
            Profil
          </Link>
          <Link to="/lamaran" role="menuitem" onClick={() => setBuka(false)}>
            Lamaran Saya
          </Link>
          {sesi.role === "employer" && (
            <Link to="/perusahaan" role="menuitem" onClick={() => setBuka(false)}>
              Dasbor perusahaan
            </Link>
          )}
          <button type="button" role="menuitem" className="akun__keluar" onClick={keluarSekarang}>
            Keluar
          </button>
        </div>
      )}
    </span>
  );
}
