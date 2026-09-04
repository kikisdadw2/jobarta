import { NavLink } from "react-router-dom";
import { Merek } from "./Dasar";
import MenuAkun from "./MenuAkun";
import NavDrawer from "./NavDrawer";

/* Navbar sisi perusahaan.
 *
 * Menunya BERBEDA dari NavAkun, bukan sekadar tambahan: employer tidak punya
 * "Lamaran Saya" dan tidak butuh peta pencari kerja sebagai menu utama. Satu
 * navbar untuk dua peran akan memaksa setiap tautan membawa syarat peran, dan
 * itu persis cara menu jadi menyimpang diam-diam.
 */
export default function NavPerusahaan() {
  return (
    <header className="navbar">
      <Merek ke="/perusahaan" />
      {/* Desktop: menu terbentang. Sempit: laci beraksesibilitas penuh.
          Sebelum ini menunya cuma membungkus jadi beberapa baris dan
          mendorong isi halaman turun. */}
      <div className="navbar__lebar">
      <nav className="navbar__nav" aria-label="Menu perusahaan">
        <NavLink to="/perusahaan">Dasbor</NavLink>
        <NavLink to="/perusahaan/pasang">Pasang lowongan</NavLink>
        <NavLink to="/perusahaan/verifikasi">Verifikasi</NavLink>
        <NavLink to="/peta">Lihat peta</NavLink>
        <MenuAkun ke="/masuk?peran=employer" peran="employer" />
      </nav>
      </div>

      <div className="navbar__sempit">
        <NavDrawer label="Menu perusahaan">
      <nav className="navbar__nav navbar__nav--laci" aria-label="Menu perusahaan">
        <NavLink to="/perusahaan">Dasbor</NavLink>
        <NavLink to="/perusahaan/pasang">Pasang lowongan</NavLink>
        <NavLink to="/perusahaan/verifikasi">Verifikasi</NavLink>
        <NavLink to="/peta">Lihat peta</NavLink>
        <MenuAkun ke="/masuk?peran=employer" peran="employer" />
      </nav>
        </NavDrawer>
      </div>
    </header>
  );
}
