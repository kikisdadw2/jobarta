import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import UnggahCv from "./UnggahCv";

/* "Lampirkan CV — just-in-time" (artboard paling penting di alur profil).
 *
 * Muncul saat seeker menekan "Lamar Sekarang" pertama kali — BUKAN sebagai
 * penghalang sebelum melihat peta. Di sinilah motivasi pengguna paling tinggi:
 * dia sudah menemukan lowongan yang dia mau.
 *
 * 375px = bottom sheet · 1440px = dialog di tengah · scrim 50%.
 */
export default function SheetLampirkanCv({ perusahaan, onSimpan, onLewati, onTutup }) {
  const tutupRef = useRef(null);

  useEffect(() => {
    tutupRef.current?.focus();
    const onEsc = (e) => e.key === "Escape" && onTutup();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onTutup]);

  return (
    <div className="scrim" onClick={onTutup}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-judul"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="sheet__pegangan" aria-hidden="true" />

        <div className="sheet__kepala">
          {/* Judul menyebut nama perusahaannya, bukan "Unggah CV" generik —
              pengguna ingat kenapa sheet ini muncul. */}
          <h2 id="sheet-judul" className="sheet__judul">
            Lampirkan CV untuk melamar di {perusahaan}
          </h2>
          <button
            ref={tutupRef}
            type="button"
            className="tombol-ikon"
            aria-label="Tutup"
            onClick={onTutup}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <UnggahCv cv={null} onSimpan={onSimpan} onHapus={() => {}} />

        {/* Jalan keluar wajib ada: orang yang belum punya CV tidak boleh
            kehilangan lowongan yang baru saja dia temukan. */}
        <button type="button" className="tombol-nanti" onClick={onLewati}>
          Saya belum punya CV — kirim pakai data profil
        </button>
        <p className="bantu bantu--tengah">
          Datanya diambil dari <Link to="/profil">profilmu</Link>.
        </p>
      </div>
    </div>
  );
}
