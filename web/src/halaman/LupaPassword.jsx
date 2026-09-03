import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PanelAuth from "../komponen-ui/PanelAuth";
import { Logo, IkonGoogle } from "../komponen-ui/Dasar";

/* "Lupa password" — artboard 2b-auth/LupaPassword.
 *
 * Dua keputusan yang mengikat layar ini:
 *
 * 1. Fieldnya EMAIL PEMULIHAN, bukan username. Username tidak bisa dikirimi
 *    apa pun.
 * 2. Responsnya SERAGAM, apa pun kenyataannya. Kalau layar ini menjawab "email
 *    tidak ditemukan", siapa pun bisa menguji ribuan alamat untuk memetakan
 *    siapa saja yang punya akun di JOBARTA. Kalimat "kalau alamat itu
 *    terdaftar" memang sedikit kikuk — di layar ini keamanan menang atas
 *    kelancaran kalimat.
 *
 * Jalan buntu (akun tanpa email pemulihan) digambar sejak layar pertama,
 * bukan disembunyikan sampai orang menunggu email yang tidak akan datang.
 */

const JEDA_KIRIM_ULANG = 60;

/* Layar "alamat ini milik akun Google" TIDAK BOLEH dipicu oleh isi form.
 *
 * Sebelumnya layar itu muncul begitu orang mengetik alamat tertentu — dan itu
 * membatalkan janji respons seragam di atas: satu form yang menjawab dua hal
 * berbeda adalah oracle. Siapa pun bisa menguji alamat satu per satu dan tahu
 * mana yang punya akun, lengkap dengan metode masuknya.
 *
 * Artboard tetap menghendaki layar ini ada, jadi ia tidak dibuang — cuma
 * dipindah ke SESUDAH orang membuka tautan dari email, tempat pengirimnya
 * sudah terbukti memegang kotak masuk tersebut. Di prototipe ini jalur itu
 * diwakili `?keadaan=google`, pola yang sama dengan AturUlang dan
 * VerifikasiEmail. Begitu Supabase Auth masuk, tautannyalah yang membawa
 * penanda ini, bukan tebakan klien. */

export default function LupaPassword() {
  const [param] = useSearchParams();
  const [email, setEmail] = useState("");
  // form | terkirim | buntu | google — "google" hanya bisa datang dari tautan email.
  const [layar, setLayar] = useState(param.get("keadaan") === "google" ? "google" : "form");
  const [detik, setDetik] = useState(0);

  useEffect(() => {
    if (detik <= 0) return;
    const t = setTimeout(() => setDetik((d) => d - 1), 1000);
    return () => clearTimeout(t);
  }, [detik]);

  function kirim(e) {
    e.preventDefault();
    // Seragam untuk SEMUA alamat: terdaftar, tidak terdaftar, atau milik akun
    // Google — ketiganya melihat layar yang sama persis.
    setLayar("terkirim");
    setDetik(JEDA_KIRIM_ULANG);
  }

  return (
    <div className="auth">
      <PanelAuth />
      <main className="auth__utama">
        <div className="auth__kotak">
          <Link to="/masuk" className="tautan-kembali">
            ← Kembali ke Masuk
          </Link>

          <Link to="/" className="merek">
            <Logo />
            <span className="merek__nama">JOBARTA</span>
          </Link>

          {layar === "form" && (
            <>
              <h1 className="auth__judul">Atur ulang password</h1>
              <p className="auth__sub">
                Masukkan email pemulihan yang kamu daftarkan. Kami kirim tautan untuk
                membuat password baru.
              </p>

              <form onSubmit={kirim} noValidate>
                <div className="field">
                  <label htmlFor="lp-email">Email pemulihan</label>
                  <input
                    id="lp-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="tombol tombol--primary tombol--penuh tombol--besar"
                  disabled={!email.trim()}
                >
                  Kirim tautan atur ulang
                </button>
              </form>

              <div className="kotak-info">
                <p className="kotak-info__judul">Tidak punya email pemulihan?</p>
                <p className="bantu">
                  Kalau dulu kamu daftar tanpa mengisi email, akun itu tidak bisa kami
                  pulihkan — tidak ada cara memastikan kamu pemiliknya.
                </p>
                <button
                  type="button"
                  className="tautan-aksi"
                  onClick={() => setLayar("buntu")}
                >
                  Lihat pilihan yang tersisa
                </button>
              </div>
            </>
          )}

          {layar === "terkirim" && (
            <>
              <h1 className="auth__judul">Cek email kamu</h1>
              {/* Kalimat seragam: sama persis entah alamatnya terdaftar atau tidak. */}
              <p className="auth__sub">
                Kalau alamat itu terdaftar, kami sudah kirim tautan atur ulang.
                Tautannya berlaku 1 jam.
              </p>

              {/* Hitung mundur ditulis sebagai teks tombol, bukan ikon berputar —
                  ia menjawab pertanyaannya sendiri. */}
              <button
                type="button"
                className="tombol tombol--sekunder tombol--penuh"
                disabled={detik > 0}
                onClick={() => setDetik(JEDA_KIRIM_ULANG)}
              >
                {detik > 0 ? `Kirim ulang dalam ${detik} detik` : "Kirim ulang sekarang"}
              </button>

              <p className="bantu bantu--tengah">
                <Link to="/masuk">Kembali ke Masuk</Link>
              </p>
            </>
          )}

          {layar === "buntu" && (
            <>
              <h1 className="auth__judul">
                Akun tanpa email pemulihan tidak bisa dibuka lagi
              </h1>
              <p className="auth__sub">
                Waktu daftar, akun ini dibuat tanpa email pemulihan. Artinya kami tidak
                punya cara memastikan kamu pemiliknya, jadi passwordnya tidak bisa
                diganti.
              </p>
              <p className="auth__sub">
                Ini memang keras, dan itu disengaja: kalau kami bisa membukanya untuk
                kamu, orang lain juga bisa.
              </p>

              {/* Dua tombol nyata, bukan permintaan maaf. */}
              <p className="kotak-info__judul">Yang bisa kamu lakukan:</p>
              <div className="auth__tombol">
                <Link to="/daftar" className="tombol tombol--primary tombol--penuh tombol--besar">
                  Daftar akun baru
                </Link>
                <a
                  className="tombol tombol--sekunder tombol--penuh"
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noreferrer"
                >
                  Hubungi dukungan lewat WhatsApp
                </a>
              </div>

              <p className="bantu">
                Lamaran yang sudah dikirim dari akun lama tetap diproses perusahaan.
                Kalau kamu daftar akun baru, unggah CV-nya lagi.
              </p>
            </>
          )}

          {layar === "google" && (
            <>
              <h1 className="auth__judul">Alamat ini dipakai untuk masuk dengan Google</h1>
              <p className="auth__sub">
                Akun dengan alamat <strong>{email}</strong> masuk lewat Google, jadi
                tidak punya password untuk diatur ulang. Coba tombol di bawah.
              </p>

              <Link
                to="/onboarding"
                className="tombol tombol--sekunder tombol--penuh tombol--besar tombol--google"
              >
                <IkonGoogle />
                Masuk dengan Google
              </Link>

              <div className="kotak-info">
                <p className="kotak-info__judul">Punya dua akun dengan email yang sama?</p>
                {/* Nada menjelaskan, bukan menuduh: pengguna tidak salah apa-apa —
                    dua jalur masuk memang bisa memakai alamat yang sama. */}
                <p className="bantu">
                  Itu tetap dua akun terpisah, dan kami tidak menggabungkannya. Kalau
                  digabung otomatis, orang lain bisa mengambil alih akunmu cukup dengan
                  mendaftar Google memakai alamat yang sama.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
