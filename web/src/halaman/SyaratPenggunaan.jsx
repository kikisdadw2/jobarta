import { Link } from "react-router-dom";
import HalamanLegal from "../komponen-ui/HalamanLegal";
import { EMAIL_KONTAK, mailto } from "../lib/kontak";

/* Syarat Penggunaan.
 *
 * 🔴 Ditulis untuk dibaca pencari kerja harian di Jakarta, bukan untuk
 *    melindungi kami dari mereka. Kalimatnya pendek, tanpa "pihak pertama /
 *    pihak kedua", dan setiap larangan menyebut alasannya. Syarat yang tidak
 *    dimengerti tidak mengubah perilaku siapa pun — ia cuma hiasan hukum.
 *
 * 🔴 Yang TIDAK dijanjikan di sini juga disengaja: JOBARTA tidak menjamin
 *    lowongannya asli. Kami memverifikasi sebagian perusahaan dan menandainya,
 *    tapi menjanjikan lebih dari itu akan membuat orang menurunkan kewaspadaan
 *    justru di tempat penipuan kerja paling sering terjadi.
 */
export default function SyaratPenggunaan() {
  return (
    <HalamanLegal
      judul="Syarat Penggunaan"
      ringkas={
        <ul>
          <li>JOBARTA gratis untuk pencari kerja. Kami tidak pernah memungut biaya melamar.</li>
          <li>
            Kami <strong>tidak menjamin</strong> semua lowongan asli. Tanda
            &ldquo;Terverifikasi&rdquo; berarti kami sudah memeriksa dokumen
            perusahaannya — yang tanpa tanda itu belum diperiksa.
          </li>
          <li>Jangan pasang lowongan palsu, dan jangan minta uang dari pelamar.</li>
          <li>Kamu boleh berhenti dan menghapus akunmu kapan saja.</li>
        </ul>
      }
    >
      <h2>1. Yang JOBARTA lakukan</h2>
      <p>
        JOBARTA mempertemukan pencari kerja di Jakarta dengan lowongan di sekitarnya,
        lewat peta. Kami <strong>bukan</strong> agen penyalur tenaga kerja dan bukan
        pihak dalam hubungan kerja antara kamu dan perusahaan. Kami menyediakan
        tempatnya bertemu; perjanjian kerjanya urusan kalian berdua.
      </p>

      <h2>2. Akun</h2>
      <ul>
        <li>Kamu harus berusia 18 tahun ke atas.</li>
        <li>Satu orang, satu akun. Isi datamu dengan benar.</li>
        <li>
          Jaga passwordmu. Kalau kamu mendaftar tanpa email pemulihan, akun yang
          passwordnya lupa <strong>tidak bisa kami pulihkan</strong> — bukan karena kami
          tidak mau, tapi karena tidak ada cara memastikan kamu pemiliknya.
        </li>
      </ul>

      <h2>3. Tidak ada biaya melamar</h2>
      <p>
        <strong>JOBARTA tidak pernah meminta biaya apa pun untuk melamar</strong>, dan
        perusahaan yang benar juga tidak. Kalau ada yang meminta uang — untuk seragam,
        pelatihan, administrasi, atau apa pun — dengan alasan lowongan di JOBARTA, itu
        penipuan.
      </p>
      <p>
        Laporkan lewat tombol <strong>&ldquo;Laporkan Lowongan Ini&rdquo;</strong> di
        halaman lowongannya, atau kirim langsung ke{" "}
        <a href={mailto("Laporan penipuan lowongan")}>{EMAIL_KONTAK}</a>.
      </p>

      <h2>4. Yang tidak boleh dilakukan</h2>
      <ul>
        <li>
          <strong>Memasang lowongan yang tidak ada</strong> atau memakai nama perusahaan
          orang lain.
        </li>
        <li>
          <strong>Meminta uang dari pelamar</strong> dengan alasan apa pun.
        </li>
        <li>
          <strong>Meminta dokumen pribadi berlebihan</strong> di tahap awal — KTP, KK,
          nomor rekening, atau ijazah asli tidak dibutuhkan untuk sekadar melamar.
        </li>
        <li>
          <strong>Memasang iklan yang mendiskriminasi</strong> berdasarkan suku, agama,
          ras, atau hal lain yang tidak berhubungan dengan kemampuan kerja.
        </li>
        <li>
          <strong>Mengambil data pengguna secara otomatis</strong> (scraping) atau
          mencoba membobol sistem.
        </li>
      </ul>
      <p>
        Akun yang melanggar bisa kami nonaktifkan. Untuk pelanggaran berat — terutama
        yang merugikan pencari kerja secara finansial — kami nonaktifkan tanpa
        peringatan lebih dulu.
      </p>

      <h2>5. Soal isi lowongan</h2>
      <p>
        Lowongan ditulis oleh perusahaan yang memasangnya, bukan oleh kami. Kami tidak
        memeriksa satu per satu kebenaran gaji, jam kerja, atau syarat yang tertulis di
        dalamnya.
      </p>
      <p>
        Tanda <strong>&ldquo;Terverifikasi&rdquo;</strong> berarti kami sudah memeriksa
        dokumen legalitas perusahaannya. Itu saja — bukan jaminan bahwa isi lowongannya
        akurat atau bahwa kamu akan diperlakukan baik. Lowongan tanpa tanda itu belum
        kami periksa sama sekali.
      </p>
      <p>
        Karena itu: tetap hati-hati, jangan pernah mengirim uang, dan jangan menyerahkan
        dokumen asli sebelum kamu yakin.
      </p>

      <h2>6. Batas tanggung jawab</h2>
      <p>
        JOBARTA disediakan apa adanya. Kami berusaha menjaganya tetap berjalan dan
        datanya benar, tapi kami tidak bertanggung jawab atas kerugian yang timbul dari
        hubungan kerja atau kesepakatan antara kamu dan perusahaan — termasuk kalau
        lowongannya ternyata palsu.
      </p>
      <p>
        Ini bukan cara kami lepas tangan: kalau kamu melaporkan lowongan bermasalah,
        kami tindak lanjuti dan turunkan. Tapi kami perlu jujur bahwa kami tidak bisa
        memeriksa setiap lowongan sebelum tayang.
      </p>

      <h2>7. Berhenti memakai JOBARTA</h2>
      <p>
        Kamu boleh berhenti kapan saja. Untuk menghapus akun beserta datanya, kirim
        permintaan ke <a href={mailto("Permintaan hapus akun")}>{EMAIL_KONTAK}</a>. Cara
        kami memperlakukan data setelah itu dijelaskan di{" "}
        <Link to="/kebijakan-privasi">Kebijakan Privasi</Link>.
      </p>

      <h2>8. Perubahan syarat</h2>
      <p>
        Kalau syarat ini berubah, tanggal di atas kami majukan dan kami beri tahu di
        aplikasi. Perubahan tidak berlaku surut untuk hal yang sudah terjadi sebelumnya.
      </p>

      <h2>9. Hukum yang berlaku</h2>
      <p>
        Syarat ini tunduk pada hukum Republik Indonesia. Kalau ada perselisihan, kami
        lebih memilih menyelesaikannya lewat musyawarah — tulis dulu ke{" "}
        <a href={mailto("Penyelesaian perselisihan")}>{EMAIL_KONTAK}</a> sebelum menempuh
        jalur lain.
      </p>
    </HalamanLegal>
  );
}
