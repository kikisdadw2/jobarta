import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PanelAuth from "../komponen-ui/PanelAuth";
import { Logo } from "../komponen-ui/Dasar";
import { simpanSesi } from "../lib/sesi";
import { useAuth } from "../konteks/useAuth";

/* "Verifikasi email pemulihan" — artboard 2b-auth/VerifikasiEmail.
 *
 * Layar ini HANYA muncul kalau email pemulihan diisi, dan WAJIB bisa dilewati.
 * Memblokir di sini berarti kehilangan pengguna yang sinyalnya sedang jelek —
 * konsekuensinya pengingat non-blocking di dalam aplikasi, bukan pintu
 * terkunci.
 *
 * Alamatnya ditampilkan PENUH supaya salah ketik ketahuan sekarang, bukan tiga
 * hari kemudian saat orang lupa password.
 */

const JEDA_KIRIM_ULANG = 60;

export default function VerifikasiEmail() {
  const [param] = useSearchParams();
  const keadaan = param.get("keadaan") || "menunggu"; // menunggu | berhasil | kedaluwarsa | bantuan
  const navigate = useNavigate();
  const { sesi } = useAuth();
  const alamat = param.get("email") || sesi.recoveryEmail || "email kamu";
  const [detik, setDetik] = useState(JEDA_KIRIM_ULANG);

  useEffect(() => {
    if (detik <= 0) return;
    const t = setTimeout(() => setDetik((d) => d - 1), 1000);
    return () => clearTimeout(t);
  }, [detik]);

  const gantiAlamat = (
    <Link to="/profil" className="tombol tombol--sekunder tombol--penuh">
      Ganti alamat email
    </Link>
  );

  return (
    <div className="auth">
      <PanelAuth />
      <main className="auth__utama">
        <div className="auth__kotak">
          <Link to="/" className="merek">
            <Logo />
            <span className="merek__nama">JOBARTA</span>
          </Link>

          {keadaan === "berhasil" && (
            <>
              {/* Hijau dipakai konsisten dengan badge Terverifikasi — pengguna
                  belajar SATU makna warna, bukan dua. */}
              <span className="lencana-sukses" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <h1 className="auth__judul">Email kamu sudah terverifikasi</h1>
              <p className="auth__sub">
                Sekarang akunmu bisa dipulihkan kalau suatu saat kamu lupa password.
              </p>
              <button
                type="button"
                className="tombol tombol--primary tombol--penuh tombol--besar"
                onClick={() => {
                  simpanSesi({ emailTerverifikasi: true });
                  navigate("/peta");
                }}
              >
                Lanjut ke JOBARTA
              </button>
            </>
          )}

          {keadaan === "kedaluwarsa" && (
            <>
              <h1 className="auth__judul">Tautannya sudah kedaluwarsa</h1>
              <p className="auth__sub">
                Tautan verifikasi berlaku 24 jam. Kami bisa kirim yang baru ke{" "}
                <strong>{alamat}</strong>.
              </p>
              {/* Bukan jalan buntu: layar gagal selalu membawa tombol pemulih. */}
              <div className="auth__tombol">
                <button
                  type="button"
                  className="tombol tombol--primary tombol--penuh tombol--besar"
                  onClick={() => setDetik(JEDA_KIRIM_ULANG)}
                >
                  Kirim tautan baru
                </button>
                {gantiAlamat}
              </div>
            </>
          )}

          {keadaan === "bantuan" && (
            <>
              <h1 className="auth__judul">Emailnya belum sampai?</h1>
              <p className="auth__sub">Coba tiga hal ini dulu:</p>
              <ol className="daftar-langkah">
                <li>
                  Cek folder <strong>Spam</strong> atau <strong>Promosi</strong>.
                </li>
                <li>
                  Pastikan alamatnya benar: <strong>{alamat}</strong>.
                </li>
                <li>Tunggu 2 menit — kadang emailnya telat masuk.</li>
              </ol>
              <div className="auth__tombol">
                <button
                  type="button"
                  className="tombol tombol--primary tombol--penuh tombol--besar"
                  onClick={() => setDetik(JEDA_KIRIM_ULANG)}
                >
                  Kirim ulang sekarang
                </button>
                {gantiAlamat}
              </div>
            </>
          )}

          {keadaan === "menunggu" && (
            <>
              <h1 className="auth__judul">Cek email kamu</h1>
              <p className="auth__sub">
                Kami kirim tautan verifikasi ke <strong>{alamat}</strong>
              </p>

              <div className="auth__tombol">
                {/* Hitung mundur sebagai teks tombol, bukan ikon berputar:
                    "Kirim ulang dalam 47 detik" menjawab pertanyaannya sendiri. */}
                <button
                  type="button"
                  className="tombol tombol--sekunder tombol--penuh"
                  disabled={detik > 0}
                  onClick={() => setDetik(JEDA_KIRIM_ULANG)}
                >
                  {detik > 0 ? `Kirim ulang dalam ${detik} detik` : "Kirim ulang sekarang"}
                </button>
                {gantiAlamat}
              </div>

              {/* Wajib bisa dilewati. */}
              <button
                type="button"
                className="tombol-nanti"
                onClick={() => navigate("/peta")}
              >
                Lanjut dulu, verifikasi nanti
              </button>

              <p className="bantu bantu--tengah">
                <Link to="/verifikasi-email?keadaan=bantuan">Emailnya belum sampai?</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
