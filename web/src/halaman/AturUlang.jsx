import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PanelAuth from "../komponen-ui/PanelAuth";
import { Logo } from "../komponen-ui/Dasar";
import { passwordLolos } from "../lib/password";
import Umpan from "../komponen-ui/Umpan";
import { supabase, adaSupabase } from "../lib/supabase";
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
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [ulangi, setUlangi] = useState("");
  const [lihat, setLihat] = useState(false);
  const [berhasil, setBerhasil] = useState(false);
  const [galat, setGalat] = useState("");
  const [kirim, setKirim] = useState(false);
  /* 🔴 `?keadaan=` hanya boleh menggerakkan layar yang MENOLAK.
   *
   * "kedaluwarsa" dan "terpakai" tidak memberi akses apa pun — keduanya cuma
   * menjelaskan kenapa tidak bisa lanjut, jadi query yang memicunya tidak
   * membuka celah dan artboard-nya tetap bisa didemokan serta diuji.
   *
   * "sah" TIDAK PERNAH boleh datang dari query: itu keadaan yang membuka form
   * ganti password, dan mengizinkannya lewat URL berarti siapa pun bisa
   * melewati pemeriksaan token cukup dengan mengetik alamat. Ia hanya boleh
   * lahir dari sesi yang benar-benar ada. */
  const TOLAK = ["kedaluwarsa", "terpakai"];
  const dariQuery = param.get("keadaan");
  const awal = TOLAK.includes(dariQuery) ? dariQuery : adaSupabase ? "menunggu" : "sah";
  const [keadaan, setKeadaan] = useState(awal);
  const [username, setUsername] = useState(param.get("untuk") || "");

  /* Menukar token pemulihan dari tautan email menjadi sesi sementara.
   *
   * 🔴 Tanpa langkah ini `updateUser` akan gagal: mengganti password menuntut
   *    sesi, dan orang yang lupa password justru sedang tidak punya sesi.
   *    Supabase menaruh token di FRAGMENT url (#access_token=...), dan
   *    `detectSessionInUrl` menukarnya secara asinkron — jadi halaman ini
   *    harus menunggu hasilnya sebelum memutuskan tautannya sah atau tidak. */
  useEffect(() => {
    if (!adaSupabase) return;
    // Layar penolakan dari query sudah final; tidak ada yang perlu diperiksa.
    if (TOLAK.includes(dariQuery)) return;
    let hidup = true;

    const punyaToken =
      window.location.hash.includes("access_token") ||
      window.location.hash.includes("error") ||
      param.get("code");

    const nilai = (sesi) => {
      if (!hidup) return;
      if (sesi?.user) {
        setKeadaan("sah");
        setUsername(sesi.user.user_metadata?.username || "");
      } else {
        setKeadaan("kedaluwarsa");
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) return nilai(data.session);
      /* Belum ada sesi DAN tidak ada token di URL = halaman ini dibuka
         langsung, bukan dari tautan email. Itu bukan tautan kedaluwarsa,
         tapi hasilnya sama: tidak ada yang bisa diganti. */
      if (!punyaToken) return nilai(null);
    });

    const { data: langganan } = supabase.auth.onAuthStateChange((ev, sesi) => {
      if (ev === "PASSWORD_RECOVERY" || sesi) nilai(sesi);
    });

    /* Batas tunggu: tautan rusak tidak boleh berakhir jadi layar berputar. */
    const jam = setTimeout(() => hidup && setKeadaan((k) => (k === "menunggu" ? "kedaluwarsa" : k)), 8000);

    return () => {
      hidup = false;
      clearTimeout(jam);
      langganan.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [param]);

  const cocok = password.length > 0 && password === ulangi;
  const bolehSimpan = passwordLolos(password) && cocok && !kirim;

  async function simpan(e) {
    e.preventDefault();
    if (!bolehSimpan) return;
    setGalat("");

    if (!adaSupabase) {
      // Mode lokal: tandai perangkat ini masuk, tanpa memeriksa apa pun.
      simpanSesi({ username, authMethod: "password", accountStatus: "active" });
      setBerhasil(true);
      return;
    }

    setKirim(true);
    const { error } = await supabase.auth.updateUser({ password });
    setKirim(false);

    if (error) {
      /* Pesan dipilah: sesi yang habis butuh tautan baru, sedangkan password
         yang ditolak server butuh password lain. Menyamakan keduanya membuat
         orang mengulang hal yang salah. */
      const pesan = error.message || "";
      if (/session|jwt|expired|not authenticated/i.test(pesan)) {
        setKeadaan("kedaluwarsa");
        return;
      }
      setGalat(
        /password/i.test(pesan)
          ? "Password itu ditolak server. Coba yang lebih panjang atau lebih beragam."
          : "Password belum tersimpan. Periksa koneksi lalu coba lagi."
      );
      return;
    }
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
          ) : keadaan === "menunggu" ? (
            <>
              {/* Tanpa cabang ini, form ganti password tampil SEBELUM token
                  terbukti sah — orang mengetik password baru, menekan simpan,
                  lalu baru diberi tahu tautannya kedaluwarsa. */}
              <h1 className="auth__judul">Memeriksa tautanmu…</h1>
              <p className="auth__sub">Sebentar, kami sedang memastikan tautan ini masih berlaku.</p>
              <span className="pemuat" role="status" aria-label="Sedang memeriksa" />
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
                    aria-invalid={ulangi && !cocok ? "true" : undefined}
                    aria-describedby={ulangi && !cocok ? "galat-ulangi" : undefined}
                    onChange={(e) => setUlangi(e.target.value)}
                  />
                  {ulangi && !cocok && (
                    <p id="galat-ulangi" className="field__bantu field__bantu--salah">
                      Dua password ini belum sama.
                    </p>
                  )}
                </div>

                {/* Galat duduk TEPAT di atas tombolnya: di puncak halaman ia
                    sudah tergulung keluar layar saat form ini panjang. */}
                {galat && <Umpan nada="gagal">{galat}</Umpan>}

                <button
                  type="submit"
                  className="tombol tombol--primary tombol--penuh tombol--besar"
                  disabled={!bolehSimpan}
                >
                  {kirim ? "Menyimpan…" : "Simpan password baru"}
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
