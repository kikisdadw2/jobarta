import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import statis, { KATEGORI, TIPE_KERJA } from "../data/lowongan";
import { semuaLowongan } from "../lib/lowonganku";
import PetaLowongan from "../components/PetaLowongan";
import KartuLowongan from "../components/KartuLowongan";
import PanelDetail from "../components/PanelDetail";
import SheetLampirkanCv from "../components/SheetLampirkanCv";
import KartuPengingat from "../components/KartuPengingat";
import { jarakKm } from "../lib/format";
import { idLamaran, tambahLamaran, bacaLamaran } from "../lib/lamaran";
import { useProfil } from "../lib/useProfil";
import { bacaSesi } from "../lib/sesi";
import { IkonKosong } from "../komponen-ui/Dasar";
import {
  mintaPosisi,
  pantauPosisi,
  penghalang,
  statusIzin,
  penjelasanSudahDilihat,
  tandaiPenjelasanDilihat,
} from "../lib/lokasi";
import Umpan from "../komponen-ui/Umpan";

/* Halaman peta — artboard design-canvas/kerangka-peta.
 *
 * 375px dan 1440px BUKAN versi besar-kecil dari satu susunan:
 *   1440px = split view, bilah saring penuh di atas, daftar 420px + peta
 *   375px  = peta penuh layar, pil mengambang, bottom sheet tiga tahap
 */

const SEMUA = "Semua";

/* Gaji minimum sebagai pilihan, bukan ketikan bebas: mengetik "3000000" di
 * papan ketik HP lambat dan gampang salah jumlah nol. */
const GAJI_MIN = [
  { nilai: 0, label: "Berapa pun" },
  { nilai: 2000000, label: "Rp 2 juta" },
  { nilai: 3000000, label: "Rp 3 juta" },
  { nilai: 4000000, label: "Rp 4 juta" },
  { nilai: 5000000, label: "Rp 5 juta" },
];

const SNAP = ["peek", "setengah", "penuh"];

export default function Peta() {
  const [param] = useSearchParams();
  /* Diambil SEKALI per kunjungan, bukan setiap render: `semuaLowongan()`
   * memanggil jaringan dan membuat array baru, jadi memanggilnya di badan
   * komponen akan membatalkan setiap useMemo di bawahnya pada tiap ketikan di
   * kotak cari.
   *
   * Nilai awalnya 30 lowongan contoh, bukan array kosong: peta terisi sejak
   * bingkai pertama, lalu lowongan dari database menyusul tanpa layar kosong
   * di antaranya. */
  const [lowongan, setLowongan] = useState(statis);
  useEffect(() => {
    let batal = false;
    semuaLowongan().then((d) => {
      if (!batal) setLowongan(d);
    });
    return () => {
      batal = true; // komponen sudah dilepas: jangan setState ke yang tiada
    };
  }, []);
  const [kategori, setKategori] = useState(param.get("kategori") || SEMUA);
  const [tipe, setTipe] = useState(SEMUA);
  const [gajiMin, setGajiMin] = useState(0);
  const [radius, setRadius] = useState(5);
  // Sinkron dua arah dengan peta: kartu di-hover menyalakan pin pasangannya.
  const [disorot, setDisorot] = useState(null);
  const [cari, setCari] = useState(param.get("cari") || "");
  const [urut, setUrut] = useState("terdekat"); // terdekat | terbaru
  const [terpilih, setTerpilih] = useState(
    () => lowongan.find((l) => l.id === param.get("lowongan")) || null
  );
  const [dilamar, setDilamar] = useState(() => new Set());
  const [lamaranku, setLamaranku] = useState([]);
  useEffect(() => {
    let batal = false;
    idLamaran().then((s2) => !batal && setDilamar(s2));
    bacaLamaran()
      .then((d) => !batal && setLamaranku(d))
      .catch(() => {}); // belum masuk: tidak ada riwayat untuk ditampilkan
    return () => { batal = true; };
  }, []);
  const [posisiSaya, setPosisiSaya] = useState(null);
  const [statusLokasi, setStatusLokasi] = useState("diam"); // diam | memuat | galat
  const [galatLokasi, setGalatLokasi] = useState(null); // hasil uraikanGalat()
  const [sheetIzin, setSheetIzin] = useState(false);
  const [ikutiSaya, setIkutiSaya] = useState(false);
  /* Penghitung, bukan boolean: menaikkannya menyuruh peta terbang ULANG ke
     titik pengguna. Dengan boolean, tombol "Lokasi saya" hanya berfungsi
     sekali karena nilainya tidak pernah berubah lagi. */
  const [pusatUlang, setPusatUlang] = useState(0);
  const [snap, setSnap] = useState("setengah");
  const [filterTerbuka, setFilterTerbuka] = useState(false);
  const [profil, perbaruiProfil] = useProfil();
  // Lowongan yang menunggu CV. Diisi saat "Lamar Sekarang" ditekan tanpa CV.
  const [mintaCv, setMintaCv] = useState(null);
  const [mengirim, setMengirim] = useState(null); // id lowongan yang sedang dikirim
  const [galatLamar, setGalatLamar] = useState(null);
  /* Kabar baik butuh tempat sendiri. Sebelum ini "lamaran terkirim" hanya
     terlihat dari tombol yang berubah jadi "Sudah dilamar" — perubahan halus
     yang mudah terlewat kalau tombolnya sudah tergulung keluar layar. */
  const [suksesLamar, setSuksesLamar] = useState(null);

  const hasil = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    let daftar = lowongan.filter((l) => {
      const cocokKategori = kategori === SEMUA || l.kategori === kategori;
      const cocokTipe = tipe === SEMUA || l.tipe === tipe;
      const cocokGaji = !gajiMin || (l.gajiMin != null && l.gajiMin >= gajiMin);
      const cocokKata =
        !kata ||
        l.posisi.toLowerCase().includes(kata) ||
        l.perusahaan.toLowerCase().includes(kata) ||
        l.alamat.toLowerCase().includes(kata);
      return cocokKategori && cocokTipe && cocokGaji && cocokKata;
    });

    if (posisiSaya) {
      // Radius baru punya arti kalau kita tahu pengguna ada di mana.
      daftar = daftar
        .map((l) => ({ ...l, jarakKm: jarakKm(posisiSaya, l) }))
        .filter((l) => l.jarakKm <= radius);
    }

    return daftar.sort((a, b) =>
      urut === "terdekat" && posisiSaya
        ? a.jarakKm - b.jarakKm
        : a.dipostingHari - b.dipostingHari
    );
  }, [lowongan, kategori, tipe, gajiMin, cari, posisiSaya, radius, urut]);

  const jumlahFilter =
    (kategori !== SEMUA ? 1 : 0) +
    (tipe !== SEMUA ? 1 : 0) +
    (gajiMin ? 1 : 0) +
    (cari.trim() ? 1 : 0);

  /* Saat halaman peta dibuka.
   *
   * 🔴 Yang dipanggil di sini BUKAN getCurrentPosition, melainkan sheet
   *    penjelasan. Prompt izin Chrome hanya boleh muncul setelah orangnya tahu
   *    untuk apa: sekali ia menekan "Block", izin itu tersimpan permanen untuk
   *    origin ini dan tidak ada API yang bisa memintanya ulang.
   *
   * Dua jalan pintas yang sengaja diambil:
   *   - izin sudah "granted" -> langsung ambil, tanpa sheet. Menjelaskan ulang
   *     sesuatu yang sudah disetujui hanya menambah satu ketukan.
   *   - izin sudah "denied" -> jangan tampilkan sheet yang menjanjikan sesuatu
   *     yang pasti gagal; tampilkan pesan pemulihannya saja.
   */
  useEffect(() => {
    let hidup = true;
    const halangan = penghalang();
    if (halangan) {
      setGalatLokasi(halangan);
      setStatusLokasi("galat");
      return;
    }
    statusIzin().then((izin) => {
      if (!hidup) return;
      if (izin === "granted") return ambilLokasi();
      if (izin === "denied") {
        setGalatLokasi({
          kode: "PERMISSION_DENIED",
          judul: "Izin lokasi ditolak",
          pesan:
            "Peramban menolak membagikan lokasimu. Kamu tetap bisa mencari dengan " +
            "mengetik nama daerah, atau nyalakan izinnya lewat langkah di bawah.",
          bisaCobaLagi: false,
        });
        setStatusLokasi("galat");
        return;
      }
      if (!penjelasanSudahDilihat()) setSheetIzin(true);
    });
    return () => {
      hidup = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Mode "ikuti saya": satu-satunya tempat watchPosition dipakai.
   *
   * 🔴 clearWatch WAJIB jalan di pembersihan. Tanpa itu GPS menyala terus
   *    walau mode ini dimatikan atau halaman ditinggalkan — di HP kelas
   *    menengah yang jadi sasaran JOBARTA, baterainya terasa habis. */
  useEffect(() => {
    if (!ikutiSaya) return;
    const hentikan = pantauPosisi(
      (pos) => {
        setPosisiSaya(pos);
        setStatusLokasi("diam");
      },
      (g) => {
        setGalatLokasi(g);
        setStatusLokasi("galat");
        setIkutiSaya(false); // berhenti mengikuti sesuatu yang tidak terbaca
      }
    );
    return hentikan;
  }, [ikutiSaya]);

  /* Panggilan sebenarnya ke API. Hanya dipanggil dari dua tempat: setelah
     pengguna menekan "Izinkan" di sheet penjelasan, dan dari tombol "Lokasi
     saya". Tidak pernah otomatis saat halaman dibuka. */
  function ambilLokasi() {
    setStatusLokasi("memuat");
    setGalatLokasi(null);
    mintaPosisi()
      .then((pos) => {
        setPosisiSaya(pos);
        setStatusLokasi("diam");
        setPusatUlang((n) => n + 1);
      })
      .catch((g) => {
        setGalatLokasi(g);
        setStatusLokasi("galat");
      });
  }

  /* Tombol "Lokasi saya" punya DUA tugas yang sering dikira satu: meminta izin
     pertama kali, dan mengembalikan pandangan ke titik yang sudah diketahui.
     Kalau posisinya sudah ada, jangan panggil GPS lagi — cukup terbang. */
  function keLokasiSaya() {
    if (posisiSaya) {
      setPusatUlang((n) => n + 1);
      return;
    }
    const halangan = penghalang();
    if (halangan) {
      setGalatLokasi(halangan);
      setStatusLokasi("galat");
      return;
    }
    if (!penjelasanSudahDilihat()) {
      setSheetIzin(true);
      return;
    }
    ambilLokasi();
  }

  function izinkanDariSheet() {
    tandaiPenjelasanDilihat();
    setSheetIzin(false);
    ambilLokasi();
  }

  function tolakDariSheet() {
    /* Ditandai juga: orang yang menolak penjelasan kita TIDAK boleh disodori
       sheet yang sama setiap kali membuka peta. Tombol "Lokasi saya" tetap
       ada kalau nanti dia berubah pikiran. */
    tandaiPenjelasanDilihat();
    setSheetIzin(false);
  }

  function lamar(id) {
    // Just-in-time: CV diminta di sini, saat orang sudah menemukan lowongan
    // yang dia mau — bukan sebagai tembok sebelum peta terbuka.
    if (!profil.cv) {
      setMintaCv(lowongan.find((l) => l.id === id) || null);
      return;
    }
    kirim(id);
  }

  function kirim(id) {
    // Lamaran dicatat SEKETIKA, sebelum state "Mengirim…" ditampilkan.
    // Versi sebelumnya menunda pencatatan di balik setTimeout: kalau pengguna
    // menutup panel atau berpindah halaman dalam jeda itu, timeoutnya ikut mati
    // dan lamarannya hilang tanpa jejak. Jeda di bawah murni untuk tampilan —
    // begitu ada backend, ia digantikan lama panggilan jaringan sungguhan.
    setMintaCv(null);
    setMengirim(id);
    setGalatLamar(null);
    /* Panggilan jaringan sungguhan menggantikan jeda tampilan yang dulu ada di
     * sini. Penanda "sudah dilamar" baru dipasang setelah server menerima —
     * memasangnya lebih dulu akan menampilkan lamaran yang sebenarnya gagal. */
    tambahLamaran(id)
      .then((d) => {
        setLamaranku(d);
        setDilamar(new Set(d.map((l) => l.lowonganId)));
        setSuksesLamar("Lamaran kamu sudah masuk. Pantau balasannya di Lamaran Saya.");
      })
      .catch(() => setGalatLamar("Lamaran belum terkirim. Periksa koneksi lalu coba lagi."))
      .finally(() => setMengirim(null));
  }

  function hapusSaringan() {
    setKategori(SEMUA);
    setTipe(SEMUA);
    setGajiMin(0);
    setCari("");
  }

  /* Kontrol saring dipakai dua kali: langsung di bilah desktop, dan di dalam
   * sheet filter pada layar sempit. Satu sumber supaya keduanya tidak
   * menyimpang saat salah satunya diubah.
   *
   * `awalan` WAJIB berbeda di tiap pemakaian: dua kontrol dengan id yang sama
   * membuat <label for> menunjuk ke elemen pertama — yang di layar sempit
   * justru yang tersembunyi, sehingga labelnya menjadi bohong bagi pembaca
   * layar dan tidak bisa diklik. */
  const kontrol = (awalan) => (
    <>
      <div className="saring__grup saring__grup--lebar">
        <label htmlFor={`${awalan}-lokasi`}>Lokasi</label>
        <input
          id={`${awalan}-lokasi`}
          type="search"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Kasir, gudang, Tebet…"
          autoComplete="off"
        />
      </div>

      <div className="saring__grup">
        <label htmlFor={`${awalan}-kategori`}>Kategori</label>
        <select id={`${awalan}-kategori`} value={kategori} onChange={(e) => setKategori(e.target.value)}>
          <option>{SEMUA}</option>
          {KATEGORI.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </div>

      <div className="saring__grup">
        <label htmlFor={`${awalan}-gaji`}>Gaji minimum</label>
        <select
          id={`${awalan}-gaji`}
          value={gajiMin}
          onChange={(e) => setGajiMin(Number(e.target.value))}
        >
          {GAJI_MIN.map((g) => (
            <option key={g.nilai} value={g.nilai}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      <div className="saring__grup">
        <label htmlFor={`${awalan}-tipe`}>Tipe kerja</label>
        <select id={`${awalan}-tipe`} value={tipe} onChange={(e) => setTipe(e.target.value)}>
          <option>{SEMUA}</option>
          {TIPE_KERJA.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="saring__grup saring__grup--radius">
        <label htmlFor={`${awalan}-radius`}>
          Radius{" "}
          <span className="angka">
            {posisiSaya ? `${radius.toFixed(1).replace(".", ",")} km` : "—"}
          </span>
        </label>
        <input
          id={`${awalan}-radius`}
          type="range"
          min="1"
          max="20"
          step="0.5"
          value={radius}
          disabled={!posisiSaya}
          onChange={(e) => setRadius(Number(e.target.value))}
        />
        {/* Kontrol mati tanpa penjelasan membuat orang mengira aplikasinya
            rusak. Alasannya ditulis — tapi hanya di sheet, karena satu baris
            teks tambahan akan memaksa bilah desktop tumbuh jadi dua baris. */}
        {awalan === "sheet" && !posisiSaya && (
          <p className="bantu">
            Ketuk &ldquo;Lokasi Saya&rdquo; di bawah dulu supaya jaraknya bisa dihitung.
          </p>
        )}
      </div>

      {galatLamar && <Umpan nada="gagal">{galatLamar}</Umpan>}

      {suksesLamar && (
        <Umpan
          nada="berhasil"
          judul="Lamaran terkirim"
          onTutup={() => setSuksesLamar(null)}
          hilangSetelah={7000}
        >
          {suksesLamar}
        </Umpan>
      )}

      {param.get("profil") === "1" && (
        <Umpan nada="berhasil" judul="Profil tersimpan" hilangSetelah={6000}>
          Perubahanmu sudah dipakai untuk lamaran berikutnya.
        </Umpan>
      )}

      <button
        type="button"
        className="tombol tombol--sekunder saring__lokasi"
        onClick={keLokasiSaya}
        disabled={statusLokasi === "memuat"}
      >
        {statusLokasi === "memuat" ? "Mencari lokasi…" : "Lokasi Saya"}
      </button>
    </>
  );

  return (
    <div className="app">
      <a className="skip-link" href="#daftar">
        Lompat ke daftar lowongan
      </a>

      {/* Bilah saring desktop. Di layar sempit ia disembunyikan dan digantikan
          pil mengambang di atas peta. */}
      <div className="saring" role="group" aria-label="Saringan lowongan">
        <Link to="/" className="saring__merek">
          JOBARTA
        </Link>
        {kontrol("bar")}
        <nav className="saring__akun" aria-label="Menu akun">
          <Link to="/lamaran">Lamaran Saya</Link>
          <Link to="/profil">Profil</Link>
        </nav>
      </div>

      {statusLokasi === "galat" && galatLokasi && (
        <div className="peringatan peringatan--bar lokasi-galat" role="status">
          <p className="lokasi-galat__judul">{galatLokasi.judul}</p>
          <p className="lokasi-galat__isi">{galatLokasi.pesan}</p>

          {/* Pemulihan ditulis eksplisit HANYA untuk izin yang ditolak: itu
              satu-satunya galat yang tidak bisa diperbaiki dengan mencoba lagi,
              karena peramban menyimpan penolakannya permanen untuk origin ini. */}
          {galatLokasi.kode === "PERMISSION_DENIED" && (
            <details className="lokasi-galat__cara">
              <summary>Cara menyalakan izin lokasi lagi</summary>
              <ol>
                <li>Ketuk ikon gembok (atau ⓘ) di sebelah kiri alamat di bilah peramban.</li>
                <li>Pilih <strong>Setelan situs</strong> — di Chrome Android namanya <strong>Izin</strong>.</li>
                <li>Ubah <strong>Lokasi</strong> menjadi <strong>Izinkan</strong>.</li>
                <li>Muat ulang halaman ini.</li>
              </ol>
            </details>
          )}

          <div className="lokasi-galat__aksi">
            {galatLokasi.bisaCobaLagi && (
              <button
                type="button"
                className="tombol tombol--sekunder"
                onClick={ambilLokasi}
                disabled={statusLokasi === "memuat"}
              >
                Coba lagi
              </button>
            )}
            <button
              type="button"
              className="tombol tombol--sekunder"
              onClick={() => {
                setStatusLokasi("diam");
                setGalatLokasi(null);
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <main className="isi">
        {/* Pil mengambang — hanya tampak di layar sempit. */}
        <div className="pil-baris">
          <button
            type="button"
            className="pil pil--lebar"
            onClick={() => setFilterTerbuka(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s-7-8-7-12.5A7 7 0 0 1 19 9.5C19 14 12 22 12 22Z" />
            </svg>
            <span className="pil__teks">{cari.trim() || "Seluruh Jakarta"}</span>
          </button>
          <button type="button" className="pil" onClick={() => setFilterTerbuka(true)}>
            Filter
            {jumlahFilter > 0 && <span className="pil__badge">{jumlahFilter}</span>}
          </button>
          {/* Bukan dari artboard: jalan ke profil di layar sempit. Tanpa ini
              tidak ada pintu ke /profil sama sekali begitu bilah desktop
              disembunyikan. */}
          <Link to="/profil" className="pil pil--ikon" aria-label="Profil kamu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8.5" r="3.4" />
              <path d="M5 20c0-3.4 3.2-5.3 7-5.3s7 1.9 7 5.3" />
            </svg>
          </Link>
        </div>

        {/* Mode ikuti: hanya masuk akal setelah ada titik untuk diikuti, dan
            sengaja TIDAK menyala sendiri — watchPosition menyalakan GPS terus
            menerus, dan itu keputusan yang harus diambil pengguna, bukan kita. */}
        {posisiSaya && (
          <button
            type="button"
            className={`fab fab--ikuti fab--${snap}${ikutiSaya ? " fab--aktif" : ""}`}
            onClick={() => setIkutiSaya((v) => !v)}
            aria-pressed={ikutiSaya}
            /* 🔴 JANGAN memakai frasa "Lokasi saya" di sini. Tombol di
               bawahnya sudah bernama persis itu, dan nama aksesibilitas yang
               saling memuat membuat pembaca layar menyebut dua tombol
               bersebelahan dengan bunyi hampir sama — pengguna papan ketik
               tidak punya cara membedakannya. (Ambiguitas yang sama juga
               mematahkan getByRole di layar.spec.js.) */
            aria-label={ikutiSaya ? "Berhenti mengikuti pergerakanku" : "Ikuti pergerakanku"}
            title={ikutiSaya ? "Berhenti mengikuti" : "Ikuti pergerakanku"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 11l19-9-9 19-2-8-8-2Z" />
            </svg>
          </button>
        )}

        <button
          type="button"
          className={`fab fab--${snap}`}
          onClick={keLokasiSaya}
          aria-label={posisiSaya ? "Kembali ke lokasi saya" : "Lokasi saya"}
          disabled={statusLokasi === "memuat"}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>

        <section
          id="daftar"
          className={`panel panel--${snap}`}
          aria-label="Daftar lowongan"
        >
          {/* Pegangan menaikkan sheet setahap: peek → setengah → penuh → peek.
              Peek menampilkan SATU KARTU UTUH, bukan potongan kartu — potongan
              cuma mengajak menarik; kartu utuh langsung memberi hasil pertama. */}
          <div className="panel__pegangan">
            <button
              type="button"
              className="panel__toggle"
              onClick={() => {
                /* Menaikkan daftar lowongan = sinyal jelas orangnya sedang
                   menelusuri, bukan menunggu menjawab tawaran izin. Kartu itu
                   tawaran, bukan gerbang, jadi ia mundur — dan tidak kembali
                   menagih. Tombol "Lokasi saya" tetap ada kalau nanti dibutuhkan.
                   Tanpa ini kartunya menutupi pegangan sheet saat posisi penuh. */
                if (sheetIzin) tolakDariSheet();
                setSnap((s) => SNAP[(SNAP.indexOf(s) + 1) % SNAP.length]);
              }}
              aria-label={`Daftar lowongan, tinggi ${snap}. Ketuk untuk mengubah.`}
            >
              <span className="panel__garis" aria-hidden="true" />
            </button>
          </div>

          <div className="daftar__kepala">
            <p className="angka" role="status" aria-live="polite">
              <strong>{hasil.length} lowongan</strong> di area ini
            </p>
            <button
              type="button"
              className="daftar__urut"
              onClick={() => setUrut((u) => (u === "terdekat" ? "terbaru" : "terdekat"))}
            >
              {urut === "terdekat" && posisiSaya ? "Terdekat" : "Terbaru"} ▾
            </button>
          </div>

          {/* Pengingat duduk di ATAS daftar: kelengkapan profil menentukan
              apakah lamaran bisa dikirim sama sekali, jadi ia mendahului
              hasil pencarian — bukan mengekor di bawahnya. */}
          {!profil.pengingatDitutup && (
            <KartuPengingat
              profil={profil}
              onTutup={() => perbaruiProfil({ pengingatDitutup: true })}
            />
          )}

          {hasil.length === 0 ? (
            <div className="kosong">
            <IkonKosong />
              <h2>Belum ada lowongan yang cocok</h2>
              <p>
                Coba hapus salah satu saringan{posisiSaya ? ", perlebar radius," : ""} atau
                cari dengan kata yang lebih umum seperti &ldquo;kasir&rdquo; atau
                &ldquo;gudang&rdquo;.
              </p>
              {jumlahFilter > 0 && (
                <button type="button" className="tombol tombol--primary" onClick={hapusSaringan}>
                  Hapus semua saringan
                </button>
              )}
            </div>
          ) : (
            <ul className="daftar">
              {hasil.map((l) => (
                <KartuLowongan
                  key={l.id}
                  data={l}
                  aktif={{ jarakKm: l.jarakKm }}
                  terpilih={terpilih?.id === l.id}
                  onPilih={setTerpilih}
                  onHover={setDisorot}
                />
              ))}
            </ul>
          )}

        </section>

        <section className="peta-wadah" aria-label="Peta lowongan">
          <PetaLowongan
            daftar={hasil}
            terpilih={terpilih}
            disorot={disorot}
            onPilih={setTerpilih}
            posisiSaya={posisiSaya}
            pusatUlang={pusatUlang}
          />
        </section>
      </main>

      {/* 🔴 Sheet ini muncul SEBELUM prompt peramban, tidak pernah sesudahnya.
          Meminta izin lokasi tanpa konteks adalah cara tercepat mendapat
          "Block" — dan "Block" di Chrome bersifat permanen untuk origin ini,
          tidak bisa diminta ulang oleh kode mana pun. Satu layar penjelasan
          lebih murah daripada fitur yang mati selamanya. */}
      {sheetIzin && (
        /* 🔴 TIDAK memakai .scrim, dan TIDAK aria-modal.
           PRODUCT.md: peta sengaja dibiarkan terbuka karena ia momen "aha"
           produk ini — "memaksa login sebelum orang melihat ada lowongan dekat
           rumahnya adalah cara tercepat kehilangan dia". Modal yang menutup
           peta begitu orang tiba adalah kesalahan yang sama berganti kostum.
           Versi pertama blok ini memakai scrim dan langsung mematahkan 9 tes
           yang mencoba menyentuh peta; itu gejalanya, bukan penyakitnya.
           Jadi ini TAWARAN, bukan gerbang: peta dan daftar tetap bisa dipakai. */
        <div className="lapis-izin" role="presentation">
          <div className="sheet sheet--izin" role="dialog" aria-labelledby="izin-judul">
            <h2 id="izin-judul" className="sheet__judul">
              Tampilkan lowongan terdekat?
            </h2>
            {/* SATU kalimat. Versi pertama punya tiga paragraf dan tumbuh
                sampai 340px — cukup tinggi untuk menutupi pegangan bottom
                sheet di layar 812px, sehingga daftar lowongan tidak bisa
                ditarik. Penjelasan izin yang bertele-tele juga lebih sering
                dilewati daripada dibaca. */}
            <p className="sheet__isi">
              JOBARTA memakai lokasimu untuk mengurutkan lowongan dari yang paling dekat.
              Lokasimu <strong>tidak disimpan</strong>.
            </p>
            <div className="sheet__aksi">
              {/* 🔴 Bukan "Pakai lokasi saya": frasa itu memuat nama tombol FAB
                  di bawahnya persis, sehingga dua kontrol berbeda punya nama
                  aksesibilitas yang saling tumpang tindih. "Izinkan lokasi"
                  juga lebih tepat sebagai label — verba + objek, menyebut apa
                  yang akan terjadi saat ditekan. */}
              <button type="button" className="tombol tombol--primary" onClick={izinkanDariSheet}>
                Izinkan lokasi
              </button>
              {/* Setara secara visual: membuat pilihan menolak jadi redup
                  adalah dark pattern, dan izin yang ditekan karena bingung
                  akan berakhir jadi "Block" permanen juga. */}
              <button type="button" className="tombol tombol--sekunder" onClick={tolakDariSheet}>
                Nanti saja
              </button>
            </div>
          </div>
        </div>
      )}

      {filterTerbuka && (
        <div className="scrim" onClick={() => setFilterTerbuka(false)}>
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Saringan lowongan"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sheet__pegangan" aria-hidden="true" />
            <div className="sheet__kepala">
              <h2 className="sheet__judul">Saring lowongan</h2>
              <button
                type="button"
                className="tombol-ikon"
                aria-label="Tutup"
                onClick={() => setFilterTerbuka(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="saring saring--sheet">{kontrol("sheet")}</div>

            <button
              type="button"
              className="tombol tombol--primary tombol--penuh tombol--besar"
              onClick={() => setFilterTerbuka(false)}
            >
              Lihat {hasil.length} lowongan
            </button>
            {jumlahFilter > 0 && (
              <button type="button" className="tombol-nanti" onClick={hapusSaringan}>
                Hapus semua saringan
              </button>
            )}
          </div>
        </div>
      )}

      {terpilih && (
        <PanelDetail
          data={terpilih}
          sudahDilamar={dilamar.has(terpilih.id)}
          dilamarPada={lamaranku.find((l) => l.lowonganId === terpilih.id)?.dilamarPada}
          mengirim={mengirim === terpilih.id}
          sudahMasuk={Boolean(bacaSesi().username)}
          jarakKm={posisiSaya ? jarakKm(posisiSaya, terpilih) : null}
          onLamar={lamar}
          onTutup={() => setTerpilih(null)}
        />
      )}

      {mintaCv && (
        <SheetLampirkanCv
          perusahaan={mintaCv.perusahaan}
          onSimpan={(cv) => {
            perbaruiProfil({ cv });
            kirim(mintaCv.id);
          }}
          onLewati={() => kirim(mintaCv.id)}
          onTutup={() => setMintaCv(null)}
        />
      )}
    </div>
  );
}
