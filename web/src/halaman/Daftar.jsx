import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PanelAuth from "../komponen-ui/PanelAuth";
import { Logo, IkonGoogle, Pemisah } from "../komponen-ui/Dasar";
import Umpan from "../komponen-ui/Umpan";
import { useGoogleAktif } from "../lib/penyedia";
import { useAuth } from "../konteks/useAuth";
import { passwordLolos } from "../lib/password";
import { galatFormat, formatLolos, cekTersedia } from "../lib/username";
import DaftarSyarat from "../komponen-ui/DaftarSyarat";

/* DESIGN 2B — Daftar, jalur username + password.
 *
 * Urutan field dari yang paling murah ke paling mahal secara kognitif:
 * username -> password -> email pemulihan -> consent. */


export default function Daftar() {
  const [username, setUsername] = useState("");
  // null | "cek" | "ada" | "dipakai" | "format"
  const [cekUsername, setCekUsername] = useState(null);
  const [pesanFormat, setPesanFormat] = useState("");
  const [password, setPassword] = useState("");
  const [lihat, setLihat] = useState(false);
  const [email, setEmail] = useState("");
  const [setuju, setSetuju] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [kirim, setKirim] = useState(false);
  const [galatDaftar, setGalatDaftar] = useState("");
  const emailRef = useRef(null);
  const navigate = useNavigate();
  const { daftarPassword, masukGoogle, modeSupabase } = useAuth();
  const googleAktif = useGoogleAktif();
  const [proses, setProses] = useState(false);

  function daftarGoogle() {
    setProses(true);
    masukGoogle()
      .then(() => {
        // Mode Supabase memindahkan halaman ke Google; yang sampai ke baris
        // ini cuma mode lokal.
        if (!modeSupabase) navigate("/onboarding");
      })
      .catch(() => setProses(false));
  }

  // Validasi dijalankan saat field DITINGGALKAN, bukan tiap ketukan —
  // mengetik sambil terus-menerus dimarahi membuat orang berhenti.
  async function cekKetersediaan() {
    const u = username.trim().toLowerCase();
    if (!u) {
      setPesanFormat("");
      return setCekUsername(null);
    }

    /* Format diperiksa DULU, di perangkat. Menanyakan ketersediaan
     * "Budi Santoso" ke server tidak ada gunanya: username itu tidak akan
     * pernah bisa dipakai apa pun jawabannya. */
    const galat = galatFormat(u);
    if (galat) {
      setPesanFormat(galat);
      return setCekUsername("format");
    }
    setPesanFormat("");

    setCekUsername("cek");
    // RPC `username_tersedia` — lihat supabase/schema.sql bagian 4.
    const bebas = await cekTersedia(u);
    /* null = tidak bisa memastikan (mode lokal atau jaringan gagal). Jangan
     * mengarang jawaban; diamkan saja dan biarkan pendaftaran yang memutuskan. */
    if (bebas === null) return setCekUsername(null);
    setCekUsername(bebas ? "ada" : "dipakai");
  }

  function lanjutkan() {
    setKirim(true);
    daftarPassword({
      username: username.trim(),
      password,
      recoveryEmail: email.trim() || null,
    })
      .then(() => navigate("/onboarding?baru=1"))
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

  const dasar = username.trim().toLowerCase();
  const saran = [`${dasar}.jkt`, `${dasar}_g`, `${dasar}2026`];

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

          {/* Tombol Google hanya tampil bila providernya hidup di backend —
              lihat src/lib/penyedia.js. Sebelumnya tombol ini bahkan tidak
              punya onClick sama sekali, jadi mengkliknya diam saja. */}
          {googleAktif && (
            <>
              <button
                type="button"
                className="tombol tombol--sekunder tombol--penuh"
                onClick={daftarGoogle}
                disabled={proses}
              >
                <IkonGoogle />
                Daftar dengan Google
              </button>

              <Pemisah />
            </>
          )}

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
                aria-invalid={cekUsername === "dipakai" || cekUsername === "format" ? "true" : undefined}
                /* Menautkan pesan ke inputnya: tanpa ini pembaca layar
                   membacakan field tanpa menyebut apa yang salah dengannya,
                   dan orang mendengar "Username, kotak isian" lalu diam. */
                aria-describedby={
                  cekUsername === "format" ? "galat-username" : cekUsername === "dipakai" ? "dipakai-username" : undefined
                }
                className={
                  cekUsername === "dipakai" || cekUsername === "format"
                    ? "salah"
                    : cekUsername === "ada"
                      ? "benar"
                      : ""
                }
              />
              <div aria-live="polite">
                {cekUsername === "format" && (
                  <p id="galat-username" className="field__bantu field__bantu--salah">{pesanFormat}</p>
                )}
                {cekUsername === "cek" && <p className="field__bantu">Mengecek ketersediaan…</p>}
                {cekUsername === "ada" && (
                  <p className="field__bantu field__bantu--benar">✓ Username ini bisa dipakai</p>
                )}
                {cekUsername === "dipakai" && (
                  <>
                    <p id="dipakai-username" className="field__bantu field__bantu--salah">
                      Username “{username}” sudah dipakai. Coba yang lain.
                    </p>
                    <ul className="saran">
                      {saran.map((s) => (
                        <li key={s}>
                          <button
                            type="button"
                            className="chip chip--tombol"
                            /* Saran tidak boleh langsung ditandai "ada": ia
                               cuma tebakan, dan `.jkt` bisa saja sudah dipakai
                               orang lain juga. Tanyakan ulang ke backend. */
                            onClick={async () => {
                              setUsername(s);
                              setCekUsername("cek");
                              const bebas = await cekTersedia(s);
                              if (bebas === null) return setCekUsername(null);
                              setCekUsername(bebas ? "ada" : "dipakai");
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
            {galatDaftar && <Umpan nada="gagal">{galatDaftar}</Umpan>}

            <button
              type="submit"
              className="tombol tombol--primary tombol--penuh tombol--besar"
              /* Gerbangnya harus menguji password, bukan cuma consent: tanpa
                 `passwordLolos` daftar syarat di atas cuma hiasan, dan password
                 yang diterima di sini akan ditolak di layar AturUlang. */
              disabled={
                !setuju || kirim || !passwordLolos(password) || !formatLolos(username)
              }
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
