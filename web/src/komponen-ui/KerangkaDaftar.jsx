/* Kerangka pemuatan untuk daftar (Lamaran Saya, Tersimpan, dasbor perusahaan).
 *
 * 🔴 Kerangka, bukan kalimat "Memuat…". Keduanya sama-sama jujur, tapi tidak
 *    sama akibatnya: kalimat menempati satu baris, lalu daftar sungguhan
 *    datang dan mendorong seluruh halaman turun. Kerangka memesan ruang yang
 *    kira-kira sama dengan isinya, jadi tidak ada lompatan tata letak saat
 *    data tiba — dan orang berkoneksi lambat sudah bisa melihat BENTUK apa
 *    yang sedang datang sebelum isinya terbaca.
 *
 * 🔴 Satu `role="status"` untuk seluruh blok, bukan per baris. Pembaca layar
 *    tidak perlu mendengar "sedang memuat" tiga kali; ia perlu mendengarnya
 *    sekali, lalu diberi tahu saat isinya siap. Batang-batangnya sendiri
 *    `aria-hidden` karena tidak membawa makna apa pun.
 *
 * Denyutnya mati di `prefers-reduced-motion` (halaman.css) — kerangka yang
 * berkedip adalah gerak berulang tanpa henti, persis jenis yang dihindari
 * orang dengan sensitivitas vestibular.
 */
export default function KerangkaDaftar({ baris = 3, label = "Memuat daftar" }) {
  return (
    <div className="kerangka" role="status" aria-label={label}>
      {Array.from({ length: baris }, (_, i) => (
        <div className="kerangka__baris" key={i} aria-hidden="true">
          <div className="kerangka__utama">
            <span className="kerangka__batang kerangka__batang--judul" />
            <span className="kerangka__batang kerangka__batang--sub" />
            <span className="kerangka__batang kerangka__batang--meta" />
          </div>
          <span className="kerangka__batang kerangka__batang--aksi" />
        </div>
      ))}
    </div>
  );
}
