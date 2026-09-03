import { Link } from "react-router-dom";
import { kelengkapan } from "../lib/profil";

/* "Pengingat setelah dilewati" — artboard lengkapi-profil/Pengingat.
 *
 * Pengguna yang menekan "Nanti saja" TIDAK dihukum: ini kartu tipis, bukan
 * modal dan bukan pemblokir, dan bisa ditutup. Ia duduk di ATAS daftar
 * lowongan — bukan melayang di atas peta, karena peta adalah alasan orang
 * datang. Setelah 3 dari 3, kartunya hilang sendiri.
 */

const JARI = 26;
const KELILING = 2 * Math.PI * JARI;

/* Cincin progres: SATU BUSUR PER ITEM, dipisahkan celah — jadi "2 dari 3"
 * terbaca sebagai tiga hal yang bisa dicentang, bukan batang yang kebetulan
 * terisi 66%. Angkanya tetap ditulis di tengah: bentuk dan warna tidak pernah
 * jadi satu-satunya pembawa makna.
 *
 * Busur ke-i mewakili item ke-i, bukan sekadar "N busur pertama" — cincin dan
 * daftar centang di bawahnya harus menunjuk hal yang sama. */
function Cincin({ item, selesai }) {
  const dari = item.length;
  const celah = 10;
  const ruas = KELILING / dari;
  const panjang = ruas - celah;

  return (
    <svg className="cincin" width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
      {item.map((it, i) => (
        <circle
          key={it.kunci}
          className={it.selesai ? "cincin__ruas cincin__ruas--isi" : "cincin__ruas"}
          cx="36"
          cy="36"
          r={JARI}
          strokeDasharray={`${panjang} ${KELILING - panjang}`}
          strokeDashoffset={-(i * ruas) - celah / 2}
        />
      ))}
      <text className="cincin__angka" x="36" y="36">
        {selesai}/{dari}
      </text>
    </svg>
  );
}

export default function KartuPengingat({ profil, onTutup }) {
  const { item, selesai, dari } = kelengkapan(profil);
  if (selesai === dari) return null;

  return (
    <div className="pengingat">
      <button
        type="button"
        className="tombol-ikon pengingat__tutup"
        aria-label="Tutup pengingat"
        onClick={onTutup}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>

      <div className="pengingat__kepala">
        <div
          className="pengingat__cincin"
          role="progressbar"
          aria-valuenow={selesai}
          aria-valuemin={0}
          aria-valuemax={dari}
          aria-label={`Kelengkapan profil: ${selesai} dari ${dari} selesai`}
        >
          <Cincin item={item} selesai={selesai} />
        </div>

        <div className="pengingat__teks">
          <h2 className="pengingat__judul">
            Profil kamu {selesai} dari {dari} lengkap
          </h2>
          <p className="bantu">
            {selesai === dari - 1
              ? "Tinggal satu langkah lagi."
              : "Pelamar dengan profil lengkap lebih sering dibalas."}
          </p>
        </div>
      </div>

      <ul className="pengingat__item">
        {item.map((i) => (
          <li key={i.kunci} className={i.selesai ? "sudah" : undefined}>
            {/* Item yang belum selesai pakai lingkaran kosong bergaris, bukan
                teks abu: --color-border tidak pernah memikul makna sendirian. */}
            <span
              className={`bulat${i.selesai ? " bulat--selesai" : ""}`}
              aria-hidden="true"
            >
              {i.selesai && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </span>
            {i.label}
            <span className="sr-only">{i.selesai ? " — sudah diisi" : " — belum diisi"}</span>
          </li>
        ))}
      </ul>

      <Link to="/profil" className="tautan-aksi pengingat__aksi">
        Lengkapi sekarang
      </Link>
    </div>
  );
}
