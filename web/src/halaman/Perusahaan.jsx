import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import NavPerusahaan from "../komponen-ui/NavPerusahaan";
import { Terverifikasi } from "../komponen-ui/Dasar";
import { bacaLowonganku, perbaruiLowongan, hapusLowongan } from "../lib/lowonganku";
import { bacaPerusahaan, STATUS_VERIFIKASI } from "../lib/perusahaan";
import { bacaLamaran } from "../lib/lamaran";
import { formatGaji } from "../lib/format";

/* Dasbor perusahaan — halaman pertama yang dilihat employer setiap kali masuk.
 *
 * Urutannya sengaja: STATUS VERIFIKASI di atas, baru daftar lowongan. Verifikasi
 * adalah satu-satunya hal di layar ini yang punya tenggat dan menghalangi
 * kepercayaan; lowongan bisa dikerjakan kapan saja. Kartu yang paling menuntut
 * tindakan diletakkan di tempat mata jatuh pertama kali.
 */
function tanggal(iso) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Perusahaan() {
  const [param] = useSearchParams();
  const [daftar, setDaftar] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState(null);

  useEffect(() => {
    let batal = false;
    bacaLowonganku()
      .then((d) => !batal && setDaftar(d))
      .catch(() => !batal && setGalat("Daftar lowongan belum bisa dimuat. Periksa koneksi lalu muat ulang."))
      .finally(() => !batal && setMemuat(false));
    return () => { batal = true; };
  }, []);

  /* Setiap aksi mengembalikan daftar TERBARU dari server, bukan hasil tebakan
   * di klien. Sedikit lebih lambat, tapi dasbor tidak pernah menampilkan
   * keadaan yang berbeda dari isi database. */
  async function jalankan(aksi) {
    setGalat(null);
    try {
      setDaftar(await aksi());
    } catch {
      setGalat("Perubahan belum tersimpan. Periksa koneksi lalu coba lagi.");
    }
  }
  const [konfirmasi, setKonfirmasi] = useState(null); // id yang menunggu konfirmasi hapus
  const perusahaan = bacaPerusahaan();
  const status = STATUS_VERIFIKASI[perusahaan.status] ?? STATUS_VERIFIKASI.belum;

  /* Jumlah pelamar dihitung dari lamaran yang tersimpan di perangkat ini.
   * Di produksi angkanya datang dari `applications` milik server; bentuk yang
   * dibaca komponen tidak berubah. */
  const lamaran = bacaLamaran();
  function pelamar(idLowongan) {
    return lamaran.filter((l) => l.lowonganId === idLowongan).length;
  }

  const urut = [...daftar].sort(
    (a, b) => new Date(b.dibuatPada) - new Date(a.dibuatPada)
  );
  const aktif = urut.filter((l) => l.aktif !== false).length;

  return (
    <div className="halaman">
      <NavPerusahaan />

      <main className="seksi perusahaan">
        <h1 className="seksi__judul">
          {perusahaan.nama ? perusahaan.nama : "Dasbor perusahaan"}
        </h1>

        {param.get("baru") === "1" && (
          <p className="catatan catatan--sukses" role="status">
            Lowongan kamu sudah tayang di peta.{" "}
            <Link to="/peta">Lihat dari sisi pencari kerja</Link>
          </p>
        )}

        {/* ---------- Kartu status verifikasi ---------- */}
        <section className={`kartu-status kartu-status--${status.nada}`}>
          <div className="kartu-status__kepala">
            <span className={`status status--${status.nada}`}>
              {perusahaan.status === "terverifikasi" && <Terverifikasi />}
              {status.label}
            </span>
            {perusahaan.diverifikasiPada && (
              <span className="kartu-status__tanggal">
                Diperiksa {tanggal(perusahaan.diverifikasiPada)}
              </span>
            )}
          </div>
          <p className="kartu-status__isi">{status.ringkas}</p>
          {perusahaan.alasanTolak && (
            <p className="field__bantu field__bantu--salah">{perusahaan.alasanTolak}</p>
          )}
          {perusahaan.status !== "terverifikasi" && (
            <Link to="/perusahaan/verifikasi" className="tombol tombol--primary">
              {perusahaan.status === "diproses" ? "Lihat pengajuan" : "Ajukan verifikasi"}
            </Link>
          )}
        </section>

        {/* ---------- Daftar lowongan ---------- */}
        <div className="seksi__kepala">
          <h2 className="seksi__judul">Lowongan kamu</h2>
          <Link to="/perusahaan/pasang" className="tombol tombol--primary">
            + Pasang lowongan
          </Link>
        </div>

        {galat && (
          <p className="catatan catatan--rusak" role="alert">
            {galat}
          </p>
        )}

        {/* Keadaan memuat dibedakan dari keadaan kosong. Tanpa pemisahan ini,
            employer yang koneksinya lambat akan membaca "Belum ada lowongan
            yang kamu pasang" — dan mengira kerjanya hilang. */}
        {memuat ? (
          <p className="catatan" role="status">
            Memuat lowongan kamu…
          </p>
        ) : urut.length === 0 ? (
          <div className="kosong">
            <h3>Belum ada lowongan yang kamu pasang</h3>
            <p>
              Pasang satu lowongan dan ia langsung muncul sebagai pin di peta
              JOBARTA. Kamu tidak perlu menunggu verifikasi selesai untuk memulai.
            </p>
            <Link to="/perusahaan/pasang" className="tombol tombol--primary">
              Pasang lowongan pertama
            </Link>
          </div>
        ) : (
          <>
            <p className="akun__sub" role="status" aria-live="polite">
              <strong>{aktif}</strong> lowongan tayang dari {urut.length} yang kamu buat.
            </p>
            <ul className="riwayat">
              {urut.map((l) => {
                const jumlah = pelamar(l.id);
                return (
                  <li key={l.id} className="riwayat__baris">
                    <div className="riwayat__utama">
                      <h3 className="riwayat__posisi">
                        <Link to={`/peta?lowongan=${l.id}`}>{l.posisi}</Link>
                      </h3>
                      <p className="riwayat__meta">
                        {l.kategori} &middot; {l.tipe} &middot;{" "}
                        {formatGaji(l.gajiMin, l.gajiMax, l.tipe)}
                      </p>
                      <p className="riwayat__meta">{l.alamat}</p>
                      <p className="riwayat__meta">
                        Dipasang {tanggal(l.dibuatPada)} &middot;{" "}
                        {/* Nol pelamar ditulis sebagai kalimat, bukan "0 pelamar".
                            Angka nol di dasbor terbaca seperti kegagalan; yang
                            sebenarnya terjadi biasanya cuma "masih baru". */}
                        {jumlah === 0 ? "Belum ada pelamar" : `${jumlah} pelamar`}
                      </p>
                    </div>

                    <div className="riwayat__aksi">
                      <span className={`status status--${l.aktif === false ? "netral" : "sukses"}`}>
                        {l.aktif === false ? "Ditutup" : "Tayang"}
                      </span>
                      <Link to={`/perusahaan/pasang/${l.id}`} className="tautan-aksi">
                        Ubah
                      </Link>
                      <button
                        type="button"
                        className="tautan-aksi"
                        onClick={() =>
                          jalankan(() =>
                            perbaruiLowongan(l.id, { aktif: l.aktif === false })
                          )
                        }
                      >
                        {l.aktif === false ? "Tayangkan lagi" : "Tutup lowongan"}
                      </button>

                      {/* Hapus butuh konfirmasi DI TEMPAT, bukan window.confirm:
                          dialog bawaan browser memblokir seluruh halaman dan
                          tidak bisa diberi kalimat yang menjelaskan akibatnya. */}
                      {konfirmasi === l.id ? (
                        <span className="riwayat__konfirmasi">
                          Hapus permanen?
                          <button
                            type="button"
                            className="tautan-aksi tautan-aksi--rusak"
                            onClick={() => {
                              jalankan(() => hapusLowongan(l.id));
                              setKonfirmasi(null);
                            }}
                          >
                            Ya, hapus
                          </button>
                          <button
                            type="button"
                            className="tautan-aksi"
                            onClick={() => setKonfirmasi(null)}
                          >
                            Batal
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="tautan-aksi tautan-aksi--rusak"
                          onClick={() => setKonfirmasi(l.id)}
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
