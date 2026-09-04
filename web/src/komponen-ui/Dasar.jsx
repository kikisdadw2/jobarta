import { Link } from "react-router-dom";

/* Elemen yang dipakai berulang di beberapa halaman. Nilainya diambil dari
 * DESIGN 1 (sistem komponen) lewat token di tokens.css — jangan tulis hex
 * mentah di sini. */

export function Logo({ ukuran = 28 }) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 22s-7-8-7-12.5A7 7 0 0 1 19 9.5C19 14 12 22 12 22Z"
        fill="var(--color-primary)"
      />
      <circle cx="12" cy="9.5" r="2.6" fill="var(--color-surface)" />
    </svg>
  );
}

export function Merek({ ke = "/" }) {
  return (
    <Link to={ke} className="merek">
      <Logo />
      <span className="merek__nama">JOBARTA</span>
    </Link>
  );
}

/** Logo Google resmi — 4 warna, tidak boleh diwarnai ulang. */
export function IkonGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}

export function Terverifikasi() {
  return (
    <span className="badge badge--terverifikasi">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      Terverifikasi
    </span>
  );
}

/** Progres onboarding. Angka ditulis, bukan cuma batang warna. */
export function Progres({ langkah, dari, judul }) {
  return (
    <div className="progres">
      <div className="progres__baris">
        <span className="progres__angka">
          Langkah {langkah} dari {dari}
        </span>
        <span className="progres__judul">{judul}</span>
      </div>
      <div className="progres__bar" role="progressbar" aria-valuenow={langkah} aria-valuemin={1} aria-valuemax={dari} aria-label={`Langkah ${langkah} dari ${dari}: ${judul}`}>
        {Array.from({ length: dari }, (_, i) => (
          <span key={i} className={i < langkah ? "progres__ruas progres__ruas--isi" : "progres__ruas"} />
        ))}
      </div>
    </div>
  );
}

export function Pemisah({ teks = "atau" }) {
  return (
    <div className="pemisah">
      <span className="pemisah__garis" />
      <span className="pemisah__teks">{teks}</span>
      <span className="pemisah__garis" />
    </div>
  );
}

export function Peringatan({ nada = "error", children }) {
  return (
    <p className={`peringatan peringatan--${nada}`} role="alert">
      {children}
    </p>
  );
}

/** Ikon untuk keadaan kosong: kotak terbuka, bukan tanda silang.
 *  Kosong bukan galat — bentuknya tidak boleh meminjam bahasa kegagalan. */
export function IkonKosong({ ukuran = 48 }) {
  return (
    <svg
      width={ukuran}
      height={ukuran}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-primary)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="kosong__ikon"
    >
      <path d="M3 9.5 12 4l9 5.5v9L12 24l-9-5.5Z" opacity="0.28" />
      <path d="M3 9.5 12 15l9-5.5" />
      <path d="M12 15v9" />
      <path d="M3 9.5v9L12 24l9-5.5v-9L12 4Z" />
    </svg>
  );
}
