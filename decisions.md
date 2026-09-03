# Decisions — JOBARTA

> Artefak brain-dump. Companion: `D:\Vault\Projects\JOBARTA.md` (project note),
> `D:\Vault\Knowledge Base\JOBARTA Prompt Halaman.md` (library prompt per halaman).

## Inbox
Ide yang baru ditangkap, menunggu impact analysis. Append-only saat capture.

### 2026-08-31 Auth tidak lagi Google-only — ditambah username unik + password

Permintaan user (2026-08-31): "buat yang registernya jangan google only kita create
account aja kayak ada username password". Ditegaskan di jawaban berikutnya: **username
unik + password DITAMBAHKAN, Google Auth TETAP ADA** — supaya orang yang tidak mau
memakai email tetap bisa masuk.

Ini MEMBATALKAN SEBAGIAN kunci stack 2026-08-24 ("OAuth Google mengganti register/login
password") dan sebagian keputusan 2026-08-31 pagi tentang consent PDP.

Bentuk akhirnya: DUA jalur masuk berdampingan.
- Jalur Google: seperti sebelumnya. auth.users terbentuk lebih dulu, consent di /onboarding.
- Jalur password: username + password. Akun dibuat SETELAH form diisi, jadi consent bisa
  kembali ke form daftar — sebelum data tersimpan.

🔴 Dua kendala nyata yang ditemukan saat merevisi ERD, keduanya harus dijaga di kode:

1. **Supabase Auth tidak mendukung login username secara asli** — auth.users mewajibkan
   email atau telepon. Jalan keluar yang dipakai: sistem membuat EMAIL SINTETIS internal
   dari username (mis. rizky@users.jobarta.app) yang tidak pernah ditampilkan ke pengguna.
   Ditandai kolom `profiles.is_synthetic_email`. Harus ditulis, kalau tidak orang yang
   ngoding akan bingung melihat email palsu di database.

2. **Akun tanpa email pemulihan TIDAK BISA dipulihkan** kalau lupa password — satu-satunya
   jalan bantuan admin manual, dan di platform berisi CV itu celah penyamaran identitas.
   Mitigasi yang dipilih: `recovery_email` tetap ditanya saat daftar tapi BOLEH dilewati,
   dengan kalimat jujur di layarnya: "Tanpa email, akun tidak bisa dipulihkan kalau kamu
   lupa password."

Aturan keamanan yang diturunkan (belum diminta user, diusulkan saat analisis):
**email pemulihan TIDAK PERNAH otomatis menggabungkan akun.** Bila seseorang daftar
username dengan recovery_email X, lalu orang lain masuk Google dengan email X — itu tetap
dua akun berbeda. Penggabungan harus diminta sadar + diverifikasi. Tanpa aturan ini, akun
bisa diambil alih hanya dengan mendaftar Google memakai email yang kebetulan sama.

Perubahan ERD (`01b-erd-auth.mmd`, sudah dikerjakan):
- AUTH_USERS: `encrypted_password` kini dipakai; `email` bisa sintetis
- PROFILES: `username` UK, `auth_method` (google|password), `recovery_email` +
  `recovery_email_verified`, `is_synthetic_email`
- CONSENT_RECORDS: `consent_point` (form_daftar | onboarding)
- AUTH_IDENTITIES: ditandai hanya ada di jalur Google

Status: 🔴 BARU SEBAGIAN. Sudah: 01b-erd-auth.mmd.
BELUM (utang, urut dampak):
- `02-flow-seeker.mmd` — masih satu jalur Google
- 4 layar baru belum didesain: form daftar · verifikasi email · lupa password · atur ulang
- DESIGN 2 (navbar landing) & DESIGN 3 (aturan "satu tombol saja" di layar masuk gugur)
- `Prompt-Halaman-JOBARTA.md` PROMPT 2 — spesifikasi /login sekarang salah
- `Prompt-Halaman-JOBARTA.md` baris 142 & 242 baru saja diubah hari ini dengan alasan
  "tidak ada /register" — sekarang /register ADA lagi. Periksa ulang.

### 2026-08-31 CV jadi entitas sendiri; lamaran menyimpan CV versi yang dikirim

Pemicu: waktu memeriksa ERD (`Diagram Jobarta/Sumber Mermaid/01-erd.mmd`) ketahuan
PROFILES tidak punya kolom `avatar_url` maupun `cv_url`, dan APPLICATIONS cuma punya
`cover_note` — padahal DESIGN 3B seluruhnya soal foto profil dan berkas CV. Sheet
"Lampirkan CV" yang baru didesain tidak punya tempat menaruh berkasnya.

Dua opsi dipertimbangkan:
- (B) cukup kolom `cv_url` di PROFILES — paling sederhana, gampang dijelaskan di sidang.
- (A) entitas `CV_FILES` + FK `cv_file_id` di APPLICATIONS.

**Keputusan user 2026-08-31: Opsi A.** Sebab: kalau CV cuma satu kolom di PROFILES,
mengganti CV membuat SEMUA lamaran lama ikut menunjuk berkas baru — employer membuka
CV yang berbeda dari yang dulu dikirim pelamar. Itu salah secara faktual dan berisiko
secara hukum, bukan sekadar tidak rapi.

Konsekuensi yang harus dijaga di kode:
- `cv_files.is_active` = CV default untuk lamaran BERIKUTNYA.
- `applications.cv_file_id` = fakta historis lamaran ITU, tidak pernah ikut berubah.
  Dua konsep berbeda; menggabungkannya jadi satu kolom adalah bug yang dihindari di sini.
- Berkas CV lama TIDAK boleh dihapus dari Storage selama masih dirujuk lamaran mana pun.

Status: propagated (01-erd.mmd, 02b-flow-cari-lamar.mmd)

### 2026-08-31 ERD menggambar auth.users; consent PDP pindah ke sesudah akun terbentuk

Temuan: ERD versi 2026-08-21 tidak punya entitas login sama sekali. Satu-satunya jejak
adalah komentar `uuid id PK "= auth.users.id"` di PROFILES — menunjuk tabel milik
Supabase Auth yang tidak pernah digambar. Untuk dokumen kampus F1 itu lubang: penguji
melihat ERD dan tidak menemukan jawaban "user login-nya di mana?".

Keputusan: gambar **AUTH_USERS sebagai entitas eksternal** (atribut minimal: id, email,
provider) dengan relasi `AUTH_USERS ||--|| PROFILES`. Jujur soal batas sistem.
Kardinalitasnya sengaja wajib di kedua sisi — artinya kode HARUS menjamin tiap akun Auth
punya baris profiles (lazimnya lewat trigger `on auth.user created`), kalau tidak ERD-nya
berbohong. `profiles.email` diturunkan jadi salinan, bukan UK sendiri.

Konsekuensi kedua, lebih penting: **consent PDP tidak bisa lagi diminta sebelum akun ada.**
Di alur email+password, persetujuan ditaruh di form register sebelum akun dibuat. Dengan
OAuth Google, akun `auth.users` sudah terbentuk begitu callback kembali — data pribadi
(email, nama, foto) sudah masuk sistem sebelum user menyetujui apa pun. Maka:
- Consent diminta di `/onboarding`, sesudah akun terbentuk. Itu satu-satunya gerbang legal
  yang tersisa — sebab PROMPT 3 harus tetap ringan tapi tidak boleh bisa dilewati.
- Cabang "menolak PDP" tidak lagi berbunyi "pendaftaran dibatalkan" (tidak akurat: ada data
  yang sudah tersimpan), melainkan **"akun tidak diaktifkan + tawaran hapus data"** —
  kewajiban UU PDP No. 27/2022.

Ditemukan sekalian & diperbaiki: `Prompt-Halaman-JOBARTA.md` masih menyuruh hero landing
menaut ke rute `/register` yang tidak ada dan tidak akan pernah dibuat (baris 142), masih
menunjuk `JOBARTA Home.html` yang sudah ditandai usang sebagai referensi visual (baris 139),
dan masih menyebut "checkbox consent di /register" (baris 242).

Status: propagated (01-erd.mmd, 02-flow-seeker.mmd, 02b-flow-cari-lamar.mmd,
Prompt-Halaman-JOBARTA.md). ⚠️ PNG & SVG ketiga diagram itu masih versi 2026-08-21 —
perlu render ulang manual di mermaid.live.

### 2026-08-28 Palet diganti total ke krem–slate (Opsi A), membatalkan biru–hijau

Permintaan user (2026-08-28): "aku gamau pakai warna biru". Palet biru-hijau yang
dikunci 2026-08-24 (#0369A1 / #16A34A / #F0F9FF) DIBATALKAN.

Sebab langsung: dari 9 token palet lama, 7 di antaranya biru (primary, secondary,
background, foreground, muted, border, ring). Hanya hijau dan merah yang bukan —
dan merah jarang muncul. Praktis seluruh antarmuka biru. Kondisi itu diperparah
usulanku sendiri hari itu: aku memindahkan CTA "Lamar Sekarang" dari hijau ke biru
karena teks putih di atas #16A34A cuma 3,3:1, tanpa lebih dulu mempertimbangkan
solusi yang mempertahankan hijau (menggelapkannya). Itu mendorong palet makin biru.

Palet baru — sumber: Color Hunt f0e5cf-f7f6f2-c8c6c6-4b6587, dipilih user setelah
membandingkan dua opsi peran warna di canvas `JOBARTA Arah Warna`
(https://claude.ai/code/artifact/0c8673b5-b0a2-4107-814c-cb499c7e8ac9).

  --color-background   #F0E5CF   krem hangat — LATAR HALAMAN
  --color-surface      #F7F6F2   off-white — kartu, panel, input
  --color-border       #C8C6C6   1,6:1 — HANYA garis
  --color-primary      #4B6587   5,5:1
  --color-foreground   #2E3A4D   10,6:1 (AAA)
  --color-accent       #3F6B4F   5,7:1 — TERVERIFIKASI + CTA lamar
  --color-destructive  #9E3B3B   6,2:1

Opsi yang dipilih: **A — Krem dominan** (halaman krem, kartu off-white).
Opsi B (halaman off-white, kartu krem) ditolak; alasan tidak dinyatakan user.

Tiga warna (#2E3A4D, #3F6B4F, #9E3B3B) BUKAN dari palet Color Hunt — aku yang
menurunkannya, karena palet 4 warna itu tidak punya warna status sama sekali:
tidak ada "terverifikasi", tidak ada error. Untuk produk yang posisinya
anti-lowongan-palsu, tidak punya warna sukses berarti badge terverifikasi tidak
punya sinyal. Disetujui user 2026-08-28.

Konsekuensi yang SUDAH dikerjakan:
- `BLOK-DESIGN-SYSTEM.md` ditulis ulang (palet terang + gelap + 4 aturan warna)
- `PROMPT-REGENERASI-CLAUDE-DESIGN.txt` diperbarui, nol referensi palet lama
- **Blok design system berhenti disalin-tempel.** `Prompt-Design-JOBARTA.md`,
  `PROMPT-Lengkapi-Profil-LENGKAP.md`, dan `PROMPT-DESIGN-4-Kerangka-Peta.txt`
  sekarang cuma merujuk ke `BLOK-DESIGN-SYSTEM.md` + ringkasan 5 baris. Isi
  promptnya utuh (6 DESIGN, semua langkah 3B & Kerangka Peta).
  Sebab: palet tersimpan di 4 tempat, satu perubahan = 4 suntingan, yang
  terlewat diam-diam jadi acuan salah.
- **Design system dimasukkan ke `PROMPT 0` `Prompt-Halaman-JOBARTA.md`.**
  Temuan audit 2026-08-28: file prompt kode 665 baris itu **tidak menyebut warna
  sama sekali** — bukan hex lama, tapi kosong. Artinya palet tidak akan pernah
  sampai ke kode. Lubang yang diam, tidak terdeteksi grep. Sekarang PROMPT 0
  membawa token terang + gelap + aturan kartu-butuh-garis.
- `README.md` diperiksa: nol hex, klaim yang ada (Accessible & Ethical, Lexend/
  Source Sans 3, 8pt, WCAG AA+, 100dvh) semuanya masih berlaku. Tidak diubah.

- **DESIGN 1 Sistem Komponen SELESAI** (2026-08-28), 7 artboard di palet krem:
  https://claude.ai/code/artifact/1b3070ce-2154-4798-97d6-514838bbc8a6
  File kerja: `design-canvas/sistem-komponen/`. Gate lolos: "Barlow" nol, hex lama nol.
  Mode gelap ikut digambar — jadi nilai dark mode sekarang sudah teruji visual.

  Tiga keputusan baru yang lahir saat membangun (disetujui user 2026-08-28):
  a. Tombol dipecah **Accent** vs **Primary**. Accent `#3F6B4F` KHUSUS "Lamar
     Sekarang" — sewarna badge TERVERIFIKASI karena keduanya berarti "aman".
     Primary `#4B6587` untuk aksi lain ("Cari Lowongan").
  b. Warna baru **`#A08B4A`** (kuning) untuk status "Menunggu Verifikasi", teks
     `#6B5A2E` = 5,9:1. Palet tidak punya warna untuk status yang bukan aman dan
     bukan gagal. Badge ini HANYA tampil di panel admin & halaman perusahaan
     sendiri, tidak pernah di kartu lowongan publik.
  c. Label penolakan lamaran = **"Tidak Dilanjutkan"**, bukan "Ditolak", dan
     memakai garis bata bukan bidang penuh.

Konsekuensi yang BELUM dikerjakan (🔴 utang):
- `Design skills and scope form/uploads/Prompt-Design-JOBARTA.md` masih palet lama.
  SENGAJA dibiarkan: itu arsip snapshot upload, bukan file kerja.
- Ukuran frame `canvas.json` Sistem Komponen dihitung dari ritme vertikal, belum
  pernah dilihat langsung — kalau ada artboard terpotong, perbaikannya satu angka.

- **DESIGN 4 Kerangka Peta SELESAI** (2026-08-28), 3 artboard: mobile 375 dengan
  bottom sheet 3 posisi, desktop 1440 split view, 4 state wajib.
  Keputusan: peek 120px = satu kartu UTUH (bukan potongan); sheet penuh wajib
  punya "Lihat Peta"; error peta menawarkan "Lihat Daftar Tanpa Peta"; filter
  aktif jadi chip yang bisa dilepas. State "kosong" TIDAK memakai merah —
  radius tanpa hasil bukan kesalahan pengguna.
- **DESIGN 5 Detail Lowongan SELESAI** (2026-08-28), 3 artboard: mobile (2
  varian), desktop, 5 state tombol + modal konfirmasi. Sebelumnya dikira sudah
  ada — hasil pengecekan artifact `Copy of Design skills and scope form`
  ternyata isinya HANYA 3B; "Detail Lowongan" di sana cuma keterangan lokasi.
  Keputusan: badge sebelum gaji + tanggal verifikasi disebut; perusahaan belum
  terverifikasi ditulis EKSPLISIT (ketiadaan badge tidak cukup — pengguna baru
  tidak tahu badge itu ada); deskripsi terlalu pendek memicu panel peringatan;
  lowongan ditutup = tombol DIGANTI, bukan dinonaktifkan.
- **Semua canvas digabung jadi SATU dokumen** (2026-08-28):
  https://claude.ai/code/artifact/b13eb5e1-c8d7-40dd-bee1-a2b2d6b1ccb4
  13 artboard, 3 page. Sumber tetap modular per folder; `design-canvas/assemble.sh`
  merakit + memberi nama unik (tadinya ada 3 file bernama `Main.dc.html`).
  Folder `_gabungan/` adalah HASIL rakitan — jangan diedit langsung.

🔴 CATATAN PENTING: semua canvas di atas dibuat dari Claude Code, TERBIT SEBAGAI
ARTIFACT TERSENDIRI — bukan di dalam project Claude Design. Itu sebabnya paletnya
benar: canvas dari sini tidak terikat design system project "Industry". Blocker
2026-08-27 tidak diselesaikan, tapi DILEWATI.

⏭️ LANJUTAN BESOK (2026-08-29):
1. DESIGN 2 Landing — struktur lama masih berguna (8 section × 2 lebar, utuh 42 KB).
   Copy yang bisa dipakai ulang: "Cari kerja di dekat rumah kamu." ·
   "Lihat lowongan di peta, pilih yang paling dekat, lalu lamar langsung dari HP
   kamu. Gratis selamanya untuk pencari kerja." ·
   "Perusahaan wajib melalui verifikasi dokumen sebelum lowongan tayang."
2. DESIGN 3 Onboarding — struktur lama utuh 20 KB
3. DESIGN 3B Lengkapi Profil — 8 artboard, brief lengkap di DESIGN-3B-Lengkapi-Profil.md
4. DESIGN 6 Struktur Navigasi — belum pernah dibuat, untuk dokumen kampus
Tiap selesai: tambahkan ke `assemble.sh` + page baru di `canvas-gabungan.json`,
lalu terbitkan ulang ke URL yang SAMA (b13eb5e1).

Utang lain:
- 3 artifact lama (Sistem Komponen, Kerangka Peta, Detail Lowongan) kini duplikat
  dari canvas gabungan. Sebaiknya user hapus dari galeri. TIDAK dihapus otomatis.
- 4 canvas Barlow di `Design skills and scope form/` dan artifact 3B lama masih
  ada. Setelah semua diregenerasi, tandai usang atau hapus.
- Ukuran frame di canvas.json dihitung dari ritme vertikal, belum pernah dilihat
  langsung — kalau ada artboard terpotong, perbaikannya satu angka.

Keputusan user 2026-08-28: opsi A — desain tuntas dulu, baru backend.
Catatan: React tidak perlu menunggu backend. Komponen (JobCard, StatusBadge,
tombol, empty state) bisa dibangun dengan data contoh; yang butuh backend cuma
peta (query PostGIS) dan detail lowongan (satu record).

Catatan yang masih berlaku dari entri 2026-08-27: project Claude Design tetap
terikat design system "Industry". Pembalikan palet ini TIDAK menyelesaikan itu —
Industry tetap harus diganti di setelan project.

Status: captured

### 2026-08-27 Design system project Claude Design diganti ke token JOBARTA

Temuan (2026-08-27): artifact `Copy of Design skills and scope form` (DESIGN 3B
"Lengkapi Profil", 8 artboard, terbit 13:24) memuat catatan eksplisit dari Claude Design:
brief menyebut #0369A1 / #16A34A + Lexend + Source Sans 3, TAPI project "terikat ke
design system Industry" sehingga palet mauve-taupe + Barlow yang dipakai. Font Barlow
ikut di-embed ke bundle.

Artinya: menempelkan BLOK DESIGN SYSTEM ke dalam prompt TIDAK cukup. Setelan design
system di level project Claude Design menang atas isi prompt. Ini juga menjelaskan kenapa
4 canvas lama (Sistem Komponen, Landing, Onboarding, Kerangka Peta) semuanya Barlow/#d4d4d7
— bukan sekadar karena dibuat sebelum sistem dikunci 2026-08-26.

Keputusan user (2026-08-27): **ganti design system project Claude Design** ke token JOBARTA
(Lexend + Source Sans 3, #0369A1, #16A34A, #F0F9FF), BUKAN menyerah dan mengubah
BLOK-DESIGN-SYSTEM.md mengikuti Industry.

Opsi yang ditolak: menerima Industry sebagai design system resmi. Alasan penolakan —
#16A34A dipilih spesifik supaya lolos kontras 3:1, dan palet biru-hijau terikat ke posisi
strategis "kepercayaan adalah fitur utama"; mauve-taupe tidak membawa sinyal itu.

Menunggu regenerasi setelah design system diganti (JANGAN dipakai sebagai acuan visual):
- `Design skills and scope form/JOBARTA - Sistem Komponen.dc.html`
- `Design skills and scope form/JOBARTA - Landing.dc.html`
- `Design skills and scope form/JOBARTA - Onboarding.dc.html`
- `Design skills and scope form/JOBARTA - Kerangka Peta.dc.html` (juga terpotong, 1.810 byte)
- Artifact `Copy of Design skills and scope form` — DESIGN 3B, 8 artboard

Status: propagated

### 2026-08-26 Aturan Responsif & Kesederhanaan di BLOK DESIGN SYSTEM
Permintaan: desain lebih responsif tapi tetap "minimalist".

Klarifikasi istilah (grilling 2026-08-26): "minimalist" di sini BUKAN style minimalism.
Maksudnya **tenang & tidak ramai** — kurangi elemen, satu aksi utama per layar, ruang lega,
TAPI teks tetap besar & kontras tinggi. Ini MEMPERKUAT style terkunci *Accessible & Ethical*,
bukan menggantikannya. Minimalism sungguhan (teks abu tipis, ikon tanpa label, kontras rendah)
ditolak eksplisit: berbahaya untuk pengguna sasaran JOBARTA (lulusan SMA/SMK, pekerja informal).

Keputusan bentuk (user, 2026-08-26):
- Bentuk = **sisipan ke BLOK DESIGN SYSTEM**, bukan prompt DESIGN baru — supaya otomatis
  mengikat SEMUA prompt desain (DESIGN 1-6 + 3B) tanpa harus diingat satu per satu.
- Target = **Claude Design saja** (`JOBARTA Prompt Desain.md`). Tidak menyentuh library kode.

Temuan teknis yang wajib masuk (dari ui-ux-pro-max + Web Interface Guidelines):
- `100vh` rusak di browser mobile (bilah alamat Chrome Android mengubah tinggi viewport)
  -> pakai `100dvh`. 🔴 Menyentuh Fase 2 "peta full-screen + bottom sheet" secara langsung.
- Breakpoint uji: 320 / 375 / 414 / 768 / 1024 / 1440 (bukan cuma 375 & 1440 seperti sekarang).
- Tabel di layar kecil: scroll horizontal atau berubah jadi kartu.
- Teks panjang: truncate/line-clamp; anak flex butuh min-width 0 agar bisa terpotong.
- Full-bleed wajib hormati env(safe-area-inset-*).
- Hindari scrollbar horizontal yang tidak disengaja.

Status: propagated

### 2026-08-26 Export desain lama bentrok dengan design system
`D:\JOBARTA\JOBARTA Home.html` dan `maps.html` adalah hasil export Claude Design
(`<title>Bundled Page</title>`, elemen `<x-dc>`) — bukan codebase.

Isinya memakai font **Archivo** dan latar **#0A1B20** (hijau-gelap), bertentangan dengan
design system yang dikunci 2026-08-24 (**Lexend / Source Sans 3**, latar `#F0F9FF`,
primary `#0369A1`). Artinya file itu dibuat SEBELUM design system dikunci.

Keputusan user (2026-08-26): **tandai usang**, jangan dijadikan acuan, dan catat
peringatannya di project note supaya anggota tim lain tidak memakainya.
Filenya sendiri TIDAK dihapus/diubah.

Koreksi 2026-08-27: akar masalahnya bukan urutan waktu. Design system project di Claude
Design menang atas isi prompt, jadi canvas BARU pun tetap keluar Barlow/mauve-taupe.
Lihat entri 2026-08-27.

Catatan terkait: register default JOBARTA = **product** (desain melayani produk);
landing & halaman legal adalah pengecualian brand. Belum ditulis ke artefak mana pun.

Status: propagated

### 2026-08-26 Halaman "Lengkapi Profil" pasca-login Google (PROMPT 3B)
Butuh satu halaman baru setelah OAuth Google untuk melengkapi akun: **nama (editable,
prefill dari Google)**, **foto profil (pfp, upload)**, dan **upload berkas CV**.

Keputusan scoping (opsi B, dipilih user 2026-08-26):
- PROMPT 3 (Onboarding Pilih Peran + Consent PDP) **tetap ringan** — tidak diperluas.
- Halaman baru = **PROMPT 3B "Lengkapi Profil"**, dijalankan setelah /onboarding,
  sebelum masuk aplikasi. Bisa di-skip (tidak boleh jadi tembok drop-off di 4G).
- PROMPT 5 (Profil & Form CV Seeker) bergeser peran jadi halaman **edit** profil lengkap
  (CV terstruktur, map picker domisili, radius) — bukan lagi tempat pertama kali upload CV.
- Alasan: onboarding panjang (peran + consent + pfp + CV 5MB) = drop-off besar di HP
  kelas menengah; employer tidak butuh CV sama sekali.

Catatan tambahan dari request: prompt harus memasukkan checklist
`/web-design-guidelines` (Vercel Web Interface Guidelines) sebagai gate acceptance.

Koreksi user (2026-08-26): ini **hanya untuk DESAIN**, bukan membangun backend.
Target tool = Claude Design → masuk ke `JOBARTA Prompt Desain.md` sebagai **DESIGN 3B**,
BUKAN ke `JOBARTA Prompt Halaman.md`. Tidak ada bucket/RLS/validasi server di scope ini.

Status: propagated

### 2026-09-01 Opsi B dikunci · DESIGN 2B & 3 selesai · web app dimulai

**Email pemulihan opsional (keputusan user).** Dipilih **Opsi B — konfirmasi sadar**:
mengosongkan field memunculkan dialog "Lanjut tanpa email pemulihan?" dengan DUA
TOMBOL SETARA. Bukan Opsi A (peringatan sebaris, gampang dilewati mata) dan bukan
Opsi C (radio wajib, form jadi paling panjang). Copy dialog dikunci apa adanya —
"kami tidak punya cara mengenali kamu", bukan istilah teknis. Tercatat penuh di
PROMPT-DESIGN-2B-Auth.txt.

**DESIGN 2B selesai** — 8 artboard, 5 layar auth + mode gelap.
https://claude.ai/code/artifact/664cf160-6608-486c-9433-3075b7934b64

**DESIGN 3 selesai (revisi)** — 6 artboard. Layar Masuk dibuang dari alur ini
(pindah ke 2B); Lengkapi Data dan Consent PDP masing-masing punya DUA VARIAN
(jalur Google vs jalur password); cabang menolak consent jadi account_status =
deactivated + tawaran hapus data 30 hari.
https://claude.ai/code/artifact/3fb87bf2-6c3d-4617-93c0-d36120e8690d

**Kanvas gabungan dirakit ulang** — dari 19 artboard/4 halaman jadi 36/7.
Perakit lama (assemble.sh) menyalin berkas saja dan mengharuskan manifest
disunting tangan, itu sebabnya tiga desain terakhir tidak pernah ikut. Diganti
assemble.py yang membaca canvas.json tiap folder sumber.
https://claude.ai/code/artifact/b13eb5e1-c8d7-40dd-bee1-a2b2d6b1ccb4

**8 diagram dirender ulang** (PNG 3x + SVG), termasuk 01b-erd-auth yang belum
pernah punya gambar. Dua jebakan dicatat di Diagram Jobarta/BACA-DULU.txt:
baris komentar %% membuat mermaid-cli gagal parse, dan fontFamily ke font yang
tidak terpasang memotong huruf terakhir nama entitas.

**Aplikasi web dimulai** di D:\JOBARTA\web (repo git sendiri, 3 commit).
Rute: / landing, /masuk, /daftar, /onboarding, /peta. Data 30 lowongan masih
statis; sesi cuma localStorage, bukan auth sungguhan. Landing sempat meleset
dari artboard karena dikode dari spesifikasi tertulis — sudah disamakan.

**Gate Web Interface Guidelines dijalankan** ke 14 berkas desain: checkbox palsu
(<div>) diganti input asli di 5 tempat — ini checkbox consent PDP, kalau disalin
ke kode persetujuan hukumnya tidak sah bagi pengguna pembaca layar. Plus 37 judul
h1 diturunkan ke h2, 21 autocomplete/spellcheck, touch-action manipulation.

🔴 Utang yang belum bergerak: repo belum di GitHub, belum ada hosting, README di
repo masih bawaan Vite, LICENSE belum ada. Deadline 6 September 23.59 WIB.

Status: propagated
