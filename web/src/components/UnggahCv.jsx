import { useRef, useState } from "react";
import { periksaBerkasCv, potongNamaBerkas, formatMb } from "../lib/profil";

/* Dropzone CV — dipakai ulang di Lengkapi Profil dan di sheet "Lampirkan CV".
 *
 * Aturan dari artboard "Unggah CV":
 * - Seret-lepas TIDAK PERNAH satu-satunya jalan: mustahil di HP, dan pengguna
 *   keyboard tak bisa memakainya. "Pilih berkas" adalah jalur setara.
 * - Batas dan format disebut SEBELUM memilih, bukan muncul sebagai error.
 * - Galat muncul TEPAT DI BAWAH dropzone, bukan banner di puncak halaman yang
 *   sudah tergulung keluar layar.
 * - Semua perubahan state lewat satu wilayah aria-live="polite" yang sama —
 *   sopan, bukan assertive: unggahan bukan keadaan darurat.
 */
export default function UnggahCv({ cv, onSimpan, onHapus }) {
  const [galat, setGalat] = useState(null);
  const [seret, setSeret] = useState(false);
  const [progres, setProgres] = useState(null); // null | 0..100
  const inputRef = useRef(null);
  const batalRef = useRef(false);

  function terima(file) {
    const pesan = periksaBerkasCv(file);
    setGalat(pesan);
    if (pesan) return;

    // Tanpa backend, unggahan selesai seketika. Progres tetap ditampilkan
    // karena di 4G berkas 5 MB terasa lama — dan tanpa angka, orang mengira
    // aplikasinya hang lalu menutupnya.
    batalRef.current = false;
    setProgres(0);
    const jalan = setInterval(() => {
      setProgres((p) => {
        if (batalRef.current) {
          clearInterval(jalan);
          return null;
        }
        if (p >= 100) {
          clearInterval(jalan);
          onSimpan({
            nama: file.name,
            ukuran: file.size,
            tipe: file.type,
            diunggahPada: new Date().toISOString(),
          });
          return null;
        }
        return p + 20;
      });
    }, 90);
  }

  function pilih(e) {
    const file = e.target.files?.[0];
    if (file) terima(file);
    e.target.value = ""; // supaya memilih berkas yang sama lagi tetap memicu onChange
  }

  /* ---- state: sedang mengunggah ---- */
  if (progres !== null) {
    return (
      <div className="berkas">
        <div className="berkas__utama">
          <p className="berkas__nama">Mengunggah…</p>
          <p className="berkas__meta" role="status" aria-live="polite">
            Mengunggah… {progres}%
          </p>
          <div className="lintasan">
            <div className="lintasan__isi" style={{ width: `${progres}%` }} />
          </div>
        </div>
        <button
          type="button"
          className="tautan-aksi"
          onClick={() => {
            batalRef.current = true;
            setProgres(null);
          }}
        >
          Batalkan
        </button>
      </div>
    );
  }

  /* ---- state: berhasil ---- */
  if (cv) {
    return (
      <div className="berkas">
        {/* Hijau bukan satu-satunya penanda: ada ikon centang DAN kata "Tersimpan". */}
        <span className="berkas__centang" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <div className="berkas__utama">
          <p className="berkas__nama" title={cv.nama}>
            {potongNamaBerkas(cv.nama)}
          </p>
          <p className="berkas__meta" role="status" aria-live="polite">
            <strong className="berkas__tersimpan">Tersimpan</strong> ·{" "}
            {formatMb(cv.ukuran)}
          </p>
        </div>
        <div className="berkas__aksi">
          <button type="button" className="tautan-aksi" onClick={() => inputRef.current?.click()}>
            Ganti
          </button>
          <button type="button" className="tautan-aksi tautan-aksi--rusak" onClick={onHapus}>
            Hapus
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.doc,.docx"
          onChange={pilih}
        />
      </div>
    );
  }

  /* ---- state: awal / gagal ---- */
  return (
    <div>
      <div
        className={`dropzone${seret ? " dropzone--seret" : ""}${galat ? " dropzone--galat" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setSeret(true);
        }}
        onDragLeave={() => setSeret(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSeret(false);
          const file = e.dataTransfer.files?.[0];
          if (file) terima(file);
        }}
      >
        <div>
          <p className="dropzone__judul">Seret berkas CV ke sini</p>
          <p className="dropzone__catatan">PDF, DOC, atau DOCX · maks 5 MB</p>
        </div>
        <button
          type="button"
          className="tombol-hantu"
          onClick={() => inputRef.current?.click()}
        >
          Pilih berkas
        </button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.doc,.docx"
          onChange={pilih}
        />
      </div>
      <p className="dropzone__galat" role="status" aria-live="polite">
        {galat}
      </p>
    </div>
  );
}
