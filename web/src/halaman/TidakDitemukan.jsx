import { Link, useLocation } from "react-router-dom";
import { Logo } from "../komponen-ui/Dasar";

/* Halaman 404.
 *
 * 🔴 Sebelumnya rute `*` diam-diam melempar ke beranda. Itu terlihat rapi,
 *    tapi menyesatkan: orang yang menekan tautan lama atau salah ketik satu
 *    huruf mendarat di beranda dan mengira tautannya BERHASIL — lalu bingung
 *    kenapa isinya bukan yang ia cari. Pengalihan diam-diam menghapus
 *    informasi yang justru dibutuhkan orang untuk memperbaiki langkahnya.
 *
 * Nadanya sama dengan sisa produk: menyebut apa yang terjadi, lalu menawarkan
 * langkah berikutnya. Bukan lelucon, bukan menyalahkan.
 */
export default function TidakDitemukan() {
  const lokasi = useLocation();

  return (
    <main className="auth__utama">
      <div className="auth__kotak kotak-tunggu">
        <Logo ukuran={44} />

        <h1 className="auth__judul">Halaman ini tidak ada</h1>
        <p className="auth__sub">
          Alamat yang kamu buka tidak kami kenali. Mungkin tautannya sudah lama, atau ada
          satu huruf yang keliru.
        </p>

        {/* Alamat yang gagal ditampilkan apa adanya: orang bisa melihat sendiri
            salah ketiknya, dan yang melaporkan punya sesuatu untuk disalin. */}
        <p className="tidak-ada__alamat">
          <code>{lokasi.pathname}</code>
        </p>

        <div className="auth__tombol">
          {/* Peta jadi aksi utama, bukan beranda: yang dicari orang di JOBARTA
              adalah lowongan, dan peta membawanya ke sana dalam satu langkah. */}
          <Link to="/peta" className="tombol tombol--primary tombol--penuh tombol--besar">
            Cari lowongan di peta
          </Link>
          <Link to="/" className="tombol tombol--sekunder tombol--penuh">
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
