import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PanelAuth from "../komponen-ui/PanelAuth";
import { Logo } from "../komponen-ui/Dasar";
import { passwordLolos } from "../lib/password";
import DaftarSyarat from "../komponen-ui/DaftarSyarat";
import { simpanSesi } from "../lib/sesi";

/* "Atur ulang password" — artboard 2b-auth/AturUlang.
 *
 * Keputusan yang mengikat layar ini:
 * - Syarat password diambil dari SATU SUMBER yang sama dengan layar Daftar
 *   (lib/password.js). Aturan yang berubah bunyi di layar berbeda membuat
 *   orang mengira dirinya yang salah.
 * - Pencabutan sesi diberitahukan SEBELUM tombol ditekan, bukan sesudahnya —
 *   supaya tidak terasa seperti kejutan.
 * - Berhasil = langsung masuk. Menyuruh orang mengetik password yang baru saja
 *   dibuat adalah pengulangan tanpa guna.
 * - Setiap layar gagal membawa tombol yang memulihkan keadaan; tidak ada yang
 *   berakhir buntu.
 *
 * Keadaan tautan datang dari query `?keadaan=` selama backend belum ada:
 * nanti ia berasal dari hasil verifikasi token di server.
 */
export default function AturUlang() {
  const [param] = useSearchParams();
  const keadaan = param.get("keadaan") || "sah"; // sah | kedaluwarsa | terpakai
  const username = param.get("untuk") || "rizkyghazirah";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [ulangi, setUlangi] = useState("");
  const [lihat, setLihat] = useState(false);
  const [berhasil, setBerhasil] = useState(false);

  const cocok = password.length > 0 && password === ulangi;
  const bolehSimpan = passwordLolos(password) && cocok;

  function simpan(e) {
    e.preventDefault();
    if (!bolehSimpan) return;
    // Password TIDAK PERNAH disimpan di klien — lihat catatan di lib/sesi.js.
    // Yang ditandai di sini cuma "perangkat ini sekarang masuk".
    simpanSesi({ username, authMethod: "password", accountStatus: "active" });
    setBerhasil(true);
  }

  return (
    <div className="auth">
      <PanelAuth />
      <main className="auth__utama">
        <div className="auth__kotak">
          <Link to="/" className="merek">
            <Logo />
            <span className="merek__nama">JOBARTA</span>
          </Link>

          {berhasil ? (
            <>
              <h1 className="auth__judul">Password kamu sudah diganti</h1>
              <p className="auth__sub">
                Kamu sudah masuk. Perangkat lain yang tadinya masih masuk sudah
                dikeluarkan.
              </p>
              {/* Tidak dilempar balik ke layar Masuk. */}
              <button
                type="button"
                className="tombol tombol--primary tombol--penuh tombol--besar"
                onClick={() => navigate("/peta")}
              >
                Lanjut cari lowongan
              </button>
            </>
          ) : keadaan === "kedaluwarsa" ? (
            <>
              <h1 className="auth__judul">Tautannya sudah lewat 1 jam</h1>
              {/* Alasan singkat mencegah ini terasa seperti aplikasi yang rusak. */}
              <p className="auth__sub">
                Demi keamanan, tautan atur ulang cuma berlaku sebentar. Kami bisa kirim
                yang baru.
              </p>
              <div className="auth__tombol">
                <Link
                  to="/lupa-password"
                  className="tombol tombol--primary tombol--penuh tombol--besar"
                >
                  Kirim tautan baru
                </Link>
                <Link to="/masuk" className="tombol tombol--sekunder tombol--penuh">
                  Kembali ke Masuk
                </Link>
              </div>
            </>
          ) : keadaan === "terpakai" ? (
            <>
              <h1 className="auth__judul">Tautan ini sudah dipakai</h1>
              <p className="auth__sub">
                Password kamu sudah diganti lewat tautan ini. Kalau bukan kamu yang
                melakukannya, segera hubungi kami.
              </p>
              <div className="auth__tombol">
                <Link
                  to="/masuk"
                  className="tombol tombol--primary tombol--penuh tombol--besar"
                >
                  Masuk dengan password baru
                </Link>
                {/* Merah dipakai di sini karena ini benar-benar laporan bahaya. */}
                <a
                  className="tombol tombol--bahaya tombol--penuh"
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noreferrer"
                >
                  Bukan saya — laporkan
                </a>
              </div>
            </>
          ) : (
            <>
              <h1 className="auth__judul">Buat password baru</h1>
              <p className="auth__sub">
                Untuk akun <strong>{username}</strong>.
              </p>

              <form onSubmit={simpan} noValidate>
                <div className="field">
                  <label htmlFor="au-password">Password baru</label>
                  <div className="field__baris">
                    <input
                      id="au-password"
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
                  <label htmlFor="au-ulangi">Ulangi password baru</label>
                  <input
                    id="au-ulangi"
                    type={lihat ? "text" : "password"}
                    autoComplete="new-password"
                    value={ulangi}
                    onChange={(e) => setUlangi(e.target.value)}
                  />
                  {ulangi && !cocok && (
                    <p className="field__bantu field__bantu--salah">
                      Dua password ini belum sama.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="tombol tombol--primary tombol--penuh tombol--besar"
                  disabled={!bolehSimpan}
                >
                  Simpan password baru
                </button>
              </form>

              {/* Diberitahukan SEBELUM tombol ditekan, bukan sesudahnya. */}
              <p className="bantu">
                Setelah password diganti, kamu akan keluar otomatis dari semua perangkat
                lain yang masih masuk ke akun ini.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
