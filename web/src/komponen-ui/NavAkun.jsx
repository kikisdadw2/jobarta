import { Link, NavLink } from "react-router-dom";
import { Merek } from "./Dasar";
import { useAuth } from "../konteks/useAuth";

/* Navbar untuk halaman akun (Profil, Lamaran Saya).
 * Dipakai bersama supaya menu tidak menyimpang antar halaman. */
export default function NavAkun() {
  const { sudahMasuk, keluar } = useAuth();

  return (
    <header className="navbar">
      <Merek />
      <nav className="navbar__nav" aria-label="Menu akun">
        <NavLink to="/peta">Peta lowongan</NavLink>
        <NavLink to="/lamaran">Lamaran Saya</NavLink>
        <NavLink to="/profil">Profil</NavLink>
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
          <Link to="/masuk" className="tombol tombol--primary navbar__masuk">
            Masuk
          </Link>
        )}
      </nav>
    </header>
  );
}
