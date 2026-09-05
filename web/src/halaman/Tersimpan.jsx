import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavAkun from "../komponen-ui/NavAkun";
import { katalogLengkap } from "../lib/lowonganku";
import { bacaSimpanan, togglSimpanan } from "../lib/simpanan";
import { formatGaji } from "../lib/format";
import { IkonKosong } from "../komponen-ui/Dasar";
import KerangkaDaftar from "../komponen-ui/KerangkaDaftar";

/* Lowongan tersimpan.
 *
 * 🔴 Kenapa halaman ini baru ada sekarang: tombol "Simpan Lowongan" di
 *    PanelDetail sudah bekerja sejak lama — menulis id ke localStorage — tapi
 *    tidak pernah ada layar yang menampilkan hasilnya. Menyimpan sesuatu ke
 *    tempat yang tidak bisa dibuka bukan fitur, itu tombol yang berbohong.
 *
 * Susunannya sengaja meniru LamaranSaya: keduanya daftar riwayat milik
 * pengguna, dan orang yang sudah paham satu halaman tidak perlu belajar ulang.
 */

/* Sama seperti LamaranSaya: dibangun di dalam efek, bukan konstanta modul,
 * karena lowongan buatan employer bisa bertambah selama sesi berjalan. */
async function bangunPeta() {
  return new Map((await katalogLengkap()).map((l) => [l.id, l]));
}

/**
 * Pisahkan lowongan tersimpan yang MASIH tayang dari yang sudah menguap —
 * employer menghapusnya, atau masa tayangnya habis.
 *
 * @param {string[]} idTersimpan  id dari localStorage, urutan penyimpanan
 * @param {Map<string, object>} katalog  lowongan yang masih ada
 * @returns {{ tampil: object[], hilang: number }}
 *
 * 🔴 Yang hilang DIHITUNG, bukan cuma dibuang. Menyaringnya diam-diam adalah
 *    yang paling enak dilihat dan paling menyesatkan: orang yang menyimpan 5
 *    lowongan lalu membuka halaman ini dan melihat 3 akan menyimpulkan
 *    aplikasinya kehilangan simpanannya — padahal yang terjadi justru wajar.
 *    Selisih angka yang tidak dijelaskan selalu dibaca sebagai kerusakan.
 *
 *    `LamaranSaya.jsx` dulu menyaring diam-diam dengan `if (!job) return null`.
 *    Utang itu dibayar 2026-09-05 — kedua halaman kini menghitung dan
 *    menjelaskan yang hilang, lengkap dengan kalimat kosong yang berbeda
 *    untuk "belum pernah" dan "sudah tidak tayang".
 *
 * 🔴 Kartu redup bertanda "sudah tidak tayang" sempat dipertimbangkan dan
 *    ditolak: lowongan harian di Jakarta cepat sekali hilang, jadi daftar
 *    orang yang rajin menyimpan akan lebih banyak berisi bangkai daripada
 *    lowongan yang bisa dilamar. Satu kalimat cukup.
 */
function saringHilang(idTersimpan, katalog) {
  /* Terbaru dulu — sama dengan LamaranSaya. Set localStorage menyimpan urutan
     masuk, jadi yang paling akhir disimpan ada di ujung. */
  const urut = [...idTersimpan].reverse();
  const tampil = urut.map((id) => katalog.get(id)).filter(Boolean);
  return { tampil, hilang: urut.length - tampil.length };
}

export default function Tersimpan() {
  const [ids, setIds] = useState(() => [...bacaSimpanan()]);
  const [katalog, setKatalog] = useState(() => new Map());
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    let batal = false;
    bangunPeta()
      .then((m) => !batal && setKatalog(m))
      .catch(() => {})
      .finally(() => !batal && setMemuat(false));
    return () => {
      batal = true;
    };
  }, []);

  const { tampil, hilang } = saringHilang(ids, katalog);

  function hapus(id) {
    setIds([...togglSimpanan(id)]);
  }

  return (
    <div className="halaman">
      <NavAkun />

      <main className="seksi akun">
        <h1 className="seksi__judul">Lowongan Tersimpan</h1>

        {/* Memuat dibedakan dari kosong, alasannya sama dengan LamaranSaya:
            koneksi lambat tidak boleh terbaca sebagai data yang hilang. */}
        {memuat ? (
          <KerangkaDaftar label="Memuat lowongan tersimpan" />
        ) : tampil.length === 0 ? (
          /* Dua sebab kosong, dua kalimat berbeda. Orang yang simpanannya
             kedaluwarsa semua tidak boleh dibilang "belum pernah menyimpan" —
             ia ingat betul pernah menyimpan, dan kalimat yang menyangkal
             ingatannya membuat aplikasi terasa rusak. */
          <div className="kosong">
            <IkonKosong />
            {hilang > 0 ? (
              <>
                <h2>Lowongan simpananmu sudah tidak tayang</h2>
                <p>
                  {hilang === 1 ? "Satu lowongan" : `${hilang} lowongan`} yang kamu
                  simpan sudah ditutup atau dihapus perusahaannya. Lowongan harian
                  memang cepat berganti — coba lihat yang baru di peta.
                </p>
              </>
            ) : (
              <>
                <h2>Belum ada lowongan tersimpan</h2>
                <p>
                  Saat menemukan lowongan menarik tapi belum siap melamar — misalnya
                  CV-mu ada di komputer — tekan &ldquo;Simpan Lowongan&rdquo; di panel
                  detailnya. Semuanya berkumpul di sini.
                </p>
              </>
            )}
            <Link to="/peta" className="tombol tombol--primary">
              Cari lowongan di peta
            </Link>
          </div>
        ) : (
          <>
            <p className="akun__sub" role="status" aria-live="polite">
              <strong>{tampil.length}</strong> lowongan tersimpan.
              {hilang > 0 &&
                ` ${hilang} lainnya sudah tidak tayang lagi.`}
            </p>
            <ul className="riwayat">
              {tampil.map((job) => (
                <li key={job.id} className="riwayat__baris">
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
                      {job.alamat} ·{" "}
                      {formatGaji(job.gajiMin, job.gajiMax, job.tipe)}
                    </p>
                  </div>

                  <div className="riwayat__aksi">
                    <Link
                      to={`/peta?lowongan=${job.id}`}
                      className="tombol tombol--primary"
                    >
                      Lihat &amp; lamar
                    </Link>
                    <button
                      type="button"
                      className="tautan-aksi tautan-aksi--rusak"
                      onClick={() => hapus(job.id)}
                    >
                      Hapus dari simpanan
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
