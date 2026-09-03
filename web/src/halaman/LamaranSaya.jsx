import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavAkun from "../komponen-ui/NavAkun";
import { katalogLengkap } from "../lib/lowonganku";
import { bacaLamaran, batalkanLamaran, STATUS_LAMARAN } from "../lib/lamaran";
import { formatGaji } from "../lib/format";

/* Dibangun di dalam komponen, bukan sebagai konstanta modul: lowongan buatan
 * employer tersimpan di database dan bisa berubah selama sesi berjalan.
 * Konstanta modul akan membeku pada isi saat berkas pertama diimpor. */
async function bangunPeta() {
  return new Map((await katalogLengkap()).map((l) => [l.id, l]));
}

function tanggal(iso) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* Riwayat lamaran. Terbaru di atas: yang paling sering dicek orang adalah
 * lamaran yang baru saja dikirim. */
export default function LamaranSaya() {
  const [daftar, setDaftar] = useState([]);
  const [memuat, setMemuat] = useState(true);
  useEffect(() => {
    let batal = false;
    bacaLamaran()
      .then((d) => !batal && setDaftar(d))
      .catch(() => {}) // belum masuk: riwayat kosong, bukan galat
      .finally(() => !batal && setMemuat(false));
    return () => { batal = true; };
  }, []);
  const [petaLowongan, setPetaLowongan] = useState(() => new Map());
  useEffect(() => {
    let batal = false;
    bangunPeta().then((m) => !batal && setPetaLowongan(m));
    return () => { batal = true; };
  }, []);

  const urut = [...daftar].sort(
    (a, b) => new Date(b.dilamarPada) - new Date(a.dilamarPada)
  );

  return (
    <div className="halaman">
      <NavAkun />

      <main className="seksi akun">
        <h1 className="seksi__judul">Lamaran Saya</h1>

        {/* Memuat dibedakan dari kosong: pelamar berkoneksi lambat tak boleh
            membaca "belum ada lamaran" lalu mengira lamarannya hilang. */}
        {memuat ? (
          <p className="catatan" role="status">
            Memuat lamaran kamu…
          </p>
        ) : urut.length === 0 ? (
          <div className="kosong">
            <h2>Kamu belum melamar ke mana pun</h2>
            <p>
              Buka peta, pilih lowongan yang dekat rumahmu, lalu tekan &ldquo;Lamar
              Sekarang&rdquo;. Lamaran yang terkirim muncul di halaman ini.
            </p>
            <Link to="/peta" className="tombol tombol--primary">
              Cari lowongan di peta
            </Link>
          </div>
        ) : (
          <>
            <p className="akun__sub" role="status" aria-live="polite">
              <strong>{urut.length}</strong> lamaran terkirim.
            </p>
            <ul className="riwayat">
              {urut.map((l) => {
                const job = petaLowongan.get(l.lowonganId);
                const status = STATUS_LAMARAN[l.status] ?? STATUS_LAMARAN.terkirim;
                if (!job) return null;
                return (
                  <li key={l.id} className="riwayat__baris">
                    <div className="riwayat__utama">
                      <h2 className="riwayat__posisi">
                        <Link to={`/peta?lowongan=${job.id}`}>{job.posisi}</Link>
                      </h2>
                      <p className="riwayat__perusahaan">
                        {job.perusahaan}
                        {job.terverifikasi && (
                          <span className="badge badge--terverifikasi">
                            ✓ Terverifikasi
                          </span>
                        )}
                      </p>
                      <p className="riwayat__meta">
                        {job.alamat} · {formatGaji(job.gajiMin, job.gajiMax, job.tipe)}
                      </p>
                      <p className="riwayat__meta">
                        Dilamar {tanggal(l.dilamarPada)}
                      </p>
                    </div>

                    <div className="riwayat__aksi">
                      <span className={`status status--${status.nada}`}>
                        {status.label}
                      </span>
                      <button
                        type="button"
                        className="tautan-aksi tautan-aksi--rusak"
                        onClick={() =>
                          batalkanLamaran(l.lowonganId).then(setDaftar)
                        }
                      >
                        Batalkan lamaran
                      </button>
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
