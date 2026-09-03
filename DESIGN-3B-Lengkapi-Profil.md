[TEMPEL BLOK DESIGN SYSTEM DI ATAS DULU]

Desain layar "Lengkapi Profil" — SETELAH onboarding pilih peran (DESIGN 3).

🔴 PRINSIP PENGIKAT — baca sebelum menggambar apa pun:
Momen "aha" seeker JOBARTA BUKAN "punya CV", melainkan MELIHAT LOWONGAN NYATA
DI DEKAT RUMAHNYA. Jadi layar ini TIDAK BOLEH terasa berdiri di antara login dan peta.
Konsekuensi desain:
- JANGAN gambar indikator langkah "3 dari 3" di sini. Itu membingkai layar opsional
  sebagai kewajiban dan menaikkan drop-off.
- Unggah CV didesain sebagai JUST-IN-TIME: pemicu utamanya saat seeker menekan
  "Lamar" pertama kali (artboard 5), bukan sebagai penghalang sebelum melihat peta.
- Di layar ini CV hanya ditawarkan sebagai quick win opsional, dengan jalan keluar jelas.

Artboard (375px dan 1440px, light DAN dark mode):

1. Lengkapi Profil — Seeker
   • Header: "Sedikit lagi, [Nama]" + manfaat konkret, bukan instruksi
     ("Perusahaan lebih sering membalas pelamar yang profilnya lengkap").
   • Avatar bulat besar, prefill foto Google, tombol "Ganti foto" bertumpang di atasnya.
     Gambar avatar dengan rasio & ukuran terkunci — ruangnya sudah dipesan sebelum
     gambar termuat, supaya tidak ada pergeseran layout saat foto masuk.
   • Nama: field TERISI dari Google, BISA DIUBAH. Label terlihat di atas field
     (bukan placeholder-as-label) dan label bisa diklik untuk memfokuskan field.
     Hint kecil: "Pakai nama seperti di lamaran kerja."
     🔴 Jangan gambar field ini dalam keadaan ter-autofocus — di mobile itu memunculkan
     keyboard dan menutup separuh layar sebelum user sempat melihat isinya.
   • CV sebagai kartu quick-win opsional: "Punya CV? Unggah sekarang (30 detik)"
     + teks kecil "atau nanti saat kamu melamar".
   • CTA utama "Simpan & Lihat Lowongan" — nama tombol menyebut HASILNYA, bukan "Simpan".
   • Jalan keluar "Nanti saja" sebagai tombol teks yang terbaca jelas (kontras ≥4.5:1,
     target ≥44px). 🔴 Bukan abu-abu samar. Tidak ada dark pattern.

2. Lengkapi Profil — Employer
   Varian sama TANPA bagian CV. Hanya foto + nama, lalu arah ke verifikasi perusahaan.
   Gambar berdampingan dengan artboard 1 agar perbedaannya terlihat.

3. Dropzone CV — anatomi lengkap
   🔴 Dropzone TIDAK BOLEH hanya area seret-lepas. Wajib gambar tombol
   "Pilih berkas" di dalamnya sebagai jalur setara untuk tap & keyboard —
   seret-lepas mustahil di HP dan tidak bisa dipakai pengguna keyboard.
   • Batas & format disebut SEBELUM memilih ("PDF, DOC, atau DOCX · maks 5MB"),
     bukan muncul sebagai error sesudahnya.
   • Gambar state fokus keyboard pada dropzone (focus ring 3–4px, token --color-ring).

4. Tiga state unggah dalam satu artboard, bertumpuk:
   a. Sedang mengunggah — nama berkas, progres %, tombol Batalkan.
      Teks status diakhiri elipsis: "Mengunggah…". 🔴 Wajib: di 4G, 5MB terasa lama;
      tanpa progres user mengira aplikasi hang.
   b. Berhasil — nama berkas, ukuran, ikon centang + teks "Tersimpan"
      (warna hijau --color-accent BUKAN satu-satunya penanda), tautan "Ganti" & "Hapus".
   c. Gagal — pesan menyebut SEBAB dan CARA MEMPERBAIKI:
      "Ukuran berkas 7MB, maksimal 5MB. Coba kompres atau unggah versi lain."
      Bukan "Upload gagal". Pesan muncul TEPAT DI BAWAH dropzone, bukan di atas halaman.
   Semua perubahan state ini diumumkan ke pembaca layar secara sopan
   (tandai di anotasi artboard: aria-live polite).

5. 🔴 Just-in-time: sheet "Lampirkan CV" saat menekan Lamar pertama kali
   Bottom sheet (375px) / dialog (1440px) muncul di atas Detail Lowongan.
   • Judul menyebut konteksnya: "Lampirkan CV untuk melamar di [Nama Perusahaan]"
   • Dropzone yang sama seperti artboard 3 (komponen dipakai ulang).
   • Alternatif jujur bila belum punya berkas: "Saya belum punya CV — isi data singkat"
     → mengarah ke form profil terstruktur.
   • Scrim gelap 40–60%, sheet menghormati safe area bawah (gesture bar).
   Ini artboard PALING PENTING di prompt ini: di sinilah motivasi user paling tinggi.

6. Pengingat setelah dilewati — non-blocking
   Kartu tipis di halaman peta/profil: bar kelengkapan profil + daftar 3 item pendek
   (foto · CV · lokasi domisili) dengan centang pada yang sudah selesai,
   dan tombol tutup. 🔴 Bukan modal, bukan pemblokir.
   Gambar juga state "sudah 100%" — momen selesai diberi apresiasi singkat, lalu kartunya hilang.

7. Pemotongan foto (crop)
   Bottom sheet di 375px, dialog di 1440px. Bingkai lingkaran 1:1, slider zoom
   (target sentuh ≥44px), tombol Batal / Pakai. Scrim 40–60%.

8. Peringatan "perubahan belum tersimpan"
   Dialog kecil saat user menekan kembali setelah mengubah nama / memilih foto
   tapi belum menyimpan: "Perubahan belum disimpan. Keluar?" → Batal / Keluar.

Yang harus ikut tergambar di SEMUA artboard:
- Light mode DAN dark mode penuh — termasuk warna latar field & dropzone di dark mode
  (jangan disimpulkan dari light mode; gambar keduanya).
- Focus ring terlihat pada: field nama, tombol ganti foto, dropzone, tombol "Pilih berkas",
  CTA, dan "Nanti saja".
- Urutan baca pembaca layar = urutan visual. Tandai urutannya di anotasi artboard.
- Uji teks ekstrem: nama Google sangat panjang; nama berkas sangat panjang
  (potong di TENGAH dengan elipsis, bukan di akhir — ekstensi harus tetap terlihat).
- Copy Bahasa Indonesia asli, nada merakyat & menenangkan. Tidak ada lorem ipsum.
- Validasi nama muncul saat user meninggalkan field, BUKAN di tiap ketikan.
- Umpan balik tekan terlihat dalam 80–150ms; transisi 150–300ms, ease-out.
  Sediakan varian prefers-reduced-motion.

JANGAN:
- Jangan pakai dark pattern pada "Nanti saja" (samar, mini, tersembunyi).
- Jangan pakai emoji sebagai ikon struktural — Lucide/Heroicons saja.
- Jangan mendesain form CV terstruktur (headline, skill, gaji, radius, peta domisili)
  di sini — itu milik halaman /profil yang memang diputuskan langsung dikode.
- Jangan menggambar hex mentah; pakai token dari blok design system.
- Jangan menambahkan langkah baru ke alur pendaftaran. Layar ini mengurangi friksi,
  bukan menambah.
