import { formatGaji, formatWaktu, formatJarak } from "../lib/format";

/**
 * Kartu lowongan — dipakai di daftar (desktop) dan bottom sheet (mobile).
 *
 * Badge "Terverifikasi" sengaja memakai hijau #3F6B4F, warna yang sama dengan CTA
 * "Lamar Sekarang". Itu keputusan design system: keduanya berarti "aman", dan
 * pengguna sasaran belajar warna lebih cepat daripada ikon.
 */
export default function KartuLowongan({ data, aktif, terpilih, onPilih, onHover }) {
  const { posisi, perusahaan, terverifikasi, kategori, tipe, alamat } = data;

  return (
    <li>
      <article
        className={`kartu${terpilih ? " kartu--terpilih" : ""}`}
        onMouseEnter={() => onHover?.(data.id)}
        onMouseLeave={() => onHover?.(null)}
      >
        <button
          type="button"
          className="kartu__tombol"
          onClick={() => onPilih(data)}
          aria-current={terpilih ? "true" : undefined}
        >
          <span className="sr-only">Lihat detail lowongan </span>
          <h3 className="kartu__posisi">{posisi}</h3>
        </button>

        <p className="kartu__perusahaan">
          {perusahaan}
          {terverifikasi ? (
            <span className="badge badge--terverifikasi">
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 6 9 17l-5-5"
                />
              </svg>
              Terverifikasi
            </span>
          ) : (
            <span className="badge badge--menunggu">Menunggu Verifikasi</span>
          )}
        </p>

        <p className="kartu__gaji">{formatGaji(data.gajiMin, data.gajiMax, tipe)}</p>

        <p className="kartu__alamat" title={alamat}>
          {alamat}
        </p>

        <ul className="kartu__meta">
          <li className="chip">{kategori}</li>
          <li className="chip">{tipe}</li>
          {aktif?.jarakKm != null && (
            <li className="chip chip--jarak">{formatJarak(aktif.jarakKm)} dari kamu</li>
          )}
          <li className="kartu__waktu">{formatWaktu(data.dipostingHari)}</li>
        </ul>
      </article>
    </li>
  );
}
