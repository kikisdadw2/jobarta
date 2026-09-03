# 🎨 Prompt Desain (Claude Design) — JOBARTA

**Target tool:** Claude Design (canvas multi-artboard, hasilnya bisa di-export PNG/PDF)
**Beda dengan dokumen sebelahnya:** `Prompt-Halaman-JOBARTA.md` = prompt untuk **membangun kode** (Claude Code). Dokumen ini = prompt untuk **mendesain tampilan** sebelum kode ditulis.
**Sumber:** `Roadmap-Jobarta (1).md` · `Diagram Jobarta/` · design system di bawah (dari skill `ui-ux-pro-max`) · aturan di [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) (skill `web-design-guidelines`)

> **Cara pakai:** buka sesi baru → tempel **BLOK DESIGN SYSTEM** → lalu tempel salah satu prompt halaman di bawahnya. Satu canvas bisa memuat beberapa artboard sekaligus.

---

## 🚦 Halaman mana yang layak didesain dulu?

Tidak semua halaman untung didesain di canvas. Yang interaktif lebih baik langsung dikode.

| Halaman | Alat | Alasan |
|---|---|---|
| Landing / Home | 🎨 **Design** | Murni visual & persuasif, nol logika — iterasi cepat |
| Onboarding pilih peran | 🎨 **Design** | Layar penentu konversi, layak dibolak-balik |
| Kerangka Peta (shell) | 🎨 **Design** | Desain *bingkai*-nya saja; petanya sendiri harus dikode |
| Detail Lowongan | 🎨 **Design** | Layar penentu kepercayaan (anti-lowongan palsu) |
| Sistem Komponen | 🎨 **Design** | Sekali dibuat, dipakai semua halaman |
| Profil, posting, pelamar, admin | 💻 Code | Form & tabel, terikat skema DB |
| Chat | 💻 Code | Real-time, mustahil dimock |

---

## 🎨 BLOK DESIGN SYSTEM (tempel di awal SETIAP prompt desain)

> 🔴 **Blok ini TIDAK lagi disalin ke sini.** Sumber tunggalnya:
> **`D:\JOBARTA\BLOK-DESIGN-SYSTEM.md`**
>
> Versi siap-tempel (blok + gate Web Interface Guidelines + 7 prompt) ada di
> **`D:\JOBARTA\PROMPT-REGENERASI-CLAUDE-DESIGN.txt`** — bagian **BLOK A**.
>
> Alasan tidak disalin lagi: palet pernah tersimpan di 4 tempat sekaligus, jadi
> satu perubahan warna berarti 4 suntingan — dan yang terlewat diam-diam
> jadi acuan yang salah. Palet 2026-08-28 (krem–slate) mengganti palet
> biru–hijau 2026-08-24; lihat `decisions.md`.

**Ringkas — supaya salah paham ketahuan cepat:**
latar `#F0E5CF` · permukaan `#F7F6F2` · garis `#C8C6C6` (garis saja) ·
primary `#4B6587` · teks `#2E3A4D` · terverifikasi & CTA `#3F6B4F` · error `#9E3B3B`
· Lexend + Source Sans 3. String "Barlow" harus nol.

---

# 🖼️ PROMPT DESAIN

## DESIGN 1 — Sistem Komponen (kerjakan PERTAMA)

```
[TEMPEL BLOK DESIGN SYSTEM DI ATAS DULU]

Buat satu canvas "JOBARTA — Design System" berisi artboard katalog komponen.
Ini fondasi; semua halaman lain akan memakai komponen dari sini.

Artboard yang dibuat:
1. Skala Warna — semua token di atas sebagai swatch, masing-masing diberi label
   nama token + hex + rasio kontras terhadap background. Tampilkan versi light DAN dark.
2. Tipografi — contoh nyata semua ukuran skala (12–40) dengan teks Bahasa Indonesia asli,
   bukan lorem ipsum. Tunjukkan judul, subjudul, body, caption, label.
3. Tombol — primary, secondary, ghost, destructive × state (default, hover, focus,
   active, disabled, loading). Focus ring harus terlihat jelas 3–4px.
4. Input & Form — text field, select, tag input (untuk skill), slider (radius km),
   checkbox, file upload. Masing-masing dengan state: kosong, terisi, fokus, error.
   🔴 Label selalu terlihat di atas field — JANGAN placeholder-only.
   Error tampil inline di bawah field, berisi cara memperbaiki.
5. Kartu Lowongan (Job Card) — komponen paling penting di produk ini. Buat 4 varian:
   (a) normal, (b) perusahaan terverifikasi, (c) gaji disembunyikan,
   (d) judul & nama perusahaan sangat panjang (uji truncation).
   Isi: judul, nama perusahaan + badge, jarak ("2,4 km dari kamu"), gaji, tipe kerja, waktu posting.
6. Badge & Status — TERVERIFIKASI (hijau), Menunggu Verifikasi (kuning), Ditolak (merah),
   dan status lamaran: Dikirim → Dilihat → Wawancara → Diterima/Ditolak.
   🔴 Setiap status harus dibedakan oleh IKON + TEKS, bukan warna saja (buta warna).
7. Empty State — 3 skenario: belum ada lowongan di area ini, belum ada lamaran,
   pencarian tidak menemukan hasil. Masing-masing berisi ilustrasi sederhana +
   penjelasan + satu tombol tindakan lanjutan.

Aturan tambahan:
- Beri nama setiap komponen persis seperti nanti di kode (JobCard, StatusBadge, MapPicker).
- Sertakan catatan spasi (padding/gap) dalam angka, supaya bisa langsung diterjemahkan ke kode.
```
💡 Dikerjakan pertama karena Job Card & Status Badge muncul di hampir semua halaman — mendesainnya ulang tiap halaman itu pemborosan dan bikin tidak konsisten.

---

## DESIGN 2 — Landing / Home

```
[TEMPEL BLOK DESIGN SYSTEM DI ATAS DULU]

Desain halaman Landing JOBARTA. Artboard: 375px dan 1440px.

Struktur (ikuti pattern Marketplace — search bar adalah CTA):
1. Navbar — logo JOBARTA, "Cari Lowongan", "Untuk Perusahaan", tombol "Masuk" (netral).
   🔴 NEVER "Masuk dengan Google" di navbar — sejak 2026-08-31 ada DUA jalur masuk
   (Google dan username+password); pemilihan jalur terjadi di layar Masuk, bukan di navbar.
   Lihat PROMPT-DESIGN-2B-Auth.txt.
2. Hero — judul besar berisi janji konkret, bukan jargon.
   Contoh arah: "Cari kerja di dekat rumah kamu." Subjudul menjelaskan cara kerjanya dalam 1 kalimat.
   🔴 Elemen utama hero adalah SEARCH BAR (input posisi/kata kunci + tombol "Cari di Peta"),
   bukan tombol daftar. Di bawahnya: chip pencarian populer
   (contoh: "Kasir", "Gudang", "Barista", "Driver", "Admin").
   Latar hero: cuplikan peta Jakarta yang di-blur/di-overlay — pastikan teks di atasnya tetap kontras 4.5:1.
3. Kategori — grid ikon kategori pekerjaan (Ritel, F&B, Gudang & Logistik, Admin, Kurir, Produksi).
4. Cara Kerja — 3 langkah: Cari di peta → Lamar → Dihubungi perusahaan. Visual, sedikit teks.
5. 🔴 Section Kepercayaan & Keamanan — ini WAJIB, jangan dilewat.
   Jelaskan: semua perusahaan diverifikasi dokumen legalitas sebelum boleh posting;
   ada tombol lapor; JOBARTA tidak pernah meminta biaya ke pencari kerja.
   Ini pembeda utama produk. Beri bobot visual yang serius.
6. Lowongan Terbaru — 4–6 Job Card dari DESIGN 1.
7. CTA Perusahaan — panel terpisah: "Pasang lowongan & jangkau pelamar di sekitar lokasi kamu."
8. Footer — Kebijakan Privasi, Syarat Penggunaan, kontak, atribusi © OpenStreetMap contributors.

Aturan konten:
- 🔴 Tulis copy Bahasa Indonesia yang SEBENARNYA, bukan lorem ipsum.
- Pencari kerja GRATIS selamanya — nyatakan eksplisit di halaman ini.
- Satu CTA primary saja per layar; sisanya secondary.
Aturan teknis:
- Semua gambar punya dimensi eksplisit (cegah layout shift).
- Sertakan skip link ke konten utama.
- Hierarki heading rapi h1 → h2 → h3, tidak melompat.
```
💡 Search bar dijadikan pusat hero karena pattern marketplace: pengguna datang untuk mencari, bukan untuk membaca profil perusahaanmu.

---

## DESIGN 3 — Onboarding Pilih Peran + Consent PDP

```
[TEMPEL BLOK DESIGN SYSTEM DI ATAS DULU]

Desain alur onboarding setelah user masuk untuk pertama kali.
🔴 USANG sejak 2026-08-31: kalimat lama "karena auth-nya OAuth Google, tidak ada halaman
daftar" TIDAK berlaku lagi. Ada dua jalur masuk, dan layar Masuk/Daftar-nya didesain
terpisah di PROMPT-DESIGN-2B-Auth.txt — Artboard 1 di bawah dipindahkan ke sana.
Onboarding ini dimulai SETELAH akun terbentuk, apa pun jalur masuknya.

Artboard (375px dan 1440px):
1. Layar Login — sangat sederhana. Logo, satu kalimat nilai produk,
   satu tombol "Lanjutkan dengan Google" (pakai logo Google resmi, ikuti brand guideline Google).
   Di bawahnya teks kecil: "Dengan masuk, kamu menyetujui Syarat Penggunaan & Kebijakan Privasi" (keduanya link).
2. Pilih Peran — dua kartu besar berdampingan (bertumpuk di mobile):
   • "Saya Cari Kerja" — ikon, penjelasan 1 baris, "Gratis selamanya"
   • "Saya Pasang Lowongan" — ikon, penjelasan 1 baris, catatan "Perlu verifikasi dokumen usaha"
   Kartu harus terasa jelas bisa diklik dan punya state terpilih. Target sentuh besar.
3. Lengkapi Data — nama & email dari Google ditampilkan read-only (jelaskan kenapa tidak bisa diubah).
   Jika memilih employer: field nama perusahaan.
4. 🔴 Consent PDP — checkbox WAJIB sebelum tombol lanjut aktif.
   Teks jelas menyebut data apa yang dikumpulkan (CV, lokasi domisili, email) dan untuk apa.
   Link ke Kebijakan Privasi & Syarat Penggunaan.
   Ini kewajiban UU PDP No. 27/2022 — desain harus membuatnya sadar, bukan tersembunyi.
   🔴 JANGAN pakai dark pattern: checkbox tidak boleh tercentang otomatis,
   teks penolakan tidak boleh disamarkan.
5. Layar Sukses — arahkan ke langkah berikutnya sesuai peran
   (seeker → lengkapi profil · employer → verifikasi perusahaan).

Tambahan yang harus digambar:
- Indikator progres langkah (1 dari 3).
- State error: user membatalkan login Google → pesan yang menjelaskan cara mencoba lagi.
- State loading saat proses OAuth berjalan (teks diakhiri "…").
```
💡 Consent PDP didesain sebagai langkah sadar, bukan checkbox kecil di pojok — selain kewajiban hukum, transparansi ini memperkuat posisi anti-penipuan produk.

---

## DESIGN 4 — Kerangka Halaman Peta 🔴 (layar paling khas)

```
[TEMPEL BLOK DESIGN SYSTEM DI ATAS DULU]

Desain KERANGKA (shell) halaman peta — yaitu semua yang mengelilingi peta.
🔴 Peta sungguhan TIDAK didesain di sini: interaksinya (clustering, pan/zoom, hover sync)
hanya bisa dinilai saat dikode. Gambar area peta sebagai placeholder abu-abu
dengan beberapa pin & cluster contoh, lalu fokuskan desain pada bingkainya.

Artboard DESKTOP 1440px:
- Split view: daftar lowongan di kiri (lebar ±420px), peta di kanan.
- Header filter di atas: kategori, rentang gaji, tipe kerja, radius (slider km), tombol "Lokasi Saya".
- Daftar memakai Job Card dari DESIGN 1.
- Gambarkan state hover: satu job card sedang di-hover DAN pin pasangannya menyala di peta
  (beri anotasi panah untuk menjelaskan sinkronisasi dua arah ini).
- Tampilkan jumlah hasil ("48 lowongan di area ini") dan kontrol urutan.

Artboard MOBILE 375px — INI YANG PALING PENTING:
- Peta full-screen + bottom sheet berisi daftar lowongan.
- Gambar bottom sheet dalam 3 posisi: tertutup (peek ±120px, menampilkan 1 kartu),
  setengah (±50%), penuh.
- Tombol filter mengambang & tombol "Lokasi Saya" — jangan sampai tertutup bottom sheet.
- 🔴 Hormati safe area: kontrol tidak boleh bertabrakan dengan gesture bar Android/iOS.
- Sediakan alternatif tap untuk semua gestur geser (aksesibilitas).

State yang WAJIB digambar:
1. Memuat (skeleton kartu, bukan spinner kosong).
2. Kosong — "Belum ada lowongan di area ini" + saran memperluas radius.
3. Error — gagal memuat peta/lokasi ditolak browser, berisi cara memperbaiki.
4. Izin lokasi ditolak — jelaskan konsekuensinya & tetap sediakan pencarian manual.

Aturan wajib:
- Atribusi "© OpenStreetMap contributors" terlihat di peta (syarat lisensi ODbL).
- Kontrol peta minimal 44×44px.
- Pin & cluster dibedakan bentuk + angka, bukan warna saja.
- Beri anotasi: URL harus mencerminkan state (filter, area) agar bisa di-share & di-bookmark.
```
💡 Sengaja hanya mendesain kerangkanya: mendesain "peta" statis di canvas tidak akan menjawab pertanyaan sebenarnya (apakah clustering enak dilihat, apakah 200 pin lancar) — itu hanya terjawab di kode.

---

## DESIGN 5 — Detail Lowongan (layar penentu kepercayaan)

```
[TEMPEL BLOK DESIGN SYSTEM DI ATAS DULU]

Desain halaman detail lowongan. Artboard 375px dan 1440px.
Ini layar tempat pengguna memutuskan "ini asli atau penipuan?" — desain harus menjawabnya.

Isi:
- Judul lowongan, nama perusahaan + 🔴 badge TERVERIFIKASI yang menonjol (dengan ikon, bukan warna saja).
- Tombol lapor lowongan — terlihat, tapi tidak mengalahkan CTA utama.
- Info ringkas dalam baris chip: tipe kerja, gaji, jarak dari domisili, waktu posting.
- Jika salary_visible = false: tampilkan "Gaji dirundingkan" — jangan biarkan kosong menggantung.
- Deskripsi pekerjaan (uji dengan teks panjang & teks sangat pendek).
- Mini-map lokasi + alamat + jarak.
- Profil singkat perusahaan + link ke halaman perusahaan.
- 🔴 CTA "Lamar Sekarang" — sticky di bawah pada mobile, hormati safe area.
- Catatan keamanan kecil: "JOBARTA tidak pernah meminta biaya untuk melamar."

State tombol lamar yang WAJIB digambar (ambil dari state machine lamaran):
1. Bisa dilamar.
2. Sedang mengirim (spinner, teks "Mengirim…").
3. 🔴 Sudah dilamar — tombol nonaktif berlabel "Sudah Dilamar" + tanggal melamar.
4. Lowongan sudah ditutup.
5. Belum login — CTA berubah jadi "Masuk untuk Melamar".

Tambahan:
- Modal konfirmasi lamaran + field catatan lamaran opsional.
- Versi cetak/ringkas untuk dibagikan (opsional).
```
💡 Lima state tombol digambar sejak awal karena inilah tempat bug UX paling sering muncul — user menekan "Lamar" dua kali lalu bingung kenapa ditolak sistem.

---

## DESIGN 6 — Struktur Navigasi (untuk dokumen kampus 🎓)

```
[TEMPEL BLOK DESIGN SYSTEM DI ATAS DULU]

Buat satu artboard besar berisi DIAGRAM STRUKTUR NAVIGASI JOBARTA —
bukan halaman aplikasi, melainkan peta seluruh layar dan hubungannya.
Ini untuk lampiran dokumen kampus (artefak Fase 1: struktur navigasi).

Gambarkan sebagai diagram alur bertingkat, dikelompokkan per peran:

PUBLIK: Landing → Cari di Peta → Detail Lowongan → (butuh login) → Login Google
SEEKER: Onboarding → Peta → Detail Lowongan → Lamar → Lamaran Saya → Profil & CV → Pesan
EMPLOYER: Onboarding → Verifikasi Perusahaan → (gate: harus terverifikasi) →
          Posting Lowongan → Daftar Pelamar → Ubah Status → Pesan
ADMIN: Login → Panel Verifikasi → Approve/Reject
UMUM: Kebijakan Privasi · Syarat Penggunaan

Aturan penggambaran:
- 🔴 Tandai jelas GERBANG OTORISASI dengan simbol gembok:
  (a) belum login tidak bisa melamar,
  (b) perusahaan belum terverifikasi tidak bisa posting,
  (c) chat hanya terbuka setelah ada lamaran.
- Beri warna berbeda per peran + LABEL TEKS (jangan bedakan dengan warna saja).
- Sertakan legenda.
- Tandai halaman yang masuk MVP (Fase 2) vs fase lanjutan (Fase 4–6) dengan gaya garis berbeda.
- Rapi, hitam-putih tetap terbaca — karena kemungkinan besar dicetak.
```
💡 Artboard ini bukan sekadar dokumentasi: memetakan gerbang otorisasi secara visual sering memunculkan celah izin yang tidak kelihatan saat membaca kode per halaman.

---

## ✅ Checklist Sebelum Desain Dianggap Selesai

Diambil dari Web Interface Guidelines + design system. Cek tiap artboard:

**Aksesibilitas**
- [ ] Kontras teks ≥ 4.5:1 (teks besar ≥ 3:1) — termasuk teks di atas peta/gambar
- [ ] Focus ring terlihat jelas (3–4px) di semua elemen interaktif
- [ ] Warna bukan satu-satunya penanda makna (status, pin, badge)
- [ ] Hierarki heading berurutan, tidak melompat
- [ ] Setiap ikon-saja punya label teks pendamping atau tooltip

**Sentuh & Mobile**
- [ ] Target sentuh ≥ 44×44px, jarak antar target ≥ 8px
- [ ] Safe area dihormati (bottom sheet, sticky CTA, gesture bar)
- [ ] Sudah digambar di 375px, bukan cuma desktop
- [ ] Tidak ada scroll horizontal yang tidak disengaja

**Konten**
- [ ] Copy Bahasa Indonesia asli, bukan lorem ipsum
- [ ] Sudah diuji dengan teks sangat panjang & sangat pendek
- [ ] Empty state, loading state, dan error state tergambar
- [ ] Pesan error berisi cara memperbaiki
- [ ] Label tombol spesifik ("Lamar Sekarang", bukan "Kirim")

**Konsistensi**
- [ ] Semua warna memakai token, tidak ada hex liar
- [ ] Ikon dari satu keluarga (Lucide/Heroicons), tidak ada emoji sebagai ikon
- [ ] Spasi mengikuti ritme 8pt
- [ ] Light mode DAN dark mode tergambar

**Khusus JOBARTA**
- [ ] Badge terverifikasi menonjol di setiap tempat lowongan muncul
- [ ] Atribusi © OpenStreetMap contributors ada di setiap peta
- [ ] "Gratis untuk pencari kerja" dinyatakan di landing
- [ ] Tombol lapor tersedia di detail lowongan
- [ ] Gerbang "belum verified tidak bisa posting" terlihat di alur employer

---

## 🔄 Setelah Desain Jadi

1. Export artboard ke PNG/PDF → simpan untuk lampiran kampus (Fase 1 & 2).
2. Buka `Prompt-Halaman-JOBARTA.md`, mulai bangun dengan Claude Code, lampirkan hasil desain sebagai acuan visual.
3. Setelah halaman jadi, jalankan `/web-design-guidelines <file>` untuk audit kode terhadap aturan yang sama.

> **Catatan urutan:** kerjakan DESIGN 1 (sistem komponen) sebelum yang lain. Halaman lain tinggal menyusun komponen yang sudah ada, sehingga desainnya konsisten dan jauh lebih cepat.
