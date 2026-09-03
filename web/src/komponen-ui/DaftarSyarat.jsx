import { SYARAT_PASSWORD } from "../lib/password";

/* Daftar syarat password — dipakai di layar Daftar DAN AturUlang.
 *
 * Blok ini dulu tersalin identik di kedua berkas, SVG dan komentarnya sama
 * persis. Alasan menyatukannya sama dengan alasan lib/password.js ada: kalau
 * syaratnya satu sumber, tampilannya juga harus satu sumber, kalau tidak
 * keduanya pelan-pelan menyimpang.
 *
 * Syarat digambar sebagai daftar bercentang, BUKAN meter warna: warna tidak
 * pernah boleh jadi satu-satunya penanda makna. */
export default function DaftarSyarat({ password }) {
  return (
    <ul className="syarat">
      {SYARAT_PASSWORD.map((s) => {
        // Item nasihat (uji: null) tidak pernah ditandai terpenuhi.
        const lolos = s.uji ? s.uji(password) : false;
        return (
          <li key={s.id} className={lolos ? "syarat--lolos" : ""}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={lolos ? 3 : 2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {lolos ? <path d="M20 6 9 17l-5-5" /> : <circle cx="12" cy="12" r="9" />}
            </svg>
            {s.teks}
            <span className="sr-only">{lolos ? " — terpenuhi" : " — belum terpenuhi"}</span>
          </li>
        );
      })}
    </ul>
  );
}
