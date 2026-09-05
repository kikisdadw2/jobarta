import { Link } from "react-router-dom";
import { Merek, Logo } from "./Dasar";
import { EMAIL_KONTAK, mailto, TERAKHIR_DIPERBARUI } from "../lib/kontak";

/* Kerangka bersama dua halaman legal.
 *
 * Dibuat bersama bukan demi hemat baris, tapi supaya keduanya tidak pernah
 * berbeda soal tanggal berlaku dan alamat kontak. Dokumen legal yang saling
 * bertentangan lebih buruk daripada satu dokumen saja.
 */
export default function HalamanLegal({ judul, ringkas, children }) {
  return (
    <div className="halaman">
      <header className="navbar">
        <Merek />
        <nav className="navbar__nav" aria-label="Menu">
          <Link to="/peta">Peta lowongan</Link>
        </nav>
      </header>

      <main className="seksi legal">
        <Link to="/" className="tautan-kembali">
          &larr; Kembali ke beranda
        </Link>

        <h1 className="seksi__judul">{judul}</h1>
        <p className="legal__tanggal">
          Terakhir diperbarui: <strong>{TERAKHIR_DIPERBARUI}</strong>
        </p>

        {/* Ringkasan sebelum isi lengkap. Dokumen legal yang hanya bisa
            dipahami pengacara gagal memenuhi maksud UU PDP: persetujuan
            baru sah kalau orangnya benar-benar mengerti apa yang disetujui. */}
        <div className="legal__ringkas">
          <h2>Ringkasnya</h2>
          {ringkas}
        </div>

        <div className="legal__isi">{children}</div>

        <div className="legal__kontak">
          <Logo ukuran={32} />
          <p>
            Ada pertanyaan tentang halaman ini?{" "}
            <a href={mailto(`Pertanyaan tentang ${judul}`)}>{EMAIL_KONTAK}</a>
          </p>
        </div>

        <p className="legal__silang">
          <Link to="/kebijakan-privasi">Kebijakan Privasi</Link> ·{" "}
          <Link to="/syarat-penggunaan">Syarat Penggunaan</Link>
        </p>
      </main>
    </div>
  );
}
