import { useEffect, useId, useRef, useState } from "react";

/* Hamburger + laci navigasi untuk layar sempit.
 *
 * 🔴 SATU komponen untuk semua header. Sebelum ini hanya Landing yang punya
 *    hamburger; NavAkun dan NavPerusahaan membiarkan menunya membungkus jadi
 *    beberapa baris, mendorong isi halaman turun. Menu yang ditulis per
 *    halaman selalu berakhir menyimpang.
 *
 * Empat hal yang membuat laci ini layak disebut aksesibel, dan tidak satu pun
 * boleh dilewatkan:
 *
 *   1. FOKUS TERJEBAK di dalam laci. Tanpa ini, Tab membawa pengguna papan
 *      ketik ke tautan di belakang laci yang tidak terlihat — mereka menekan
 *      Enter pada sesuatu yang tak bisa mereka lihat.
 *   2. ESC MENUTUP. Jalan keluar yang sama di seluruh aplikasi.
 *   3. SCROLL BODY TERKUNCI. Kalau tidak, menggeser di dalam laci ikut
 *      menggeser halaman di belakangnya, dan posisi baca hilang saat ditutup.
 *   4. FOKUS KEMBALI ke tombol hamburger saat ditutup. Melepas fokus ke
 *      <body> membuat Tab berikutnya melompat ke awal halaman.
 */

const BISA_FOKUS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function NavDrawer({ children, label = "Menu" }) {
  const [buka, setBuka] = useState(false);
  const laci = useRef(null);
  const pemicu = useRef(null);
  const idLaci = useId();

  useEffect(() => {
    if (!buka) return;

    /* Kunci scroll halaman di belakang laci. Nilai semula disimpan supaya
       halaman yang memang punya overflow khusus tidak ikut rusak. */
    const semula = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const isi = laci.current;
    const fokusPertama = isi?.querySelector(BISA_FOKUS);
    fokusPertama?.focus();

    const tangani = (e) => {
      if (e.key === "Escape") {
        setBuka(false);
        return;
      }
      if (e.key !== "Tab" || !isi) return;

      const bisa = [...isi.querySelectorAll(BISA_FOKUS)].filter(
        (el) => el.offsetParent !== null
      );
      if (bisa.length === 0) return;
      const awal = bisa[0];
      const akhir = bisa[bisa.length - 1];

      /* Jebakan fokus: Tab di elemen terakhir kembali ke yang pertama, dan
         Shift+Tab di yang pertama melompat ke terakhir. */
      if (e.shiftKey && document.activeElement === awal) {
        e.preventDefault();
        akhir.focus();
      } else if (!e.shiftKey && document.activeElement === akhir) {
        e.preventDefault();
        awal.focus();
      }
    };

    document.addEventListener("keydown", tangani);
    return () => {
      document.removeEventListener("keydown", tangani);
      document.body.style.overflow = semula;
      // Fokus dikembalikan ke tombolnya, bukan dilepas ke <body>.
      pemicu.current?.focus();
    };
  }, [buka]);

  return (
    <>
      <button
        ref={pemicu}
        type="button"
        className="hamburger"
        aria-expanded={buka}
        aria-controls={idLaci}
        aria-label={buka ? "Tutup menu" : "Buka menu"}
        onClick={() => setBuka((v) => !v)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          {buka ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
        <span className="hamburger__teks">{buka ? "Tutup" : label}</span>
      </button>

      {buka && (
        <>
          {/* Latar gelap ikut menutup saat ditekan — jalan keluar yang paling
              sering dicoba orang di layar sentuh. */}
          <div className="laci__tirai" onClick={() => setBuka(false)} aria-hidden="true" />
          <div
            ref={laci}
            id={idLaci}
            className="laci"
            role="dialog"
            aria-modal="true"
            aria-label={label}
            onClick={(e) => {
              // Menekan tautan di dalam laci harus ikut menutupnya.
              if (e.target.closest("a, button")) setBuka(false);
            }}
          >
            {children}
          </div>
        </>
      )}
    </>
  );
}
