import { Link, NavLink } from "react-router-dom";
import { Merek } from "./Dasar";
import { useAuth } from "../konteks/useAuth";

/* Navbar sisi perusahaan.
 *
 * Menunya BERBEDA dari NavAkun, bukan sekadar tambahan: employer tidak punya
 * "Lamaran Saya" dan tidak butuh peta pencari kerja sebagai menu utama. Satu
 * navbar untuk dua peran akan memaksa setiap tautan membawa syarat peran, dan
 * itu persis cara menu jadi menyimpang diam-diam.
 */
export default function NavPerusahaan() {
  const { sudahMasuk, keluar } = useAuth();

  return (
    <header className="navbar">
      <Merek ke="/perusahaan" />
      <nav className="navbar__nav" aria-label="Menu perusahaan">
        <NavLink to="/perusahaan">Dasbor</NavLink>
        <NavLink to="/perusahaan/pasang">Pasang lowongan</NavLink>
        <NavLink to="/perusahaan/verifikasi">Verifikasi</NavLink>
        <NavLink to="/peta">Lihat peta</NavLink>
        {sudahMasuk ? (
          <button
            type="button"
            className="tombol tombol--sekunder"
            onClick={() => {
              keluar().then(() => window.location.assign("/"));
            }}
          >
            Keluar
          </button>
        ) : (
          <Link to="/masuk?peran=employer" className="tombol tombol--primary navbar__masuk">
            Masuk
          </Link>
        )}
      </nav>
    </header>
  );
}
