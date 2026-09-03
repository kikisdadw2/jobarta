import { Link } from "react-router-dom";
import { Logo, Terverifikasi } from "./Dasar";

/* Panel samping bersama untuk SEMUA layar auth (Masuk, Daftar, LupaPassword,
 * AturUlang, VerifikasiEmail).
 *
 * Dulu cuma Masuk yang punya panel ini dan empat layar sisanya memakai varian
 * `auth--tunggal` — akibatnya begitu pengguna menekan "Daftar" dari layar
 * Masuk, separuh layar lenyap dan mereknya ikut hilang. Kosakata komponen yang
 * berbeda antar layar untuk tugas yang sama itu selalu salah satu, jadi
 * panelnya diangkat ke sini dan varian tunggalnya dibuang.
 *
 * Peta di belakang SENGAJA SVG statis, bukan Leaflet: panel ini cuma latar,
 * dan memuat tile OSM di layar auth berarti menambah permintaan jaringan
 * sebelum pengguna sempat mengetik satu huruf pun.
 *
 * Di bawah 900px panel ini disembunyikan, dan tanpa penggantinya layar auth
 * kehilangan mereknya sama sekali — artboard 375px justru membuka dengan logo
 * dan tagline. Karena itu komponen ini juga membawa blok merek ringkas khusus
 * layar sempit; keduanya tidak pernah tampil bersamaan. */
export default function PanelAuth() {
  return (
    <>
    <div className="auth__merek-hp">
      <Link to="/" className="merek">
        <Logo ukuran={34} />
        <span className="merek__nama">JOBARTA</span>
      </Link>
      <p>Cari kerja di dekat rumah kamu.</p>
    </div>
    <aside className="auth__samping" aria-label="Tentang JOBARTA">
      <div className="auth__samping-peta" aria-hidden="true">
        <svg viewBox="0 0 820 900" preserveAspectRatio="xMidYMid slice">
          <rect width="820" height="900" fill="#EDE2CB" />
          <g stroke="#DFD3B8" strokeWidth="14" strokeLinecap="round">
            <path d="M-40 190H860M-40 470H860M-40 730H860M150-40V940M430-40V940M680-40V940" />
          </g>
          <g stroke="#E4DAC3" strokeWidth="7" strokeLinecap="round">
            <path d="M-40 320H860M-40 600H860M290-40V940M560-40V940M60 40 360 340M470 560l330 330" />
          </g>
          <path d="M-40 800c220-30 380 50 600 0s260-40 320-10v150H-40Z" fill="#DFE6E2" />
          <g fill="#3F6B4F">
            <path d="M232 258s-13-14.6-13-23.2a13 13 0 0 1 26 0c0 8.6-13 23.2-13 23.2Z" />
            <path d="M512 306s-13-14.6-13-23.2a13 13 0 0 1 26 0c0 8.6-13 23.2-13 23.2Z" />
            <path d="M638 700s-13-14.6-13-23.2a13 13 0 0 1 26 0c0 8.6-13 23.2-13 23.2Z" />
          </g>
          <path d="M366 566s-13-14.6-13-23.2a13 13 0 0 1 26 0c0 8.6-13 23.2-13 23.2Z" fill="#4B6587" />
        </svg>
      </div>
      <div className="auth__samping-isi">
        <Link to="/" className="merek merek--besar">
          <Logo ukuran={40} />
          <span className="merek__nama">JOBARTA</span>
        </Link>
        <h2>Cari kerja di dekat rumah kamu.</h2>
        <p>Lihat lowongan di peta, bukan di daftar tanpa ujung. Gratis selamanya buat pencari kerja.</p>
        <ul className="auth__janji">
          <li>
            <Terverifikasi /> Perusahaan dicek dokumen legalitasnya sebelum boleh posting.
          </li>
          <li>JOBARTA tidak pernah meminta biaya apa pun ke pencari kerja.</li>
        </ul>
      </div>
    </aside>
    </>
  );
}
