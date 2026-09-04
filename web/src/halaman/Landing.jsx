import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import lowongan, { KATEGORI } from "../data/lowongan";
import { formatGaji, jarakKm, formatJarak } from "../lib/format";
import { Logo, Merek, IkonGoogle, Terverifikasi } from "../komponen-ui/Dasar";
import { useGoogleAktif } from "../lib/penyedia";

/* DESIGN 2 — Landing, mengikuti artboard design-canvas/landing/.
 *
 * Pola marketplace: search bar ADALAH CTA utama. Susunan BERUBAH di 1440px
 * (search satu baris, kategori 6 kolom, cara kerja 3 kolom), bukan diperbesar.
 */

// Titik acuan cuplikan peta & jarak di kartu: Pasar Minggu, Jakarta Selatan.
// Jarak ditulis "dari Pasar Minggu", bukan "dari kamu" — di sini kita belum
// tahu lokasi pengunjung, dan mengarang jarak akan terasa bohong begitu
// pengguna sadar mereka tidak pernah memberi izin lokasi.
const ACUAN = { lat: -6.2846, lng: 106.8449 };

const CHIP = ["Kasir", "Gudang", "Barista", "Driver", "Admin"];

const IKON_KATEGORI = {
  Ritel: "M3 9 5 4h14l2 5M4 9h16v11H4zM9 20v-6h6v6",
  "F&B": "M7 3v8a3 3 0 0 0 6 0V3M10 11v10M17 3c-1.5 2-2 4-2 6s.5 3 2 3v9",
  "Gudang & Logistik": "M3 21V9l9-5 9 5v12M9 21v-7h6v7",
  Admin: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8ZM14 3v5h5M9 13h6M9 17h4",
  Kurir: "M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0M15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0M7 17h8m-8 0-2-6h11l2 6",
  Produksi: "M4 20V10l5 3V10l5 3V6l6 4v10ZM4 20h16",
};

/* Pin kluster: bentuk + ANGKA, bukan warna saja. */
function ikonKluster(jumlah, terverifikasi) {
  const d = jumlah > 1 ? 40 : 30;
  const isi = terverifikasi ? "var(--color-accent)" : "var(--color-warning)";
  return L.divIcon({
    className: "pin",
    html:
      jumlah > 1
        ? `<svg width="${d}" height="${d}" viewBox="0 0 40 40" aria-hidden="true">
             <circle cx="20" cy="20" r="18" fill="${isi}" stroke="#F7F6F2" stroke-width="2"/>
             <text x="20" y="26" text-anchor="middle" font-family="system-ui,sans-serif"
                   font-size="15" font-weight="700" fill="#F7F6F2">${jumlah}</text>
           </svg>`
        : `<svg width="${d}" height="${d}" viewBox="0 0 24 30" aria-hidden="true">
             <path d="M12 29c0 0-9-10.2-9-16.2A9 9 0 0 1 21 12.8C21 18.8 12 29 12 29Z"
                   fill="${isi}" stroke="#F7F6F2" stroke-width="1.5"/>
             <circle cx="12" cy="12" r="3.4" fill="#F7F6F2"/>
           </svg>`,
    iconSize: [d, d],
    iconAnchor: [d / 2, jumlah > 1 ? d / 2 : d],
  });
}

/* Menekan area petanya (bukan pinnya) membuka peta penuh.
 *
 * Leaflet TIDAK meneruskan klik marker ke event klik peta, jadi kedua perilaku
 * hidup berdampingan tanpa saling menimpa: pin mengganti kartu sorot, area
 * kosong membawa pengguna ke /peta.
 *
 * Ini pelengkap, bukan satu-satunya jalan: tombol "Cari di Peta" dan kartu
 * sorot tetap jadi jalur yang bisa dicapai papan ketik. Peta yang cuma bisa
 * diklik tetikus akan mengunci pengguna keyboard. */
function KlikBukaPeta({ onBuka }) {
  useMapEvents({ click: onBuka });
  return null;
}

export default function Landing() {
  const googleAktif = useGoogleAktif();
  const [menuTerbuka, setMenuTerbuka] = useState(false);

  // Escape menutup menu: tombol hamburger membuka lapisan yang menutupi
  // halaman, dan setiap lapisan wajib punya jalan keluar dari papan ketik.
  useEffect(() => {
    if (!menuTerbuka) return;
    const onEsc = (e) => e.key === "Escape" && setMenuTerbuka(false);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [menuTerbuka]);

  const [tempat, setTempat] = useState("");
  const [posisi, setPosisi] = useState("");
  const navigate = useNavigate();

  // Tiga lowongan terdekat dari acuan — data sungguhan, bukan contoh karangan.
  const terbaru = lowongan
    .filter((l) => l.terverifikasi)
    .map((l) => ({ ...l, jarak: jarakKm(ACUAN, l) }))
    .sort((a, b) => a.jarak - b.jarak)
    .slice(0, 3);

  const sekitar = lowongan
    .map((l) => ({ ...l, jarak: jarakKm(ACUAN, l) }))
    .sort((a, b) => a.jarak - b.jarak)
    .slice(0, 6);
  /* Pin yang sedang disorot. Artboard menulis "kartu lowongan muncul saat pin
     ditekan" — jadi peta ini memang alat, bukan gambar. */
  const [sorotId, setSorotId] = useState(null);
  const sorot = sekitar.find((l) => l.id === sorotId) ?? sekitar[0];

  function cariSekarang(e) {
    e.preventDefault();
    const p = new URLSearchParams();
    // URL mencerminkan state supaya hasilnya bisa dibagikan & di-bookmark.
    if (posisi.trim()) p.set("cari", posisi.trim());
    if (tempat.trim()) p.set("tempat", tempat.trim());
    navigate(p.toString() ? `/peta?${p}` : "/peta");
  }

  return (
    <div className="halaman">
      <a className="skip-link" href="#utama">
        Lompat ke konten utama
      </a>

      {/* Di 375px artboard menutup menu di balik tombol hamburger dan menyisakan
          "Untuk Perusahaan" saja. Alasannya bukan estetika: tiga item yang
          ditumpuk mendorong hero turun ~90px, dan hero itulah yang menjelaskan
          apa ini. Di 1440px menunya kembali terbentang penuh. */}
      <header className={`navbar navbar--landing${menuTerbuka ? " navbar--menu-buka" : ""}`}>
        <Merek />

        <Link to="/masuk?peran=employer" className="navbar__employer">
          Untuk Perusahaan
        </Link>

        <button
          type="button"
          className="navbar__hamburger"
          aria-expanded={menuTerbuka}
          aria-controls="menu-utama"
          onClick={() => setMenuTerbuka((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            {menuTerbuka ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
          {menuTerbuka ? "Tutup" : "Menu"}
        </button>

        <nav
          id="menu-utama"
          className={`navbar__nav${menuTerbuka ? " navbar__nav--buka" : ""}`}
        >
          <Link to="/peta">Cari Lowongan</Link>
          <Link to="/masuk?peran=employer" className="navbar__nav-employer">
            Untuk Perusahaan
          </Link>
          {/* Logo Google resmi berwarna — satu-satunya tempat di seluruh produk
              yang boleh keluar dari palet; brand guideline Google melarang
              logonya diwarnai ulang. */}
          {/* Menyebut "Google" di sini hanya jujur bila providernya hidup;
              kalau mati, tautannya tetap berfungsi tapi tidak menjanjikan
              jalur masuk yang tak tersedia di layar berikutnya. */}
          <Link to="/masuk" className="tombol tombol--sekunder navbar__masuk">
            {googleAktif && <IkonGoogle />}
            {googleAktif ? "Masuk dengan Google" : "Masuk"}
          </Link>
        </nav>
      </header>

      <main id="utama">
        {/* ---------- HERO: dua kolom, teks kiri + peta kanan ---------- */}
        <section className="hero">
          <div className="hero__teks">
            <h1 className="hero__judul">Cari kerja di dekat rumah kamu.</h1>
            <p className="hero__sub">
              Lihat lowongan yang benar-benar ada di sekitarmu lewat peta — lengkap dengan
              jarak dan gaji, tanpa biaya sepeser pun.
            </p>

            <form className="cari" role="search" onSubmit={cariSekarang}>
              <div className="cari__field">
                <label htmlFor="cari-tempat">Kecamatan atau nama tempat</label>
                <input
                  id="cari-tempat"
                  type="search"
                  value={tempat}
                  onChange={(e) => setTempat(e.target.value)}
                  placeholder="Tebet, Pasar Minggu…"
                  autoComplete="off"
                />
              </div>
              <div className="cari__field">
                <label htmlFor="cari-posisi">Pekerjaan yang dicari</label>
                <input
                  id="cari-posisi"
                  type="search"
                  value={posisi}
                  onChange={(e) => setPosisi(e.target.value)}
                  placeholder="Kasir, gudang…"
                  autoComplete="off"
                />
              </div>
              <button type="submit" className="tombol tombol--primary cari__tombol">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 21s-7-7.6-7-12A7 7 0 0 1 19 9c0 4.4-7 12-7 12Z" />
                  <circle cx="12" cy="9" r="2.6" />
                </svg>
                Cari di Peta
              </button>
            </form>

            <div className="populer">
              <span className="populer__label">Pencarian populer</span>
              <ul className="chip-baris">
                {CHIP.map((c) => (
                  <li key={c}>
                    <Link to={`/peta?cari=${encodeURIComponent(c)}`} className="chip chip--tautan">
                      {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="hero__peta">
            {/* Peta sungguhan, bukan gambar mati — inilah bukti janji di judul. */}
            <MapContainer
              center={[ACUAN.lat, ACUAN.lng]}
              zoom={12}
              className="mini-peta mini-peta--bisa-klik"
              zoomControl={false}
              scrollWheelZoom={false}
              dragging={false}
              doubleClickZoom={false}
              keyboard={false}
              attributionControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {sekitar.map((l, i) => (
                <Marker
                  key={l.id}
                  position={[l.lat, l.lng]}
                  icon={ikonKluster(i === 0 ? 12 : i === 1 ? 7 : i === 2 ? 4 : 1, l.terverifikasi)}
                  keyboard={true}
                  alt={`${l.posisi} di ${l.perusahaan}`}
                  title={`${l.posisi} — ${l.perusahaan}`}
                  eventHandlers={{ click: () => setSorotId(l.id) }}
                />
              ))}
              <KlikBukaPeta onBuka={() => navigate("/peta")} />
            </MapContainer>
            <span className="mini-peta__petunjuk" aria-hidden="true">
              Buka peta lengkap
            </span>

            {/* Kartunya sendiri tautan: setelah menemukan lowongan yang menarik
                di cuplikan ini, jalan berikutnya harus satu ketukan — bukan
                mencarinya ulang di halaman peta. `aria-live` mengumumkan
                pergantian isi saat pin lain ditekan, karena kartunya berubah
                jauh dari titik yang disentuh. */}
            <Link
              to={`/peta?lowongan=${sorot.id}`}
              className="sorot"
              aria-live="polite"
            >
              <h2 className="sorot__posisi">
                {sorot.posisi}
                {sorot.terverifikasi && <Terverifikasi />}
              </h2>
              <p className="sorot__meta">
                {sorot.perusahaan} · {formatGaji(sorot.gajiMin, sorot.gajiMax, sorot.tipe)} ·{" "}
                {formatJarak(sorot.jarak)} dari Pasar&nbsp;Minggu
              </p>
              <span className="sorot__ajak">Lihat lowongan ini di peta →</span>
            </Link>

            <p className="hero__ket">
              Ketuk pin untuk melihat lowongannya, atau ketuk petanya untuk membuka
              peta lengkap.
            </p>
          </div>
        </section>

        {/* ---------- KATEGORI ---------- */}
        <section className="seksi">
          <h2 className="seksi__judul">Kategori pekerjaan</h2>
          <p className="seksi__sub">Bidang yang paling banyak dicari di Jakarta.</p>
          <ul className="kategori">
            {KATEGORI.map((k) => (
              <li key={k}>
                <Link to={`/peta?kategori=${encodeURIComponent(k)}`} className="kategori__kartu">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={IKON_KATEGORI[k]} />
                  </svg>
                  {k}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- CARA KERJA ---------- */}
        <section className="seksi seksi--alt">
          <h2 className="seksi__judul">Cara kerjanya</h2>
          <p className="seksi__sub">Tiga langkah, tanpa biaya.</p>
          <ol className="langkah">
            <li>
              <span className="langkah__no">1</span>
              <h3>Cari di peta</h3>
              <p>
                Geser peta ke sekitar rumahmu. Lowongan muncul lengkap dengan jaraknya, bukan
                cuma nama kecamatan.
              </p>
            </li>
            <li>
              <span className="langkah__no">2</span>
              <h3>Lamar</h3>
              <p>
                Kirim lamaran langsung dari HP. Belum punya CV? Bisa isi data singkat sebagai
                gantinya.
              </p>
            </li>
            <li>
              <span className="langkah__no">3</span>
              <h3>Dihubungi perusahaan</h3>
              <p>
                Pantau status lamaranmu, dari terkirim, dilihat, sampai dipanggil wawancara.
              </p>
            </li>
          </ol>
        </section>

        {/* ---------- BLOK MEREK ----------
            Menggantikan seksi "Aman dari lowongan palsu" (keputusan 2026-09-02).
            Seksi lama menjanjikan tiga hal yang belum bisa dipegang produk —
            terutama "laporanmu ditinjau", sedangkan tombol lapornya sendiri
            belum melakukan apa pun. Menjanjikan sesuatu yang belum ada di
            halaman yang menjual kepercayaan justru merusak kepercayaan itu.

            Yang bertahan cuma satu kalimat yang PASTI benar: gratis untuk
            pencari kerja. Tidak ada satu pun alur pembayaran di aplikasi. */}
        <section className="seksi seksi--alt merek-blok">
          <span className="merek-blok__logo" aria-hidden="true">
            <Logo ukuran={104} />
          </span>
          <p className="merek-blok__nama">JOBARTA</p>
          <p className="merek-blok__tagline">Cari kerja di sekitarmu, lewat peta.</p>
          <p className="merek-blok__ket">Gratis selamanya untuk pencari kerja.</p>
        </section>

        {/* ---------- LOWONGAN TERBARU ---------- */}
        <section className="seksi">
          <div className="seksi__kepala">
            <div>
              <h2 className="seksi__judul">Lowongan terbaru</h2>
              <p className="seksi__sub">Baru dipasang di sekitar Jakarta Selatan.</p>
            </div>
            {/* Di 1440px tombol ini berdiri sebaris dengan judul; di 375px
                artboard memindahkannya KE BAWAH daftar — orang perlu melihat
                lowongannya dulu sebelum ditawari "lihat semua". */}
            <Link to="/peta" className="tombol tombol--sekunder seksi__aksi-atas">
              Lihat semua di peta
            </Link>
          </div>
          <ul className="unggulan">
            {terbaru.map((l) => (
              <li key={l.id}>
                <Link to={`/peta?lowongan=${l.id}`} className="unggulan__kartu">
                  <h3>{l.posisi}</h3>
                  <p className="unggulan__perusahaan">
                    {l.perusahaan} <Terverifikasi />
                  </p>
                  <p className="unggulan__chip">
                    <span className="chip">{formatGaji(l.gajiMin, l.gajiMax, l.tipe)}</span>
                    <span className="chip">{formatJarak(l.jarak)}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/peta" className="tombol tombol--sekunder tombol--penuh seksi__aksi-bawah">
            Lihat semua di peta
          </Link>
        </section>

        {/* ---------- CTA PERUSAHAAN: panel slate penuh ---------- */}
        <section className="seksi">
          <div className="cta-perusahaan">
            <div>
              <h2>Punya usaha dan butuh orang?</h2>
              <p>
                Pasang lowongan dan jangkau pelamar yang benar-benar tinggal di sekitar lokasi
                usahamu. Perlu verifikasi dokumen usaha sebelum lowongan tayang.
              </p>
            </div>
            <Link to="/masuk?peran=employer" className="tombol tombol--terang">
              Pasang Lowongan
            </Link>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer__kolom">
          <Merek />
          <p>
            Cari kerja lewat peta, di Jakarta. <strong>Gratis selamanya untuk pencari kerja.</strong>
          </p>
        </div>
        <nav className="footer__kolom" aria-label="Dokumen">
          <a href="#kebijakan">Kebijakan Privasi</a>
          <a href="#syarat">Syarat Penggunaan</a>
        </nav>
        <nav className="footer__kolom" aria-label="Tautan lain">
          <Link to="/masuk?peran=employer">Untuk Perusahaan</Link>
          <a href="#kontak">Hubungi kami</a>
        </nav>
        <p className="footer__atribusi">
          Data peta &copy;{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap contributors
          </a>
          , lisensi ODbL.
        </p>
      </footer>
    </div>
  );
}
