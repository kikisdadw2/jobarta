import { NavLink } from "react-router-dom";
import { Merek } from "./Dasar";
import MenuAkun from "./MenuAkun";

/* Navbar untuk halaman akun (Profil, Lamaran Saya).
 * Dipakai bersama supaya menu tidak menyimpang antar halaman. */
export default function NavAkun() {
  return (
    <header className="navbar">
      <Merek />
      <nav className="navbar__nav" aria-label="Menu akun">
        <NavLink to="/peta">Peta lowongan</NavLink>
        <NavLink to="/lamaran">Lamaran Saya</NavLink>
        <NavLink to="/profil">Profil</NavLink>
        <MenuAkun />
      </nav>
    </header>
  );
}
