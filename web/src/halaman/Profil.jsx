import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import UnggahCv from "../components/UnggahCv";
import { kecilkanFoto, sapaan } from "../lib/profil";
import { useProfil } from "../lib/useProfil";
import { useAuth } from "../konteks/useAuth";

/* "Lengkapi Profil" — artboard design-canvas/lengkapi-profil.
 *
 * Layar OPSIONAL. Momen "aha" seeker bukan "punya CV", melainkan melihat
 * lowongan nyata di dekat rumahnya — jadi layar ini tidak boleh terasa seperti
 * tembok. Konsekuensi yang dijaga di sini:
 *   - tidak ada indikator "langkah 3 dari 3"
 *   - field nama TIDAK ter-autofocus (papan ketik tidak menutup layar)
 *   - "Nanti saja" kontras penuh, bukan abu samar
 *   - 375px bertumpuk, 1440px dua kolom (kiri kenapa, kanan tempat mengerjakan)
 */
export default function Profil() {
  const navigate = useNavigate();
  /* Sesi dibaca dari konteks Auth, bukan localStorage: di mode Supabase
     `bacaSesi()` selalu kosong, jadi sapaan namanya ikut kosong. */
  const { sesi } = useAuth();
  const [profil, perbaruiProfil] = useProfil();
  const [galatFoto, setGalatFoto] = useState(null);
  const fotoRef = useRef(null);

  /* Draf terpisah dari profil tersimpan. Kalau setiap ketukan langsung dikirim
     ke Supabase, mengetik nama jadi belasan permintaan jaringan — dan di 4G
     yang tersendat urutan datangnya tidak dijamin. Simpan sekali, saat selesai. */
  const [draf, setDraf] = useState(profil);
  const disentuh = useRef(false);

  /* Profil dari server datang belakangan. Ia boleh menimpa draf HANYA selama
     pengguna belum mengetik apa pun; kalau tidak, jawaban server yang telat
     akan menghapus yang sedang diketik orang. */
  useEffect(() => {
    if (!disentuh.current) setDraf(profil);
  }, [profil]);

  const nama = sapaan(draf.namaLengkap || sesi.fullName);

  function ubah(patch) {
    disentuh.current = true;
    setDraf((p) => ({ ...p, ...patch }));
  }

  async function pilihFoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      ubah({ foto: await kecilkanFoto(file) });
      setGalatFoto(null);
    } catch (err) {
      setGalatFoto(err.message);
    }
  }

  function simpan(e) {
    e.preventDefault();
    perbaruiProfil(draf);
    /* Penanda sukses ikut di URL, bukan di state — halaman ini langsung
       ditinggalkan, jadi state apa pun di sini mati sebelum sempat terbaca.
       Pola yang sama dipakai PasangLowongan -> /perusahaan?baru=1. */
    navigate("/peta?profil=1");
  }

  function nantiSaja() {
    // Yang sudah diisi tetap disimpan — "Nanti saja" bukan "Batal".
    perbaruiProfil(draf);
    navigate("/peta");
  }

  return (
    <div className="halaman lengkapi">
      <div className="lengkapi__bar">
        <button
          type="button"
          className="tombol-ikon"
          aria-label="Kembali"
          onClick={() => navigate(-1)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>
        <span className="lengkapi__merek">JOBARTA</span>
      </div>

      <form className="lengkapi__wadah" onSubmit={simpan} noValidate>
        {/* Kolom kiri: kenapa layar ini ada. */}
        <div className="lengkapi__kiri">
          <h1 className="lengkapi__judul">
            Sedikit lagi{nama ? `, ${nama}` : ""}
          </h1>
          <p className="lengkapi__sub">
            Perusahaan lebih sering membalas pelamar yang profilnya lengkap. Kamu bisa
            melewati langkah ini dan melengkapinya kapan saja.
          </p>

          <div className="foto">
            {/* Ruang 104×104 dipesan sebelum gambar termuat — tidak ada pergeseran layout. */}
            <div className="foto__bingkai">
              {draf.foto ? (
                <img src={draf.foto} alt="Foto profil kamu" />
              ) : (
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8.5" r="3.6" />
                  <path d="M4.5 20c0-3.6 3.4-5.6 7.5-5.6s7.5 2 7.5 5.6" />
                </svg>
              )}
            </div>
            <div className="foto__kanan">
              <button
                type="button"
                className="tombol-hantu"
                onClick={() => fotoRef.current?.click()}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
                  <circle cx="12" cy="13" r="3.4" />
                </svg>
                Ganti foto
              </button>
              <p className="bantu">Foto membuat lamaranmu lebih mudah dikenali.</p>
              {galatFoto && (
                <p className="bantu bantu--galat" role="status">
                  {galatFoto}
                </p>
              )}
            </div>
            <input
              ref={fotoRef}
              type="file"
              className="sr-only"
              accept="image/*"
              onChange={pilihFoto}
            />
          </div>
        </div>

        {/* Kolom kanan: tempat mengerjakannya. */}
        <div className="lengkapi__kanan">
          <div className="field">
            <label htmlFor="nama">Nama lengkap</label>
            <input
              id="nama"
              type="text"
              value={draf.namaLengkap}
              onChange={(e) => ubah({ namaLengkap: e.target.value })}
              autoComplete="name"
            />
            <p className="bantu">Pakai nama seperti di lamaran kerja.</p>
          </div>

          <div className="field">
            <label htmlFor="domisili">Lokasi domisili</label>
            <input
              id="domisili"
              type="text"
              value={draf.domisili}
              onChange={(e) => ubah({ domisili: e.target.value })}
              placeholder="Kecamatan, mis. Tebet"
            />
            <p className="bantu">Dipakai untuk menghitung jarak lowongan dari rumahmu.</p>
          </div>

          <div className="kartu-cv">
            <div className="kartu-cv__kepala">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z" />
                <path d="M14 3v4h4" />
                <path d="M9 13h6M9 17h4" />
              </svg>
              <div>
                <p className="kartu-cv__judul">Punya CV? Unggah sekarang (30 detik)</p>
                <p className="bantu">Atau nanti saja, saat kamu melamar.</p>
              </div>
            </div>
            <UnggahCv
              cv={draf.cv}
              onSimpan={(cv) => ubah({ cv })}
              onHapus={() => ubah({ cv: null })}
            />
          </div>

          <div className="lengkapi__aksi">
            <button type="submit" className="tombol tombol--primary tombol--besar">
              Simpan &amp; Lihat Lowongan
            </button>
            {/* Warnanya #4B6587 penuh (5,5:1), tidak diredupkan — ini jalan keluar,
                dan jalan keluar harus terbaca sekali lihat. */}
            <button type="button" className="tombol-nanti" onClick={nantiSaja}>
              Nanti saja
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
