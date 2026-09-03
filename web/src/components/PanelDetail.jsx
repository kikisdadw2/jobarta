import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import lowongan from "../data/lowongan";
import PetaKecil from "./PetaKecil";
import { bacaSimpanan, togglSimpanan } from "../lib/simpanan";
import {
  formatGaji,
  formatWaktu,
  formatJarak,
  formatTanggal,
  inisial,
} from "../lib/format";

/* Detail lowongan — artboard design-canvas/detail-lowongan.
 *
 * Ini layar tempat orang memutuskan "ini asli atau penipuan?", jadi susunannya
 * menjawab itu SEBELUM apa pun yang lain. Keputusan yang mengikat:
 *
 * - Badge dulu, baru gaji. Pertanyaan pertama bukan "berapa bayarannya".
 * - Tanggal verifikasi disebut, supaya badge terasa fakta, bukan stiker.
 * - KETIADAAN badge tidak cukup: perusahaan belum terverifikasi diberi kalimat
 *   eksplisit. Pengguna baru tidak tahu badge itu ada, jadi tidak bisa
 *   menyimpulkan apa pun dari ketiadaannya.
 * - CTA hijau sewarna badge Terverifikasi: melamar dan terverifikasi
 *   sama-sama berarti "aman".
 * - Tombol lapor bergaris bata, bukan bidang penuh — mudah ditemukan tapi
 *   tidak bersaing dengan CTA. Satu aksi utama per layar.
 * - Catatan keamanan hijau, bukan merah: itu janji perlindungan, bukan
 *   peringatan bahaya.
 */

/* Deskripsi sependek ini adalah pola lowongan palsu yang paling sering.
 *
 * Angkanya diambil dari sebaran data nyata, bukan dikira-kira: deskripsi di
 * `lowongan.js` berkisar 67–121 karakter, jadi ambang 140 akan menyalakan
 * peringatan di SETIAP lowongan — dan peringatan yang selalu menyala sama
 * saja dengan tidak ada peringatan. 80 menyalakannya hanya pada kuartil
 * terpendek. Kalau data berubah, angka ini ikut ditinjau. */
const AMBANG_DESKRIPSI_PENDEK = 80;

/* "12 Agustus 2026" — bukan "12/08/26". Tanggal melamar dibaca sekali lalu
 * dijadikan pegangan; format ambigu memaksa orang menebak. */
function tanggalPanjang(iso) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function PanelDetail({
  data,
  sudahDilamar,
  dilamarPada,
  mengirim = false,
  sudahMasuk = true,
  jarakKm,
  onLamar,
  onTutup,
}) {
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [simpanan, setSimpanan] = useState(bacaSimpanan);
  const tutupRef = useRef(null);

  useEffect(() => {
    tutupRef.current?.focus();
    setKonfirmasi(false);
  }, [data]);

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onTutup();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onTutup]);

  if (!data) return null;

  const lowonganLain = lowongan.filter(
    (l) => l.perusahaan === data.perusahaan && l.id !== data.id
  ).length;
  const deskripsiPendek = data.deskripsi.length < AMBANG_DESKRIPSI_PENDEK;

  return (
    <aside className="detail" role="dialog" aria-modal="true" aria-labelledby="detail-judul">
      {/* Bilah sticky: judul terpotong di sini supaya orang tahu ia sedang di
          lowongan mana walau sudah menggulir jauh. */}
      <header className="detail__bar">
        <button
          ref={tutupRef}
          type="button"
          className="tombol-ikon"
          aria-label="Kembali ke peta"
          onClick={onTutup}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
          {/* Labelnya baru terlihat di 1440px; di 375px tombolnya ikon 44px
              saja, dan judul lowongan yang mengisi bilahnya. */}
          <span className="detail__kembali-teks">Kembali ke peta</span>
        </button>
        <p className="detail__bar-judul">{data.posisi}</p>
        {/* Jejak navigasi hanya di 1440px: di 375px artboard menggantinya dengan
            tombol kembali 44px yang sudah ada di kirinya. */}
        <nav className="detail__jejak" aria-label="Jejak navigasi">
          <Link to={`/peta?kategori=${encodeURIComponent(data.kategori)}`}>{data.kategori}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{data.posisi}</span>
        </nav>
      </header>

      <div className="detail__isi">
        <div>
          <h2 id="detail-judul" className="detail__posisi">
            {data.posisi}
          </h2>

          <p className="detail__perusahaan">
            {data.perusahaan}
            {data.terverifikasi && (
              <span className="badge badge--terverifikasi">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Terverifikasi
              </span>
            )}
          </p>

          {data.terverifikasi ? (
            <p className="detail__verifikasi">
              Legalitas usaha diperiksa JOBARTA pada{" "}
              {data.diverifikasiPada ? formatTanggal(data.diverifikasiPada) : "—"}
            </p>
          ) : (
            <p className="detail__belum">Perusahaan ini belum diverifikasi</p>
          )}
        </div>

        <ul className="detail__chip">
          {/* Gaji tak disebutkan jadi chip bergaris primary, bukan ruang kosong. */}
          <li className={data.gajiMin == null ? "chip chip--rundingan" : "chip"}>
            {data.gajiMin == null
              ? "Gaji dirundingkan"
              : formatGaji(data.gajiMin, data.gajiMax, data.tipe)}
          </li>
          <li className="chip">{data.tipe}</li>
          {jarakKm != null && <li className="chip">{formatJarak(jarakKm)}</li>}
          <li className="chip">{formatWaktu(data.dipostingHari)}</li>
        </ul>

        <section className="detail__seksi kartu-seksi">
          <h3 className="detail__subjudul">Deskripsi pekerjaan</h3>
          <p>{data.deskripsi}</p>
          <p>
            <strong>Syarat:</strong>
          </p>
          <ul className="detail__syarat">
            {data.syarat.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        {deskripsiPendek && (
          <div className="panel-curiga" role="note">
            <strong>Deskripsi ini sangat singkat.</strong> Tanya detail tugas, jam
            kerja, dan gaji sebelum kamu datang. Lowongan yang enggan menjelaskan
            patut dicurigai.
          </div>
        )}

        <section className="detail__seksi kartu-seksi">
          <h3 className="detail__subjudul">Lokasi tempat kerja</h3>
          {/* Peta kecil non-interaktif: yang dibutuhkan di sini "di mana kira-kira",
              bukan alat jelajah kedua. Menggeser peta ini malah membuat orang
              kehilangan peta utamanya. Atribusi ODbL tetap wajib tampil. */}
          {/* 1440px: peta di kiri, alamat di kanan. 375px: bertumpuk. */}
          <div className="lokasi">
            <PetaKecil lat={data.lat} lng={data.lng} nama={data.posisi} />
            <div className="lokasi__teks">
              <p>{data.alamat}</p>
              {jarakKm != null && (
                <p className="detail__jarak angka">{formatJarak(jarakKm)} dari lokasimu</p>
              )}
              {/* Peta di halaman ini sengaja mati interaksinya, jadi jalan
                  keluarnya disediakan terang-terangan: buka koordinat yang sama
                  di aplikasi peta yang sudah dipakai orang untuk menghitung
                  ongkos dan waktu tempuh. */}
              <a
                className="lokasi__buka"
                href={`https://www.openstreetmap.org/?mlat=${data.lat}&mlon=${data.lng}#map=16/${data.lat}/${data.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Buka di aplikasi peta
              </a>
            </div>
          </div>
        </section>

        <section className="detail__seksi kartu-seksi">
          <h3 className="detail__subjudul">Tentang perusahaan</h3>
          <div className="perusahaan">
            <span className="perusahaan__inisial" aria-hidden="true">
              {inisial(data.perusahaan)}
            </span>
            <div>
              <p className="perusahaan__nama">{data.perusahaan}</p>
              <p className="bantu">{data.kategori}</p>
              {lowonganLain > 0 && (
                <Link className="perusahaan__lain" to={`/peta?cari=${encodeURIComponent(data.perusahaan)}`}>
                  Lihat {lowonganLain} lowongan lain
                </Link>
              )}
            </div>
          </div>
        </section>

      </div>

      {/* Panel aksi. Di 1440px ia kolom kanan yang sticky — gaji diulang di sini
          supaya angkanya selalu terlihat bersama tombolnya, karena deskripsi
          lowongan bisa panjang dan orang tidak boleh menggulir balik ke atas
          untuk mengingat bayarannya. Di 375px panel ini PECAH: gaji hilang
          (sudah ada di chip), janji & lapor turun ke akhir isi, dan tombolnya
          jadi bar sticky di dasar layar. */}
      <aside className="detail__samping">
        <div className="detail__gaji">
          <p className="detail__gaji-label">
            Gaji {data.tipe === "Harian" ? "per hari" : "per bulan"}
          </p>
          <p className="detail__gaji-angka">
            {data.gajiMin == null
              ? "Dirundingkan"
              : formatGaji(data.gajiMin, data.gajiMax, data.tipe).replace(/\/(bulan|hari)$/, "")}
          </p>
        </div>

        <footer className="detail__aksi">
        {/* Lima state tombol Lamar — artboard DetailStates. Di sinilah bug UX
            paling sering muncul: orang menekan "Lamar" dua kali karena tidak
            ada satu pun tanda bahwa tekanan pertama sudah diterima. */}
        {data.ditutupPada ? (
          /* 4 · Lowongan ditutup. Tombolnya DIGANTI, bukan dinonaktifkan:
             tombol mati tidak memberi jalan ke mana pun. */
          <div className="detail__ditutup">
            <p role="status">
              Lowongan ini ditutup pada <strong>{tanggalPanjang(data.ditutupPada)}</strong>.
            </p>
            <Link
              to={`/peta?kategori=${encodeURIComponent(data.kategori)}`}
              className="tombol tombol--sekunder tombol--penuh tombol--besar"
            >
              Cari Lowongan Serupa
            </Link>
          </div>
        ) : !sudahMasuk ? (
          /* 5 · Belum login. Labelnya menyebut TUJUAN, bukan sekadar "Masuk",
             dan membawa pengguna kembali ke lowongan ini — bukan ke beranda. */
          <div className="detail__masuk">
            <Link
              to={`/masuk?lanjut=${encodeURIComponent(`/peta?lowongan=${data.id}`)}`}
              className="tombol tombol--accent tombol--penuh tombol--besar"
            >
              Masuk untuk Melamar
            </Link>
            <p className="detail__masuk-ket">Gratis, cukup pakai akun Google kamu</p>
          </div>
        ) : mengirim ? (
          /* 2 · Sedang mengirim — tombol berbidang penuh tersendiri, bukan
             tombol di dalam dialog. Tetap terbaca penuh (tidak diredupkan)
             supaya orang tidak ragu apakah tekanannya tadi masuk. */
          <button
            type="button"
            className="tombol tombol--accent tombol--penuh tombol--besar"
            aria-busy="true"
            disabled
          >
            Mengirim…
          </button>
        ) : sudahDilamar ? (
          /* 3 · Sudah dilamar. Tanggalnya WAJIB disebut: tanpa itu orang tidak
             yakin lamarannya benar terkirim, lalu mencoba lagi lewat jalur lain. */
          <p className="sukses" role="status">
            ✓ Sudah dilamar
            {dilamarPada && <> · Kamu melamar pada {tanggalPanjang(dilamarPada)}</>}.{" "}
            <Link to="/lamaran">Lihat lamaran</Link>
          </p>
        ) : konfirmasi ? (
          <div className="konfirmasi">
            {/* Konfirmasi menyebut KE SIAPA — melamar tidak bisa dibatalkan. */}
            <p>
              Kirim lamaran ke <strong>{data.perusahaan}</strong>?
            </p>
            <div className="konfirmasi__tombol">
              {/* Batal berbentuk ghost, bukan abu samar: jalan mundur harus
                  jelas terbaca, bukan disembunyikan. */}
              <button
                type="button"
                className="tombol tombol--sekunder"
                onClick={() => setKonfirmasi(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="tombol tombol--accent"
                onClick={() => {
                  // Konfirmasi selalu ditutup: kalau lamaran benar terkirim,
                  // state "Mengirim…" yang menggantikannya; kalau alurnya
                  // dialihkan ke sheet "Lampirkan CV", konfirmasi tidak boleh
                  // tertinggal di belakang scrim.
                  setKonfirmasi(false);
                  onLamar(data.id);
                }}
              >
                Ya, Kirim Lamaran
              </button>
            </div>
          </div>
        ) : (
          /* 1 · Bisa dilamar. Satu-satunya tombol berbidang penuh di layar. */
          <button
            type="button"
            className="tombol tombol--accent tombol--penuh tombol--besar"
            onClick={() => setKonfirmasi(true)}
          >
            Lamar Sekarang
          </button>
        )}
        </footer>

        {/* Aksi sekunder: menyimpan lowongan untuk dilamar nanti. Bertepi, bukan
            berbidang penuh — satu aksi utama per layar, dan "Lamar Sekarang"
            yang memegangnya. */}
        <button
          type="button"
          className={`tombol tombol--sekunder tombol--penuh detail__simpan${
            simpanan.has(data.id) ? " detail__simpan--aktif" : ""
          }`}
          aria-pressed={simpanan.has(data.id)}
          onClick={() => setSimpanan(new Set(togglSimpanan(data.id)))}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill={simpanan.has(data.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 4h12v17l-6-4.5L6 21z" />
          </svg>
          {simpanan.has(data.id) ? "Tersimpan" : "Simpan Lowongan"}
        </button>

        {/* Hijau, bukan merah: ini janji perlindungan, bukan peringatan bahaya. */}
        <div className="janji-aman">
          <strong>JOBARTA tidak pernah meminta biaya untuk melamar.</strong> Kalau
          perusahaan meminta uang, laporkan lowongan ini.
        </div>

        <button type="button" className="tombol tombol--bahaya tombol--penuh">
          Laporkan Lowongan Ini
        </button>
      </aside>
    </aside>
  );
}
