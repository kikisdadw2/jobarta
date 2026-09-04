import { useEffect, useRef, useState } from "react";

/* Umpan balik: satu komponen untuk galat DAN keberhasilan.
 *
 * 🔴 Warna tidak pernah jadi satu-satunya pembawa makna. Merah dan hijau
 *    adalah pasangan yang paling sering tidak terbedakan — deuteranopia dan
 *    protanopia mengenai sekitar 8% laki-laki, dan JOBARTA menyasar pekerja
 *    harian di Jakarta, bukan populasi yang disaring. Jadi setiap pesan
 *    membawa TIGA penanda sekaligus: warna, ikon berbentuk beda (silang vs
 *    centang), dan kata pembuka ("Gagal" / "Berhasil").
 *
 * 🔴 `role` dipilih per nada, bukan disamakan. Galat memakai role="alert"
 *    yang MENYELA pembaca layar: orang harus tahu sekarang, bukan setelah
 *    selesai membaca paragraf. Keberhasilan memakai role="status" yang
 *    menunggu jeda — menyela orang untuk kabar baik justru mengganggu.
 */

function IkonGagal() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  );
}

function IkonBerhasil() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9" />
    </svg>
  );
}

/**
 * @param {"gagal"|"berhasil"} nada
 * @param {() => void} [onTutup] bila diberikan, tombol tutup muncul
 * @param {number} [hilangSetelah] ms; hanya untuk nada berhasil
 */
export default function Umpan({ nada = "gagal", judul, children, onTutup, hilangSetelah }) {
  const [tampil, setTampil] = useState(true);
  const jam = useRef(null);

  useEffect(() => {
    /* Pesan GAGAL tidak pernah hilang sendiri. Ia memberitahu ada yang harus
       diperbaiki; menghapusnya setelah beberapa detik berarti orang yang
       sedang membaca ulang formnya kehilangan satu-satunya petunjuk. */
    if (nada !== "berhasil" || !hilangSetelah) return;
    jam.current = setTimeout(() => {
      setTampil(false);
      onTutup?.();
    }, hilangSetelah);
    return () => clearTimeout(jam.current);
  }, [nada, hilangSetelah, onTutup]);

  if (!tampil) return null;

  const gagal = nada === "gagal";

  return (
    <div
      className={`umpan umpan--${nada}`}
      role={gagal ? "alert" : "status"}
      aria-live={gagal ? "assertive" : "polite"}
    >
      <span className="umpan__ikon">{gagal ? <IkonGagal /> : <IkonBerhasil />}</span>

      <div className="umpan__isi">
        {/* Kata pembuka mengulang makna yang dibawa warna dan ikon. Tiga
            penanda untuk satu pesan bukan berlebihan — itu yang membuatnya
            terbaca oleh orang yang tidak membedakan merah dan hijau. */}
        <strong className="umpan__judul">{judul || (gagal ? "Gagal" : "Berhasil")}</strong>
        {children && <span className="umpan__teks">{children}</span>}
      </div>

      {onTutup && (
        <button
          type="button"
          className="umpan__tutup"
          aria-label="Tutup pesan"
          onClick={() => {
            setTampil(false);
            onTutup();
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </div>
  );
}
