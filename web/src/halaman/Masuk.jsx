import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IkonGoogle, Pemisah } from "../komponen-ui/Dasar";
import Umpan from "../komponen-ui/Umpan";
import { useGoogleAktif } from "../lib/penyedia";
import PanelAuth from "../komponen-ui/PanelAuth";
import { useAuth } from "../konteks/useAuth";

/* DESIGN 2B — Masuk, dua jalur setara.
 *
 * Google di atas karena paling sedikit friksi, TAPI form username+password
 * tetap terlihat penuh tanpa scroll. Menyembunyikannya di balik "cara lain
 * masuk" membatalkan alasan fitur ini ada. */

export default function Masuk() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lihat, setLihat] = useState(false);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState("");
  const navigate = useNavigate();
  const { masukPassword, masukGoogle: masukLewatGoogle, modeSupabase } = useAuth();
  /* Tombol Google hanya tampil bila providernya benar-benar hidup di backend.
   * Lihat alasannya di src/lib/penyedia.js. */
  const googleAktif = useGoogleAktif();

  function masuk(e) {
    e.preventDefault();
    setGalat("");

    if (!username.trim() || !password) {
      // 🔴 Satu pesan untuk dua sebab. Memisahkannya ("username tidak ditemukan")
      //    membocorkan siapa saja yang punya akun — itu enumerasi akun.
      setGalat("Username atau password salah. Cek lagi, atau atur ulang password.");
      return;
    }

    setProses(true);
    masukPassword(username.trim(), password)
      .then(() => navigate("/onboarding"))
      .catch((err) => {
        setGalat(err.message);
        setProses(false);
      });
  }

  function masukGoogle() {
    setProses(true);
    masukLewatGoogle()
      .then(() => {
        // Mode Supabase memindahkan halaman ke Google; yang sampai ke baris ini
        // cuma mode lokal. Di mode Supabase pengguna kembali lewat redirect dan
        // ditangkap `onAuthStateChange`.
        if (!modeSupabase) navigate("/onboarding");
      })
      .catch((err) => {
        setGalat(err.message);
        setProses(false);
      });
  }

  return (
    <div className="auth">
      <a className="skip-link" href="#form-masuk">
        Lompat ke form masuk
      </a>

      <PanelAuth />

      <main className="auth__utama">
        <div className="auth__kotak">
          <h1 className="auth__judul">Masuk</h1>
          <p className="auth__sub">
            Belum punya akun? <Link to="/daftar">Daftar</Link>
          </p>

          {googleAktif && (
            <>
              <button
                type="button"
                className="tombol tombol--sekunder tombol--penuh"
                onClick={masukGoogle}
                disabled={proses}
              >
                <IkonGoogle />
                Lanjutkan dengan Google
              </button>

              <Pemisah />
            </>
          )}

          {galat && <Umpan nada="gagal">{galat}</Umpan>}

          <form id="form-masuk" onSubmit={masuk} noValidate>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="nama pengguna kamu…"
                aria-invalid={galat ? "true" : undefined}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="field__baris">
                <input
                  id="password"
                  name="password"
                  type={lihat ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={galat ? "true" : undefined}
                />
                <button
                  type="button"
                  className="tombol tombol--sekunder"
                  onClick={() => setLihat((v) => !v)}
                  aria-pressed={lihat}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {lihat ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
              <p className="field__kanan">
                <Link to="/lupa-password">Lupa password?</Link>
              </p>
            </div>

            <button type="submit" className="tombol tombol--primary tombol--penuh tombol--besar" disabled={proses}>
              {proses ? "Masuk…" : "Masuk"}
            </button>
          </form>

          <p className="auth__legal">
            Dengan masuk, kamu menyetujui <a href="#syarat">Syarat Penggunaan</a> &amp;{" "}
            <a href="#kebijakan">Kebijakan Privasi</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
