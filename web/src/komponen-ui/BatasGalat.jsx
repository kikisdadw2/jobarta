import { Component } from "react";

/* Jaring terakhir: satu galat render tidak boleh jadi layar putih.
 *
 * 🔴 Ini satu-satunya komponen kelas di JOBARTA, dan memang harus begitu —
 *    React belum punya padanan hook untuk `getDerivedStateFromError`. Jangan
 *    ubah jadi fungsi.
 *
 * Tanpa ini, satu `undefined.map()` di komponen mana pun akan melepas SELURUH
 * pohon React dan meninggalkan halaman kosong tanpa satu kata pun. Pengguna
 * tidak tahu apakah aplikasinya rusak, jaringannya putus, atau HP-nya
 * bermasalah — dan tidak ada yang bisa ia lakukan. Layar putih adalah
 * kegagalan yang paling mahal karena ia menghapus jalan keluarnya sekaligus.
 */
export default class BatasGalat extends Component {
  constructor(props) {
    super(props);
    this.state = { galat: null };
  }

  static getDerivedStateFromError(galat) {
    return { galat };
  }

  componentDidCatch(galat, info) {
    /* Dicetak ke konsol, bukan ditampilkan. Jejak tumpukan tidak berarti apa
       pun bagi pencari kerja, tapi ia satu-satunya petunjuk bagi yang
       memperbaiki — dan tanpa baris ini ia hilang bersama render yang gagal. */
    console.error("[JOBARTA] render gagal:", galat, info?.componentStack);
  }

  render() {
    if (!this.state.galat) return this.props.children;

    return (
          <div className="auth auth--tunggal">
      {/* Pembungkus `auth auth--tunggal` WAJIB, bukan hiasan: aturan 980px di
        halaman.css:288 mengunci `.auth__utama` ke 620px di tepi kiri untuk layar
        Masuk yang punya panel samping. Tanpa `.auth--tunggal`, halaman yang
        berdiri sendiri mewarisi lebar itu dan isinya terjepit di kiri dengan
        820px ruang kosong di kanannya. */}
      <main className="auth__utama">
          <div className="auth__kotak kotak-tunggu">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-destructive)" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16.5v.01" />
            </svg>

            <h1 className="auth__judul">Ada yang rusak di halaman ini</h1>
            <p className="auth__sub">
              Bukan salahmu. Coba muat ulang halamannya; kalau masih sama, kembali ke peta
              dan lanjutkan dari sana.
            </p>

            <div className="auth__tombol">
              {/* Muat ulang penuh, bukan setState: keadaan yang membuat render
                  gagal masih tersimpan di memori, dan mencoba merender ulang
                  dengan keadaan yang sama akan gagal lagi seketika. */}
              <button
                type="button"
                className="tombol tombol--primary tombol--penuh tombol--besar"
                onClick={() => window.location.reload()}
              >
                Muat ulang halaman
              </button>
              <a href="/peta" className="tombol tombol--sekunder tombol--penuh">
                Kembali ke peta
              </a>
            </div>

            <details className="galat-teknis">
              <summary>Detail teknis</summary>
              <code>{String(this.state.galat?.message || this.state.galat)}</code>
            </details>
          </div>
        </main>
    </div>
    );
  }
}
