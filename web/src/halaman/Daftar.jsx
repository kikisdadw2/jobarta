import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PanelAuth from "../komponen-ui/PanelAuth";
import { Logo, IkonGoogle, Pemisah, Peringatan } from "../komponen-ui/Dasar";
import { useAuth } from "../konteks/useAuth";
import { passwordLolos } from "../lib/password";
import DaftarSyarat from "../komponen-ui/DaftarSyarat";

/* DESIGN 2B — Daftar, jalur username + password.
 *
 * Urutan field dari yang paling murah ke paling mahal secara kognitif:
 * username -> password -> email pemulihan -> consent. */

// Username yang dianggap sudah terpakai selama backend belum ada.
const TERPAKAI = new Set(["rizky", "admin", "jobarta", "kasir"]);


export default function Daftar() {
  const [username, setUsername] = useState("");
  const [cekUsername, setCekUsername] = useState(null); // null | "cek" | "ada" | "dipakai"
  const [password, setPassword] = useState("");
  const [lihat, setLihat] = useState(false);
  const [email, setEmail] = useState("");
  const [setuju, setSetuju] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [kirim, setKirim] = useState(false);
  const [galatDaftar, setGalatDaftar] = useState("");
  const emailRef = useRef(null);
  const navigate = useNavigate();
  const { daftarPassword } = useAuth();

  // Validasi dijalankan saat field DITINGGALKAN, bukan tiap ketukan —
  // mengetik sambil terus-menerus dimarahi membuat orang berhenti.
  function cekKetersediaan() {
    const u = username.trim().toLowerCase();
    if (!u) return setCekUsername(null);
    setCekUsername("cek");
    setTimeout(() => setCekUsername(TERPAKAI.has(u) ? "dipakai" : "ada"), 500);
  }

  function lanjutkan() {
    setKirim(true);
    daftarPassword({
      username: username.trim(),
      password,
      recoveryEmail: email.trim() || null,
    })
      .then(() => navigate("/onboarding"))
      .catch((err) => {
        setGalatDaftar(err.message);
        setKirim(false);
      });
  }

  function daftar(e) {
    e.preventDefault();
    // Opsi B (dikunci 2026-09-01): mengosongkan email pemulihan memunculkan
    // dialog konfirmasi. Dialog TIDAK muncul kalau fieldnya diisi.
    if (!email.trim()) {
      setDialog(true);
      return;
    }
    lanjutkan();
  }

  const saran = [`${username}.jkt`, `${username}_g`, `${username}2026`];

  return (
    <div className="auth">
      <PanelAuth />
      <main className="auth__utama">
        <div className="auth__kotak">
          <Link to="/" className="merek">
            <Logo />
            <span className="merek__nama">JOBARTA</span>
          </Link>

          <h1 className="auth__judul">Buat akun</h1>
          <p className="auth__sub">
            Sudah punya akun? <Link to="/masuk">Masuk</Link>
          </p>

          <button type="button" className="tombol tombol--sekunder tombol--penuh">
            <IkonGoogle />
            Daftar dengan Google
          </button>

          <Pemisah />

          <form onSubmit={daftar} noValidate>
            <div className="field">
              <label htmlFor="d-username">Username</label>
              <input
                id="d-username"
                name="username"
                type="text"
                autoComplete="username"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={cekKetersediaan}
                placeholder="nama pengguna kamu…"
                className={cekUsername === "dipakai" ? "salah" : cekUsername === "ada" ? "benar" : ""}
              />
              <div aria-live="polite">
                {cekUsername === "cek" && <p className="field__bantu">Mengecek ketersediaan…</p>}
                {cekUsername === "ada" && (
                  <p className="field__bantu field__bantu--benar">✓ Username ini bisa dipakai</p>
                )}
                {cekUsername === "dipakai" && (
                  <>
                    <p className="field__bantu field__bantu--salah">
                      Username “{username}” sudah dipakai. Coba yang lain.
                    </p>
                    <ul className="saran">
                      {saran.map((s) => (
                        <li key={s}>
                          <button
                            type="button"
                            className="chip chip--tombol"
                            onClick={() => {
                              setUsername(s);
                              setCekUsername("ada");
                            }}
                          >
                            {s}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <p className="field__bantu">
                3–20 karakter: huruf, angka, titik, garis bawah. Username tidak bisa diganti
                sendiri setelah akun dibuat.
              </p>
            </div>

            <div className="field">
              <label htmlFor="d-password">Password</label>
              <div className="field__baris">
                <input
                  id="d-password"
                  name="new-password"
                  type={lihat ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="tombol tombol--sekunder"
                  onClick={() => setLihat((v) => !v)}
                  aria-pressed={lihat}
                >
                  {lihat ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
              <DaftarSyarat password={password} />
            </div>

            <div className="field">
              <label htmlFor="d-email">
                Email pemulihan <span className="field__opsional">(opsional)</span>
              </label>
              <input
                id="d-email"
                ref={emailRef}
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com…"
              />
              <p className="field__bantu">
                Dipakai kalau kamu lupa password. Tanpa ini, akunmu tidak bisa dipulihkan.
              </p>
            </div>

            <label className="consent">
              <input
                type="checkbox"
                checked={setuju}
                onChange={(e) => setSetuju(e.target.checked)}
              />
              <span>
                Saya setuju JOBARTA mengolah <strong>CV, lokasi domisili, dan email</strong> saya
                untuk mencocokkan lowongan dan meneruskan lamaran ke perusahaan.{" "}
                <a href="#kebijakan">Kebijakan Privasi</a> · <a href="#syarat">Syarat Penggunaan</a>
              </span>
            </label>

            {/* Galat pendaftaran duduk TEPAT di atas tombolnya, bukan di puncak
                halaman yang sudah tergulung keluar layar saat form ini panjang. */}
            {galatDaftar && <Peringatan>{galatDaftar}</Peringatan>}

            <button
              type="submit"
              className="tombol tombol--primary tombol--penuh tombol--besar"
              /* Gerbangnya harus menguji password, bukan cuma consent: tanpa
                 `passwordLolos` daftar syarat di atas cuma hiasan, dan password
                 yang diterima di sini akan ditolak di layar AturUlang. */
              disabled={!setuju || kirim || !passwordLolos(password)}
            >
              {kirim ? "Membuat akun…" : "Daftar"}
            </button>
            {!setuju && (
              <p className="field__bantu field__bantu--tengah">
                Tombol aktif setelah kotak persetujuan dicentang.
              </p>
            )}
          </form>
        </div>
      </main>

      {dialog && (
        <div className="lapis" role="presentation">
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-judul">
            <h2 id="dlg-judul">Lanjut tanpa email pemulihan?</h2>
            <p>
              Kalau kamu lupa password, akun ini tidak bisa dipulihkan — kami tidak punya cara
              mengenali kamu. Kamu harus daftar akun baru dari nol, termasuk mengunggah CV lagi.
            </p>
            {/* Dua tombol setara. Membuat "Ya, lanjut" redup supaya orang
                menghindarinya adalah dark pattern. */}
            <div className="dialog__aksi">
              <button
                type="button"
                className="tombol tombol--primary"
                autoFocus
                onClick={() => {
                  setDialog(false);
                  emailRef.current?.focus();
                }}
              >
                Isi email dulu
              </button>
              <button
                type="button"
                className="tombol tombol--sekunder"
                onClick={() => {
                  setDialog(false);
                  lanjutkan();
                }}
              >
                Ya, lanjut tanpa email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
