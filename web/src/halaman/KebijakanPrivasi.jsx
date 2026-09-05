import { Link } from "react-router-dom";
import HalamanLegal from "../komponen-ui/HalamanLegal";
import { EMAIL_KONTAK, mailto } from "../lib/kontak";

/* Kebijakan Privasi — disusun untuk UU No. 27 Tahun 2022 (PDP).
 *
 * 🔴 Isinya ditulis dari KODE, bukan dari template. Setiap kalimat di sini
 *    bisa ditelusuri ke berkas yang benar-benar menyimpan datanya, dan itu
 *    disengaja: kebijakan privasi yang menjanjikan LEBIH SEDIKIT daripada
 *    yang dilakukan aplikasi adalah pelanggaran, dan yang menjanjikan lebih
 *    banyak akan basi begitu satu fitur berubah.
 *
 *    Kalau data yang dikumpulkan berubah, halaman ini ikut berubah — dan
 *    TERAKHIR_DIPERBARUI di lib/kontak.js ikut dimajukan.
 */
export default function KebijakanPrivasi() {
  const badanPermintaan = [
    "Halo JOBARTA,",
    "",
    "Saya ingin menggunakan hak saya atas data pribadi.",
    "",
    "Username saya:",
    "Yang saya minta (salinan data / pembetulan / penarikan persetujuan / penghapusan):",
    "",
    "Terima kasih.",
  ].join("\n");

  return (
    <HalamanLegal
      judul="Kebijakan Privasi"
      ringkas={
        <ul>
          <li>
            <strong>Lokasi presisimu tidak pernah dikirim ke server kami.</strong> Ia
            dipakai di dalam peramban untuk menghitung jarak, lalu hilang saat tab
            ditutup.
          </li>
          <li>
            Yang kami simpan: username, password (terenkripsi), dan isian profil yang
            kamu tulis sendiri.
          </li>
          <li>Kami tidak menjual datamu dan tidak memasang iklan pelacak.</li>
          <li>
            Kamu bisa menarik persetujuan dan meminta akun beserta datanya dihapus,
            kapan saja.
          </li>
        </ul>
      }
    >
      <h2>1. Siapa kami</h2>
      <p>
        JOBARTA adalah platform pencarian kerja berbasis peta untuk wilayah Jakarta.
        Untuk keperluan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, kami
        bertindak sebagai <strong>Pengendali Data Pribadi</strong> atas data yang
        dijelaskan di halaman ini. Kanal resmi kami satu:{" "}
        <a href={mailto("Pertanyaan tentang data pribadi")}>{EMAIL_KONTAK}</a>.
      </p>

      <h2>2. Data yang kami kumpulkan</h2>

      <h3>2.1 Saat kamu membuat akun</h3>
      <ul>
        <li>
          <strong>Username dan password.</strong> Password tidak pernah kami simpan
          dalam bentuk terbaca — ia disimpan terenkripsi oleh penyedia autentikasi
          kami dan tidak bisa kami lihat.
        </li>
        <li>
          <strong>Email pemulihan (opsional).</strong> Kalau kamu tidak mengisinya,
          sistem membuat alamat internal yang tidak bisa menerima surat, semata agar
          akunmu punya penanda unik. Tanpa email pemulihan, akun yang passwordnya lupa{" "}
          <strong>tidak bisa dipulihkan</strong> — tidak ada cara lain bagi kami
          memastikan kamu pemiliknya.
        </li>
      </ul>

      <h3>2.2 Kalau kamu masuk dengan Google</h3>
      <p>
        Kami menerima <strong>alamat email, nama, dan foto profil</strong> dari akun
        Google-mu. Kami tidak pernah menerima password Google-mu dan tidak bisa membaca
        isi Gmail, Drive, atau layanan Google lainnya.
      </p>
      <p>
        Perlu kamu ketahui: data itu sudah masuk ke sistem kami begitu kamu menekan
        &ldquo;Lanjutkan dengan Google&rdquo;, yaitu <em>sebelum</em> kamu sempat
        menyetujui kebijakan ini. Karena itu, kalau kamu menolak persetujuan di langkah
        berikutnya, akunmu tidak diaktifkan dan kami menawarkan penghapusan data yang
        sudah terlanjur tersimpan.
      </p>

      <h3>2.3 Isi profil</h3>
      <p>
        Nama lengkap, domisili, foto profil, dan keterangan berkas CV — semuanya kamu
        isi sendiri dan semuanya opsional. Kamu bisa memakai JOBARTA tanpa mengisi satu
        pun.
      </p>

      <h3>2.4 Lokasi presisi</h3>
      <p>
        Halaman peta meminta izin lokasi lewat peramban. Kalau kamu mengizinkan,
        koordinat GPS-mu dipakai untuk dua hal saja: menggeser peta ke posisimu, dan
        menghitung jarak ke tiap lowongan.
      </p>
      <p>
        <strong>
          Koordinat itu tidak pernah dikirim ke server kami dan tidak pernah kami
          simpan.
        </strong>{" "}
        Ia hidup di dalam tab peramban yang sedang terbuka dan hilang begitu tab
        ditutup. Kamu bisa mencabut izinnya kapan saja lewat setelan situs di peramban,
        dan JOBARTA tetap berfungsi — hanya jaraknya yang tidak lagi dihitung.
      </p>

      <h3>2.5 Aktivitas di aplikasi</h3>
      <ul>
        <li>
          <strong>Lamaran</strong> yang kamu kirim — lowongan mana dan kapan. Ini
          tersimpan di server kami karena perusahaan pemasang lowongan memang perlu
          melihatnya.
        </li>
        <li>
          <strong>Lowongan tersimpan</strong> — hanya di perangkatmu, tidak dikirim ke
          mana pun.
        </li>
        <li>
          <strong>Catatan persetujuan</strong> — kapan kamu menyetujui kebijakan ini dan
          di layar mana. UU PDP mewajibkan kami bisa membuktikannya.
        </li>
      </ul>

      <h2>3. Dasar pemrosesan</h2>
      <ul>
        <li>
          <strong>Persetujuanmu</strong> (Pasal 20 ayat 2 huruf a) — untuk isi profil,
          lokasi presisi, dan data dari akun Google.
        </li>
        <li>
          <strong>Pelaksanaan perjanjian</strong> (huruf b) — untuk akun, autentikasi,
          dan pengiriman lamaran. Tanpa ini layanannya tidak bisa berjalan sama sekali.
        </li>
      </ul>
      <p>
        Persetujuan kami minta di dua titik: pada <strong>form pendaftaran</strong> bagi
        yang mendaftar dengan username, dan pada <strong>layar onboarding</strong> bagi
        yang masuk dengan Google. Keduanya dicatat lengkap dengan waktunya.
      </p>

      <h2>4. Siapa yang bisa melihat datamu</h2>
      <ul>
        <li>
          <strong>Perusahaan yang lowongannya kamu lamar</strong> melihat nama, isi
          profil, dan CV yang kamu lampirkan. Ini terjadi hanya setelah kamu menekan
          &ldquo;Lamar Sekarang&rdquo; — tidak ada perusahaan yang bisa menelusuri
          daftar pelamar potensial.
        </li>
        <li>
          <strong>Penyedia infrastruktur</strong> kami (layanan basis data dan hosting)
          menyimpan data atas nama kami dan terikat menjaganya.
        </li>
        <li>
          <strong>Peta</strong> digambar dengan data OpenStreetMap. Permintaan gambar
          peta membawa alamat IP-mu ke penyedia ubin peta, sebagaimana kunjungan ke
          situs mana pun.
        </li>
      </ul>
      <p>
        <strong>Kami tidak menjual data pribadimu kepada siapa pun</strong>, dan tidak
        memasang iklan berbasis pelacakan.
      </p>

      <h2>5. Berapa lama disimpan</h2>
      <ul>
        <li>
          <strong>Akun dan profil</strong> — selama akunmu aktif.
        </li>
        <li>
          <strong>Riwayat lamaran</strong> — selama akunmu aktif, agar kamu bisa memantau
          balasannya.
        </li>
        <li>
          <strong>Setelah permintaan hapus</strong> — data dihapus dalam waktu paling
          lama <strong>30 hari</strong>. Tenggang itu ada supaya penghapusan yang tidak
          sengaja masih bisa dibatalkan.
        </li>
        <li>
          <strong>Lokasi presisi</strong> — tidak ada masa simpan, karena tidak pernah
          disimpan.
        </li>
      </ul>

      <h2>6. Hakmu</h2>
      <p>UU PDP memberimu hak untuk:</p>
      <ul>
        <li>mengetahui data apa yang kami punya tentangmu, dan meminta salinannya;</li>
        <li>
          membetulkan data yang keliru — sebagian bisa kamu ubah sendiri di{" "}
          <Link to="/profil">halaman Profil</Link>;
        </li>
        <li>menarik persetujuan;</li>
        <li>meminta datamu dihapus;</li>
        <li>mengajukan keberatan atas cara kami memproses datamu.</li>
      </ul>
      <p>
        Untuk menggunakan hak-hak itu, kirim surat ke{" "}
        <a href={mailto("Permintaan hak atas data pribadi", badanPermintaan)}>
          {EMAIL_KONTAK}
        </a>
        . Kami menjawab paling lama <strong>3&times;24 jam</strong> pada hari kerja.
      </p>

      <h2>7. Cara mencabut persetujuan</h2>
      <ul>
        <li>
          <strong>Lokasi:</strong> matikan izin lokasi lewat ikon gembok di bilah alamat
          peramban. Berlaku seketika.
        </li>
        <li>
          <strong>Isi profil:</strong> kosongkan isiannya di{" "}
          <Link to="/profil">halaman Profil</Link>.
        </li>
        <li>
          <strong>Seluruhnya:</strong> minta penonaktifan akun dan penghapusan data lewat
          email di atas. Menarik persetujuan berarti JOBARTA tidak lagi bisa kamu pakai
          untuk melamar — itu konsekuensi wajar, bukan hukuman.
        </li>
      </ul>

      <h2>8. Anak di bawah umur</h2>
      <p>
        JOBARTA ditujukan untuk pencari kerja berusia <strong>18 tahun ke atas</strong>.
        Kami tidak dengan sengaja mengumpulkan data anak. Kalau kamu tahu ada akun milik
        anak di bawah umur, beri tahu kami dan akan kami hapus.
      </p>

      <h2>9. Perubahan kebijakan ini</h2>
      <p>
        Kalau ada perubahan berarti, tanggal &ldquo;Terakhir diperbarui&rdquo; di atas
        kami majukan dan kami beri tahu di aplikasi. Perubahan yang memperluas pemakaian
        data akan kami mintakan persetujuan ulang, bukan diberlakukan diam-diam.
      </p>
    </HalamanLegal>
  );
}
