## Design system JOBARTA — patuhi persis, jangan improvisasi

> Palet dikunci ulang **2026-08-28** (Opsi A — Krem dominan). Menggantikan palet
> biru-hijau `#0369A1`/`#16A34A` yang dikunci 2026-08-24. Lihat `decisions.md`.

KONTEKS PRODUK
JOBARTA: platform cari kerja berbasis PETA INTERAKTIF untuk Jakarta.
Pengguna: pencari kerja Indonesia (banyak lulusan SMA/SMK, pekerja informal, UMKM),
mayoritas akses lewat HP Android kelas menengah, koneksi 4G tidak stabil.
Nada: tepercaya, jelas, merakyat — BUKAN startup genit, BUKAN korporat kaku.
Bahasa antarmuka: Bahasa Indonesia.

POSISI STRATEGIS: KEPERCAYAAN ADALAH FITUR UTAMA
Risiko terbesar produk ini adalah lowongan palsu & penipuan kerja.
Jadi sinyal kepercayaan (badge terverifikasi, nama perusahaan asli, tombol lapor,
transparansi gaji) BUKAN hiasan — itu inti desain. Tampilkan menonjol.

PATTERN: Marketplace / Directory
- Search bar ADALAH CTA utama. Kurangi friksi menuju pencarian.
- Urutan section landing: Hero (fokus search) → Kategori → Lowongan Unggulan
  → Kepercayaan/Keamanan → CTA perusahaan.

STYLE: Accessible & Ethical
High contrast, teks besar (min 16px), fokus terlihat jelas, WCAG AA ke atas,
semantik, ramah pembaca layar. Mendukung light mode DAN dark mode penuh.

WARNA — MODE TERANG (pakai token, jangan hex mentah di komponen)
--color-background   #F0E5CF   krem hangat — LATAR HALAMAN
--color-surface      #F7F6F2   off-white — kartu, panel, input
--color-border       #C8C6C6   abu netral — 1,6:1, HANYA garis pemisah
--color-primary      #4B6587   slate — aksi, link, header
--color-on-primary   #F7F6F2
--color-foreground   #2E3A4D   teks isi — 10,6:1 (AAA)
--color-accent       #3F6B4F   hijau teredam — TERVERIFIKASI, CTA "Lamar Sekarang"
--color-destructive  #9E3B3B   bata teredam — error, tombol lapor
--color-ring         #4B6587   focus ring

Rasio kontras (terhadap `#F7F6F2`, kecuali disebut lain):
  #2E3A4D  10,6:1  ✅ AAA — teks isi panjang
  #9E3B3B   6,2:1  ✅ AA  · teks putih di atasnya 6,7:1 ✅
  #3F6B4F   5,7:1  ✅ AA  · teks putih di atasnya 6,1:1 ✅
  #4B6587   5,5:1  ✅ AA  · di atas #F0E5CF 4,8:1 ✅ · teks putih di atasnya 6,0:1 ✅
  #C8C6C6   1,6:1  ❌ garis saja — NEVER dipakai untuk teks atau ikon bermakna

WARNA — MODE GELAP
--color-background   #23211E   dark hangat
--color-surface      #2E2B26
--color-border       #4A453D
--color-primary      #8FA8C8   6,6:1
--color-on-primary   #23211E
--color-foreground   #F0E5CF   12,9:1
--color-accent       #7FB68C   6,9:1
--color-destructive  #E08585   6,0:1
--color-ring         #8FA8C8

ATURAN WARNA YANG MENGIKAT SEMUA HALAMAN
1. `#C8C6C6` NEVER memikul makna. Ia garis dan pemisah — bukan teks, bukan ikon,
   bukan label nonaktif. Teks nonaktif pakai `#4B6587` dengan opacity, bukan abu.
2. Hijau `#3F6B4F` memikul DUA peran sekaligus: badge TERVERIFIKASI dan CTA
   "Lamar Sekarang". Itu disengaja — keduanya berarti "aman", dan pengguna
   sasaran belajar warna lebih cepat daripada ikon.
3. Merah `#9E3B3B` NEVER dipakai selain untuk error dan pelaporan. Jangan
   dipakai sebagai warna dekoratif betapapun cocoknya dengan krem.
4. Latar halaman `#F0E5CF` dan permukaan `#F7F6F2` cuma beda 1,16:1. Itu terlalu
   tipis untuk jadi satu-satunya pemisah — kartu MUST punya garis `#C8C6C6`
   ATAU bayangan halus, jangan mengandalkan beda warna saja.

TIPOGRAFI
Judul: Lexend (300/400/500/600/700)
Isi:   Source Sans 3 (300/400/500/600/700)
Skala: 12 · 14 · 16 · 18 · 24 · 32 · 40
Body minimal 16px di mobile. Line-height 1.5–1.75. Panjang baris 60–75 karakter.
Angka dalam kolom/tabel pakai tabular-nums. Judul pakai text-wrap: balance.

SPASI & LAYOUT
Ritme 8pt: 4 · 8 · 16 · 24 · 32 · 48.
Mobile-first. Breakpoint yang harus digambar: 375px (utama) dan 1440px.
Target sentuh minimal 44×44px, jarak antar target minimal 8px.
Layout full-bleed hormati env(safe-area-inset-*).

IKON
SVG saja — Lucide atau Heroicons. Stroke konsisten.
🔴 JANGAN pakai emoji sebagai ikon struktural.

GERAK
Transisi 150–300ms, ease-out saat masuk. Hanya animasikan transform & opacity.
Sediakan varian prefers-reduced-motion.

MENULIS TEKS (UI copy)
Bahasa Indonesia, kalimat aktif, sapa pengguna dengan "kamu".
Label tombol spesifik: "Lamar Sekarang", bukan "Kirim". "Cari Lowongan", bukan "Submit".
Pesan error selalu berisi CARA MEMPERBAIKI, bukan cuma menyatakan salah.
Angka pakai numeral (3 lowongan, bukan tiga lowongan).
Pakai elipsis "…" bukan "...", kutip melengkung, dan &nbsp; untuk "10&nbsp;km".
Format mata uang: Rp 4.500.000 (Intl.NumberFormat, locale id-ID).

RESPONSIF & KESEDERHANAAN — dua aturan yang tidak boleh dilanggar
1. "Sederhana" berarti SEDIKIT ELEMEN — NEVER elemen yang dikecilkan, disamarkan,
   atau dihilangkan labelnya. Kesederhanaan NEVER mengalahkan keterbacaan.
2. Responsif berarti mengubah SUSUNAN — NEVER sekadar mengecilkan layout desktop.

RESPONSIF
- Gambar tiap layar di DUA lebar saja: 375px (mobile) dan 1440px (desktop).
- Layar penuh MUST pakai 100dvh, NEVER 100vh. Bilah alamat Chrome Android mengubah
  tinggi viewport saat scroll; 100vh membuat bottom sheet dan tombol peta terpotong.
- Dua kolom di 1440px MUST menjadi satu kolom bertumpuk di 375px.
- NEVER ada scroll horizontal yang tidak disengaja di lebar mana pun.
- Teks panjang MUST punya perilaku yang digambar: elipsis, line-clamp, atau
  membungkus. Gambar kondisi TERPANJANGNYA. Anak flex MUST punya min-width: 0.
- Tabel dan daftar lebar di layar kecil MUST scroll horizontal di dalam wadahnya
  sendiri ATAU berubah bentuk jadi kartu.
- Layout full-bleed MUST hormati env(safe-area-inset-*).

KESEDERHANAAN
- Satu aksi utama per layar. Aksi lain tetap ada, tapi lebih rendah secara visual.
- Buang hiasan yang tidak membawa informasi: bingkai ganda, bayangan bertumpuk,
  kartu di dalam kartu, garis pemisah yang tidak memisahkan apa pun.
- Ruang putih adalah alat pemisah utama.
- Uji tiap elemen: kalau dihapus dan tidak ada makna yang hilang, hapus.
- NEVER dikorbankan atas nama "bersih": ukuran teks (isi minimal 16px), kontras,
  label field yang terlihat, teks pendamping ikon, target sentuh 44px.

HINDARI
Desain kekanak-kanakan · gradien ungu/pink ala AI · glassmorphism berat ·
animasi dekoratif tanpa makna · abu-abu di atas abu-abu · teks < 12px ·
warna sebagai satu-satunya penanda makna · ikon tanpa label demi tampilan "bersih" ·
teks abu tipis sebagai "estetika" · label yang hanya hidup di placeholder ·
tipografi tipis untuk teks isi · font Inter/Roboto/Arial.

WAJIB DI SETIAP ARTBOARD
- Gambar versi 375px (mobile) DAN 1440px (desktop).
- Gambar juga state kosong (empty state) dan state error bila halaman itu punya data.
- Tandai focus ring pada elemen interaktif utama.
- Beri catatan kontras jika ada teks di atas gambar/peta.
- Sebelum menyatakan selesai, jawab ya/tidak: ada teks isi < 16px? ada field tanpa label
  terlihat? ada ikon tanpa teks pendamping? ada lebih dari satu aksi utama? ada scroll
  horizontal di 375px? susunan 375px cuma versi kecil dari 1440px? ada `#C8C6C6`
  dipakai sebagai teks? Semua harus "tidak".
