import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo, Progres, Terverifikasi } from "../komponen-ui/Dasar";
import { bacaSesi, simpanSesi } from "../lib/sesi";
import { useAuth } from "../konteks/useAuth";
import Umpan from "../komponen-ui/Umpan";

/* DESIGN 3 (revisi 2026-09-01) — onboarding setelah akun terbentuk,
 * apa pun jalur masuknya.
 *
 * Dua cabang yang membedakannya dari versi lama:
 *   1. Jalur Google membawa nama & email; jalur password tidak membawa apa pun.
 *   2. Jalur password sudah menyetujui PDP saat daftar (consent_point =
 *      form_daftar), jadi di sini cukup RINGKASAN, bukan pertanyaan ulang.
 */

export default function Onboarding() {
  const { perbaruiProfil } = useAuth();
  const sesi = bacaSesi();
  const lewatGoogle = sesi.authMethod === "google";

  const [langkah, setLangkah] = useState(1);
  const [peran, setPeran] = useState(sesi.role);
  const [nama, setNama] = useState(sesi.fullName || "");
  const [emailPemulihan, setEmailPemulihan] = useState(sesi.recoveryEmail || "");
  const [setuju, setSetuju] = useState(false);
  const [tolak, setTolak] = useState(false);
  // Menonaktifkan akun bukan aksi yang boleh terjadi dalam satu ketukan tanpa
  // tanya — artboard 3-onboarding/Menolak menaruh layar konfirmasi di sini.
  const [konfirmasiTolak, setKonfirmasiTolak] = useState(false);
  const [dihapus, setDihapus] = useState(false);
  const navigate = useNavigate();
  const [param] = useSearchParams();

  if (!sesi.username) {
    return (
      <div className="auth auth--tunggal">
        <main className="auth__utama">
          <div className="auth__kotak kosong">
            <h1>Kamu belum masuk</h1>
            <p>Onboarding dimulai setelah akun kamu dibuat.</p>
            <Link to="/masuk" className="tombol tombol--primary">
              Ke halaman Masuk
            </Link>
          </div>
        </main>
      </div>
    );
  }

  function selesaikan() {
    const patch = {
      role: peran,
      fullName: nama.trim() || null,
      recoveryEmail: emailPemulihan.trim() || null,
      accountStatus: "active",
    };
    simpanSesi(patch);
    /* Peran HARUS ikut naik ke tabel `profiles`, bukan cuma ke localStorage:
     * penjaga rute /perusahaan membacanya lewat useAuth, dan di mode Supabase
     * useAuth mengambilnya dari profiles. Tanpa baris ini employer berhasil
     * onboarding lalu ditolak dari dasbornya sendiri. Kegagalan simpan tidak
     * memblokir layar sukses — sesi lokal sudah benar dan pemuatan berikutnya
     * akan menyusul. */
    Promise.resolve(perbaruiProfil(patch)).catch(() => {});
    setLangkah(4);
  }

  function tolakConsent() {
    setKonfirmasiTolak(true);
  }

  function jadiMenolak() {
    simpanSesi({ accountStatus: "deactivated" });
    setKonfirmasiTolak(false);
    setTolak(true);
  }

  /* ---- cabang menolak: akun TIDAK dibatalkan, tapi dinonaktifkan ---- */
  if (konfirmasiTolak) {
    return (
      <div className="auth auth--tunggal">
        <main className="auth__utama">
          <div className="auth__kotak">
            <h1 className="auth__judul">Tanpa persetujuan, JOBARTA tidak bisa dipakai</h1>
            <p>
              Kami butuh izin menyimpan CV dan lokasi kamu untuk bisa menunjukkan lowongan
              terdekat dan mengirim lamaran. Tanpa itu, tidak ada yang bisa kami lakukan.
            </p>
            <p>Akunmu akan dinonaktifkan, dan kamu bisa minta datanya dihapus.</p>
            <div className="tumpuk">
              <button
                type="button"
                className="tombol tombol--primary tombol--penuh tombol--besar"
                onClick={() => setKonfirmasiTolak(false)}
              >
                Kembali &amp; baca lagi
              </button>
              {/* Bertepi NETRAL, bukan merah. Menolak adalah hak pengguna menurut
                  UU PDP — mewarnainya merah membingkainya sebagai kesalahan. */}
              <button
                type="button"
                className="tombol tombol--sekunder tombol--penuh"
                onClick={jadiMenolak}
              >
                Ya, saya tidak setuju
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (tolak) {
    const tenggat = new Date(Date.now() + 30 * 864e5).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return (
      <div className="auth auth--tunggal">
        <main className="auth__utama">
          <div className="auth__kotak">
            {dihapus ? (
              <>
                <div className="lingkaran lingkaran--sukses" aria-hidden="true">
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h1 className="auth__judul">Permintaan hapus data kami terima</h1>
                <p>
                  Data kamu dihapus paling lambat <strong>{tenggat}</strong> — 30 hari sejak
                  hari ini, sesuai UU PDP No. 27/2022. Kamu akan dapat konfirmasi kalau sudah
                  selesai.
                </p>
                <Link to="/" className="tombol tombol--sekunder tombol--penuh">
                  Kembali ke beranda
                </Link>
              </>
            ) : (
              <>
                <div className="lingkaran lingkaran--tunggu" aria-hidden="true">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8.5 12h7" />
                  </svg>
                </div>
                <h1 className="auth__judul">Akun kamu dinonaktifkan</h1>
                <p>
                  Akunmu tetap ada tapi tidak bisa dipakai. Kami tidak mengolah datamu untuk apa
                  pun selama statusnya begini.
                </p>
                {/* Dua tombol setara — menyulitkan penghapusan data melanggar UU PDP. */}
                <div className="tumpuk">
                  <button
                    type="button"
                    className="tombol tombol--primary tombol--penuh"
                    onClick={() => {
                      simpanSesi({ accountStatus: "pending_consent" });
                      setTolak(false);
                    }}
                  >
                    Berubah pikiran — aktifkan akun
                  </button>
                  <button
                    type="button"
                    className="tombol tombol--bahaya tombol--penuh"
                    onClick={() => setDihapus(true)}
                  >
                    Hapus data saya
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="auth auth--tunggal">
      <main className="auth__utama">
        <div className="auth__kotak">
          <Link to="/" className="merek">
            <Logo />
            <span className="merek__nama">JOBARTA</span>
          </Link>

          {/* Sapaan sekali jalan sesudah pendaftaran. Ditaruh di sini, bukan di
              Daftar.jsx: layar itu langsung ditinggalkan, jadi pesannya tidak
              akan sempat terbaca. Hilang sendiri — kabar baik yang sudah
              dibaca tidak perlu menetap. */}
          {param.get("baru") === "1" && langkah === 1 && (
            <Umpan nada="berhasil" judul="Akun kamu sudah jadi" hilangSetelah={8000}>
              Tinggal tiga langkah singkat sebelum kamu bisa melamar.
            </Umpan>
          )}

          {langkah <= 3 && (
            <Progres
              langkah={langkah}
              dari={3}
              judul={["Pilih peran", "Lengkapi data", "Persetujuan data"][langkah - 1]}
            />
          )}

          {/* ---------- 1 · PILIH PERAN ---------- */}
          {langkah === 1 && (
            <>
              <h1 className="auth__judul">Kamu ke sini untuk apa?</h1>
              <p className="auth__sub">Pilih salah satu. Nanti bisa diubah lewat halaman profil.</p>

              <div className="peran">
                <button
                  type="button"
                  className={`peran__kartu${peran === "seeker" ? " peran__kartu--pilih" : ""}`}
                  aria-pressed={peran === "seeker"}
                  onClick={() => setPeran("seeker")}
                >
                  <span className="peran__ikon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.6-3.6" />
                    </svg>
                  </span>
                  <span>
                    <strong>Saya Cari Kerja</strong>
                    <span className="peran__ket">Lihat lowongan di peta, lamar yang dekat rumah kamu.</span>
                    <span className="badge badge--terverifikasi">Gratis selamanya</span>
                  </span>
                </button>

                <button
                  type="button"
                  className={`peran__kartu${peran === "employer" ? " peran__kartu--pilih" : ""}`}
                  aria-pressed={peran === "employer"}
                  onClick={() => setPeran("employer")}
                >
                  <span className="peran__ikon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 21h18M5 21V6l7-3 7 3v15M9.5 11H11M13 11h1.5M9.5 15H11M13 15h1.5" />
                    </svg>
                  </span>
                  <span>
                    <strong>Saya Pasang Lowongan</strong>
                    <span className="peran__ket">Cari pelamar di sekitar lokasi usaha kamu.</span>
                    <span className="badge badge--menunggu">Perlu verifikasi dokumen usaha</span>
                  </span>
                </button>
              </div>

              <button
                type="button"
                className="tombol tombol--primary tombol--penuh tombol--besar"
                disabled={!peran}
                onClick={() => setLangkah(2)}
              >
                Lanjut
              </button>
            </>
          )}

          {/* ---------- 2 · LENGKAPI DATA (dua varian) ---------- */}
          {langkah === 2 && (
            <>
              <h1 className="auth__judul">{lewatGoogle ? "Betulkan data kamu" : "Kenalkan diri kamu"}</h1>
              <p className="auth__sub">
                {lewatGoogle
                  ? "Kami ambil dari akun Google kamu. Ubah kalau ada yang kurang pas."
                  : "Perusahaan melihat nama, bukan username. Foto boleh dilewati."}
              </p>

              <div className="field">
                <label htmlFor="o-nama">Nama lengkap</label>
                <input
                  id="o-nama"
                  type="text"
                  autoComplete="name"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama sesuai KTP atau ijazah…"
                />
                <p className="field__bantu">
                  Nama ini yang dilihat perusahaan saat kamu melamar.
                  {!lewatGoogle && (
                    <> Username <strong>{sesi.username}</strong> tidak ditampilkan ke perusahaan.</>
                  )}
                </p>
              </div>

              {lewatGoogle ? (
                <div className="field">
                  <label htmlFor="o-email">Email</label>
                  <input id="o-email" type="email" value={sesi.recoveryEmail || ""} readOnly className="terkunci" />
                  <p className="field__bantu">
                    Tidak bisa diubah di sini karena email inilah yang dipakai untuk masuk lewat
                    Google. Kalau mau ganti, ganti dulu di akun Google kamu.
                  </p>
                </div>
              ) : (
                <div className="kotak-ajakan">
                  <h2>Tambah email pemulihan?</h2>
                  <p>
                    Akun kamu sekarang belum punya email pemulihan, jadi tidak bisa dibuka lagi
                    kalau lupa password.
                  </p>
                  <div className="field">
                    <label htmlFor="o-recovery" className="sr-only">
                      Email pemulihan
                    </label>
                    <input
                      id="o-recovery"
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      value={emailPemulihan}
                      onChange={(e) => setEmailPemulihan(e.target.value)}
                      placeholder="nama@email.com…"
                    />
                  </div>
                  <p className="field__bantu">
                    Boleh dilewati. Kamu bisa menambahkannya kapan saja lewat halaman profil.
                  </p>
                </div>
              )}

              <div className="tumpuk">
                <button
                  type="button"
                  className="tombol tombol--primary tombol--penuh tombol--besar"
                  onClick={() => setLangkah(3)}
                >
                  Lanjut
                </button>
                <button type="button" className="tombol tombol--sekunder tombol--penuh" onClick={() => setLangkah(1)}>
                  Kembali
                </button>
              </div>
            </>
          )}

          {/* ---------- 3 · CONSENT PDP (dua varian) ---------- */}
          {langkah === 3 && (
            <>
              {lewatGoogle ? (
                <>
                  <h1 className="auth__judul">Data apa yang kami simpan</h1>
                  <p className="auth__sub">
                    Baca dulu sebelum menyetujui. Ini kewajiban kami menurut UU PDP No. 27/2022.
                  </p>
                  <DaftarData />
                  <label className="consent">
                    <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} />
                    <span>
                      Saya sudah membaca dan setuju JOBARTA mengolah data di atas untuk keperluan
                      yang disebutkan. <Link to="/kebijakan-privasi">Kebijakan Privasi</Link> ·{" "}
                      <Link to="/syarat-penggunaan">Syarat Penggunaan</Link>
                    </span>
                  </label>
                  <button
                    type="button"
                    className="tombol tombol--primary tombol--penuh tombol--besar"
                    disabled={!setuju}
                    onClick={selesaikan}
                  >
                    Setuju &amp; mulai pakai JOBARTA
                  </button>
                </>
              ) : (
                <>
                  <p className="catatan catatan--sukses">
                    Kamu sudah menyetujui ini waktu mendaftar. Layar ini cuma mengulang isinya
                    supaya kamu tahu persis apa yang disetujui.
                  </p>
                  <h1 className="auth__judul">Yang kamu setujui</h1>
                  <DaftarData />
                  {/* Tanpa checkbox kedua: mencentang dua kali untuk persetujuan
                      yang sama membuat orang berhenti membaca. */}
                  <button
                    type="button"
                    className="tombol tombol--primary tombol--penuh tombol--besar"
                    onClick={selesaikan}
                  >
                    Ya, lanjutkan
                  </button>
                </>
              )}

              <p className="auth__tengah">
                <button type="button" className="tautan" onClick={tolakConsent}>
                  Saya tidak setuju
                </button>
              </p>
              <p className="field__bantu field__bantu--tengah">
                Kamu bisa mencabut persetujuan ini kapan saja lewat halaman profil.
              </p>
            </>
          )}

          {/* ---------- 4 · SUKSES, bercabang per peran ---------- */}
          {langkah === 4 && (
            <>
              <div className={peran === "seeker" ? "lingkaran lingkaran--sukses" : "lingkaran lingkaran--tunggu"} aria-hidden="true">
                {peran === "seeker" ? (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8ZM14 3v5h5M9 13h6M9 17h4" />
                  </svg>
                )}
              </div>

              {peran === "seeker" ? (
                <>
                  <h1 className="auth__judul">Akun kamu siap{nama ? `, ${nama.split(" ")[0]}` : ""}</h1>
                  <p className="auth__sub">
                    Kamu sudah bisa lihat lowongan di peta sekarang. Tapi ada satu langkah lagi
                    supaya bisa melamar: unggah CV dan atur lokasi domisili.
                  </p>
                  <div className="tumpuk">
                    <button type="button" className="tombol tombol--primary tombol--penuh tombol--besar" onClick={() => navigate("/profil")}>
                      Lengkapi profil sekarang
                    </button>
                    <button type="button" className="tombol tombol--sekunder tombol--penuh" onClick={() => navigate("/peta")}>
                      Lihat peta dulu
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="auth__judul">Akun perusahaan kamu dibuat</h1>
                  <p className="auth__sub">
                    Kamu sudah bisa memasang lowongan sekarang. Verifikasi dokumen usaha
                    membuatnya membawa badge terverifikasi &mdash; dan itulah yang membuat
                    pencari kerja berani melamar.
                  </p>
                  <p className="catatan catatan--sukses">
                    <Terverifikasi /> Verifikasi inilah yang membuat pencari kerja percaya pada
                    lowongan kamu.
                  </p>
                  <div className="tumpuk">
                    <button type="button" className="tombol tombol--primary tombol--penuh tombol--besar" onClick={() => navigate("/perusahaan/verifikasi")}>
                      Mulai verifikasi perusahaan
                    </button>
                    <button type="button" className="tombol tombol--sekunder tombol--penuh" onClick={() => navigate("/perusahaan")}>
                      Nanti saja
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function DaftarData() {
  const data = [
    ["CV kamu", "Diteruskan ke perusahaan hanya saat kamu menekan “Lamar Sekarang”. Tidak pernah dijual atau dibagikan ke pihak lain."],
    ["Lokasi domisili", "Dipakai untuk mengurutkan lowongan dari yang terdekat. Perusahaan hanya melihat kecamatan, bukan alamat lengkap."],
    ["Email", "Untuk memberi tahu kalau lamaran kamu dibaca atau dibalas. Tidak dipakai untuk iklan."],
  ];
  return (
    <dl className="data-pdp">
      {data.map(([judul, isi]) => (
        <div key={judul}>
          <dt>{judul}</dt>
          <dd>{isi}</dd>
        </div>
      ))}
    </dl>
  );
}
