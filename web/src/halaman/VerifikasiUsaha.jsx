import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavPerusahaan from "../komponen-ui/NavPerusahaan";
import { Terverifikasi } from "../komponen-ui/Dasar";
import { KATEGORI } from "../data/lowongan";
import {
  bacaPerusahaan,
  simpanPerusahaan,
  ajukanVerifikasi,
  setujuiVerifikasi,
  periksaBerkasDokumen,
  STATUS_VERIFIKASI,
} from "../lib/perusahaan";
import { potongNamaBerkas, formatMb } from "../lib/profil";

/* Verifikasi usaha — profil perusahaan + unggah dokumen legalitas.
 *
 * Kenapa dua hal ini digabung dalam satu layar: keduanya diminta SEKALI di awal
 * dan tidak berguna sendiri-sendiri. Memisahnya jadi dua langkah membuat
 * employer melewati satu dan menggantung di tengah.
 *
 * 🔴 Halaman ini meminta akta dan NPWP — dokumen paling sensitif di seluruh
 *    JOBARTA. Yang disimpan cuma metadata berkas (lihat perusahaan.js); di
 *    produksi berkasnya masuk bucket PRIVAT dengan signed URL, tidak pernah
 *    URL publik.
 */
export default function VerifikasiUsaha() {
  const navigate = useNavigate();
  const [data, setData] = useState(bacaPerusahaan);
  const [galat, setGalat] = useState({});
  const [galatBerkas, setGalatBerkas] = useState(null);
  const berkasRef = useRef(null);

  const status = STATUS_VERIFIKASI[data.status] ?? STATUS_VERIFIKASI.belum;
  const terkunci = data.status === "diproses" || data.status === "terverifikasi";

  function ubah(patch) {
    setData((d) => ({ ...d, ...patch }));
  }

  function pilihBerkas(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const pesan = periksaBerkasDokumen(file);
    if (pesan) {
      setGalatBerkas(pesan);
      return;
    }
    setGalatBerkas(null);
    ubah({
      dokumen: {
        nama: file.name,
        ukuran: file.size,
        tipe: file.type,
        diunggahPada: new Date().toISOString(),
      },
    });
  }

  function kirim(e) {
    e.preventDefault();
    const g = {};
    if (!data.nama?.trim()) g.nama = "Tulis nama perusahaan seperti di dokumen legalitasnya.";
    if (!data.bidang) g.bidang = "Pilih bidang usaha.";
    if (!data.alamat?.trim()) g.alamat = "Tulis alamat usaha.";
    if (!/^0[0-9]{8,13}$/.test(String(data.telepon || "").replace(/[\s-]/g, "")))
      g.telepon = "Tulis nomor telepon yang bisa dihubungi, contoh 081234567890.";
    if (!data.dokumen) g.dokumen = "Unggah satu dokumen legalitas usaha.";
    setGalat(g);
    if (Object.keys(g).length > 0) return;

    simpanPerusahaan(data);
    setData(ajukanVerifikasi(data.dokumen));
  }

  return (
    <div className="halaman">
      <NavPerusahaan />

      <main className="seksi halaman-perusahaan">
        <Link to="/perusahaan" className="tautan-kembali">
          &larr; Kembali ke dasbor
        </Link>
        <h1 className="seksi__judul">Verifikasi perusahaan</h1>
        <p className="akun__sub">
          Badge terverifikasi adalah alasan pencari kerja berani melamar tanpa
          bertanya-tanya. Kami memeriksa bahwa usaha kamu benar ada dan alamatnya
          cocok &mdash; bukan menilai bagus tidaknya lowongan kamu.
        </p>

        <section className={`kartu-status kartu-status--${status.nada}`}>
          <span className={`status status--${status.nada}`}>
            {data.status === "terverifikasi" && <Terverifikasi />}
            {status.label}
          </span>
          <p className="kartu-status__isi">{status.ringkas}</p>
        </section>

        {data.status === "diproses" ? (
          /* Setelah diajukan, form diganti — bukan dinonaktifkan. Form abu-abu
             yang tidak bisa disentuh membuat orang mengira ada yang rusak. */
          <div className="kotak-info">
            <h2 className="kotak-info__judul">Pengajuan kamu sudah masuk</h2>
            <p>
              Dokumen <strong>{potongNamaBerkas(data.dokumen?.nama || "")}</strong> sedang
              diperiksa. Sementara menunggu, lowongan kamu tetap bisa dipasang dan
              tetap tayang di peta.
            </p>
            <div className="tumpuk">
              <Link to="/perusahaan/pasang" className="tombol tombol--primary">
                Pasang lowongan sambil menunggu
              </Link>
              {/* Pintasan demo. Verifikasi sungguhan diputuskan admin lewat
                  tabel `verification_requests`; tombol ini ada supaya juri bisa
                  melihat keadaan "terverifikasi" tanpa menunggu satu hari. */}
              <button
                type="button"
                className="tombol tombol--sekunder"
                onClick={() => {
                  setData(setujuiVerifikasi());
                  navigate("/perusahaan");
                }}
              >
                Simulasikan admin menyetujui (demo)
              </button>
            </div>
          </div>
        ) : data.status === "terverifikasi" ? (
          <div className="kotak-info">
            <h2 className="kotak-info__judul">Perusahaan kamu sudah terverifikasi</h2>
            <p>
              Semua lowongan kamu &mdash; termasuk yang dipasang sebelum hari ini &mdash;
              sekarang membawa badge terverifikasi.
            </p>
            <Link to="/perusahaan/pasang" className="tombol tombol--primary">
              Pasang lowongan
            </Link>
          </div>
        ) : (
          <form className="form-pasang" onSubmit={kirim} noValidate>
            <div className="field">
              <label htmlFor="nama">Nama perusahaan</label>
              <input
                id="nama"
                value={data.nama || ""}
                className={galat.nama ? "salah" : ""}
                placeholder="Toko Sejahtera Kemayoran"
                disabled={terkunci}
                onChange={(e) => ubah({ nama: e.target.value })}
              />
              {galat.nama && <p className="field__bantu field__bantu--salah">{galat.nama}</p>}
            </div>

            <div className="field">
              <label htmlFor="bidang">Bidang usaha</label>
              <select
                id="bidang"
                value={data.bidang || ""}
                className={galat.bidang ? "salah" : ""}
                onChange={(e) => ubah({ bidang: e.target.value })}
              >
                <option value="">Pilih bidang&hellip;</option>
                {KATEGORI.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              {galat.bidang && <p className="field__bantu field__bantu--salah">{galat.bidang}</p>}
            </div>

            <div className="field">
              <label htmlFor="alamat-usaha">Alamat usaha</label>
              <input
                id="alamat-usaha"
                value={data.alamat || ""}
                className={galat.alamat ? "salah" : ""}
                placeholder="Jl. Kemayoran Gempol No. 12, Jakarta Pusat"
                onChange={(e) => ubah({ alamat: e.target.value })}
              />
              {galat.alamat && <p className="field__bantu field__bantu--salah">{galat.alamat}</p>}
            </div>

            <div className="field">
              <label htmlFor="telepon">Telepon yang bisa dihubungi</label>
              <input
                id="telepon"
                type="tel"
                inputMode="tel"
                value={data.telepon || ""}
                className={galat.telepon ? "salah" : ""}
                placeholder="081234567890"
                onChange={(e) => ubah({ telepon: e.target.value })}
              />
              <p className="field__bantu">
                Dipakai tim verifikasi kami, tidak ditampilkan ke pencari kerja.
              </p>
              {galat.telepon && <p className="field__bantu field__bantu--salah">{galat.telepon}</p>}
            </div>

            <div className="field">
              <label htmlFor="dokumen">Dokumen legalitas</label>
              <p className="field__bantu">
                Salah satu saja: NIB, SIUP, akta pendirian, atau surat keterangan
                usaha dari kelurahan. PDF, JPG, atau PNG &middot; maks 10 MB. Foto dari
                HP boleh, asal tulisannya terbaca.
              </p>

              {data.dokumen ? (
                <div className="berkas">
                  <span className="berkas__nama">{potongNamaBerkas(data.dokumen.nama)}</span>
                  <span className="berkas__ukuran">{formatMb(data.dokumen.ukuran)}</span>
                  <button
                    type="button"
                    className="tautan-aksi"
                    onClick={() => berkasRef.current?.click()}
                  >
                    Ganti
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="tombol tombol--sekunder"
                  onClick={() => berkasRef.current?.click()}
                >
                  Pilih berkas
                </button>
              )}
              <input
                ref={berkasRef}
                id="dokumen"
                type="file"
                className="sr-only"
                accept=".pdf,image/jpeg,image/png"
                onChange={pilihBerkas}
              />
              {galatBerkas && <p className="field__bantu field__bantu--salah">{galatBerkas}</p>}
              {galat.dokumen && <p className="field__bantu field__bantu--salah">{galat.dokumen}</p>}
            </div>

            <p className="auth__legal">
              Dengan mengirim, kamu menyatakan dokumen ini milik usaha kamu. Kami
              menyimpannya hanya untuk pemeriksaan legalitas, sesuai UU PDP No.
              27/2022, dan menghapusnya kalau akun kamu ditutup.
            </p>

            <div className="tumpuk">
              <button type="submit" className="tombol tombol--primary tombol--penuh tombol--besar">
                Kirim untuk diverifikasi
              </button>
              <button
                type="button"
                className="tombol tombol--sekunder tombol--penuh"
                onClick={() => {
                  // Yang sudah diisi tetap disimpan — "Nanti saja" bukan "Batal".
                  simpanPerusahaan(data);
                  navigate("/perusahaan");
                }}
              >
                Nanti saja
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
