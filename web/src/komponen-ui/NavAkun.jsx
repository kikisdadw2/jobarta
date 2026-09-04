import { NavLink } from "react-router-dom";
import { Merek } from "./Dasar";
import MenuAkun from "./MenuAkun";
import NavDrawer from "./NavDrawer";

/* Navbar untuk halaman akun (Profil, Lamaran Saya).
 * Dipakai bersama supaya menu tidak menyimpang antar halaman. */
export default function NavAkun() {
  return (
    <header className="navbar">
      <Merek />
      {/* Desktop: menu terbentang. Sempit: laci beraksesibilitas penuh.
          Sebelum ini menunya cuma membungkus jadi beberapa baris dan
          mendorong isi halaman turun. */}
      <div className="navbar__lebar">
      <nav className="navbar__nav" aria-label="Menu akun">
        <NavLink to="/peta">Peta lowongan</NavLink>
        <NavLink to="/lamaran">Lamaran Saya</NavLink>
        <NavLink to="/tersimpan">Tersimpan</NavLink>
        <NavLink to="/profil">Profil</NavLink>
        <MenuAkun />
      </nav>
      </div>

      <div className="navbar__sempit">
        <NavDrawer label="Menu akun">
      <nav className="navbar__nav navbar__nav--laci" aria-label="Menu akun">
        <NavLink to="/peta">Peta lowongan</NavLink>
        <NavLink to="/lamaran">Lamaran Saya</NavLink>
        <NavLink to="/tersimpan">Tersimpan</NavLink>
        <NavLink to="/profil">Profil</NavLink>
        <MenuAkun />
      </nav>
        </NavDrawer>
      </div>
    </header>
  );
}
