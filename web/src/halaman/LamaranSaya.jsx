import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavAkun from "../komponen-ui/NavAkun";
import { katalogLengkap } from "../lib/lowonganku";
import { bacaLamaran, batalkanLamaran, STATUS_LAMARAN } from "../lib/lamaran";
import { formatGaji } from "../lib/format";
import { IkonKosong } from "../komponen-ui/Dasar";
import KerangkaDaftar from "../komponen-ui/KerangkaDaftar";

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
  /* 🔴 Katalog punya keadaan memuat SENDIRI, dan itu bukan detail sepele.
     Dua pengambilan ini berjalan paralel; kalau daftar lamaran tiba lebih
     dulu, katalog masih Map kosong dan SETIAP baris gagal dicocokkan. Tanpa
     penanda ini halaman sempat menampilkan "3 lamaran terkirim" di atas
     daftar yang benar-benar kosong — pelamar membaca itu sebagai lamarannya
     hilang. */
  const [memuatKatalog, setMemuatKatalog] = useState(true);
  useEffect(() => {
    let batal = false;
    bangunPeta()
      .then((m) => !batal && setPetaLowongan(m))
      .catch(() => {})
      .finally(() => !batal && setMemuatKatalog(false));
    return () => { batal = true; };
  }, []);

  const urut = [...daftar].sort(
    (a, b) => new Date(b.dilamarPada) - new Date(a.dilamarPada)
  );

  /* Lamaran yang lowongannya sudah tidak tayang DIHITUNG, bukan dibuang
     diam-diam. Versi lama memakai `if (!job) return null` di tengah map:
     angka di atas daftar tetap menghitungnya, barisnya tidak pernah muncul,
     dan selisihnya tidak pernah dijelaskan. Pola yang sama sudah diperbaiki
     lebih dulu di /tersimpan; ini menyusul. */
  const tampil = urut.filter((l) => petaLowongan.has(l.lowonganId));
  const hilang = urut.length - tampil.length;

  return (
    <div className="halaman">
      <NavAkun />

      <main className="seksi akun">
        <h1 className="seksi__judul">Lamaran Saya</h1>

        {/* Memuat dibedakan dari kosong: pelamar berkoneksi lambat tak boleh
            membaca "belum ada lamaran" lalu mengira lamarannya hilang. */}
        {memuat || memuatKatalog ? (
          <KerangkaDaftar label="Memuat lamaran kamu" />
        ) : urut.length === 0 ? (
          <div className="kosong">
            <IkonKosong />
            <h2>Kamu belum melamar ke mana pun</h2>
            <p>
              Buka peta, pilih lowongan yang dekat rumahmu, lalu tekan &ldquo;Lamar
              Sekarang&rdquo;. Lamaran yang terkirim muncul di halaman ini.
            </p>
            <Link to="/peta" className="tombol tombol--primary">
              Cari lowongan di peta
            </Link>
          </div>
        ) : tampil.length === 0 ? (
          /* Semua lamaran ada, tapi lowongannya sudah ditutup semua. Ini BUKAN
             "belum pernah melamar" — menyangkal ingatan orang membuat aplikasi
             terasa rusak. Sama seperti pembedaan di /tersimpan. */
          <div className="kosong">
            <IkonKosong />
            <h2>Lowongan yang kamu lamar sudah tidak tayang</h2>
            <p>
              {hilang === 1 ? "Satu lamaran" : `${hilang} lamaran`} kamu tercatat, tapi
              lowongannya sudah ditutup atau dihapus perusahaannya. Riwayatnya tetap
              aman — hanya halaman lowongannya yang hilang.
            </p>
            <Link to="/peta" className="tombol tombol--primary">
              Cari lowongan baru di peta
            </Link>
          </div>
        ) : (
          <>
            <p className="akun__sub" role="status" aria-live="polite">
              <strong>{tampil.length}</strong> lamaran terkirim.
              {hilang > 0 &&
                ` ${hilang} lainnya lowongannya sudah tidak tayang.`}
            </p>
            <ul className="riwayat">
              {tampil.map((l) => {
                const job = petaLowongan.get(l.lowonganId);
                const status = STATUS_LAMARAN[l.status] ?? STATUS_LAMARAN.terkirim;
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
