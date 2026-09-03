# 🧩 Prompt Pembangunan Per Halaman — JOBARTA

**Target tool:** Claude Code (agentic — baca file, edit kode, jalankan perintah)
**Sumber kebenaran:** `Roadmap-Jobarta (1).md`, `Diagram Jobarta/` (ERD, flow, state, arsitektur)
**Cara pakai:** satu halaman = satu sesi Claude Code baru. Tempel blok prompt-nya, review scope, lalu jalankan.

> ⚠️ **Peringatan agentic:** Semua prompt di bawah untuk tool dengan akses sistem nyata (edit file, jalankan terminal, migrasi DB). Sebelum tempel: cek path file, forbidden actions, dan stop conditions sudah sesuai kondisi repo aslimu.

---

## 🏗️ ARSITEKTUR

Stack resmi JOBARTA. **Setiap prompt di dokumen ini terikat pada tabel ini** — jangan ganti teknologi tanpa keputusan tim.

| Lapisan | Teknologi | Catatan penting |
|---|---|---|
| **Frontend** | HTML · CSS · **React.js** (Vite) | + `react-leaflet` & `supercluster` untuk peta |
| **Backend** | **Node.js** | Modular monolith — folder per modul: `auth`, `jobs`, `geo`, `users`, `chat` |
| **Database** | **PostgreSQL** + **PostGIS** | Lokasi = `geography(Point,4326)` + index GiST |
| **Peta & Geocoding** | **OpenStreetMap API** | Tiles OSM + geocoding/reverse via **Nominatim** |
| **Real-time chat** | **Socket.io** | ⚠️ butuh server persisten — lihat catatan di bawah |
| **Auth** | **OAuth Google** | Via Supabase Auth → sesi & RLS satu ekosistem |
| **Storage** | **Supabase Storage** | CV, logo, dokumen legal → **signed URL**, bucket privat |
| **Cache** | **Redis** | Cache query area/filter populer + queue email |
| **Hosting** | **Vercel** | Frontend + API routes; lihat batasan Socket.io |

### 🔴 Tiga konsekuensi arsitektur yang WAJIB dipatuhi

**1. Vercel tidak bisa menjalankan Socket.io secara native.**
Vercel = serverless (fungsi mati setelah request selesai). Socket.io butuh proses hidup terus yang memegang koneksi WebSocket. Jadi untuk Fase 4 pilih salah satu:
- **(A) Rekomendasi:** frontend + REST di Vercel, server Socket.io terpisah di **Railway / Render / Fly.io** (proses persisten, murah).
- **(B)** Ganti Socket.io dengan **Supabase Realtime** (WebSocket dikelola Supabase, cocok karena DB & Auth sudah di sana) — tapi ini keluar dari stack yang kamu tetapkan.
- **(C)** Vercel + layanan WebSocket pihak ketiga (Pusher/Ably).
> Keputusan ini harus diambil **sebelum** menjalankan PROMPT 13.

**2. OAuth Google menggantikan form password.**
Register/Login bukan lagi email+password manual. Alurnya: tombol "Lanjutkan dengan Google" → Supabase Auth → callback → cek `profiles.role` → kalau kosong, tampilkan halaman **onboarding pilih peran** (seeker/employer) + consent PDP. Role & RBAC tetap ditegakkan di backend (RLS Postgres).

**3. Nominatim (OSM) dibatasi ±1 request/detik.**
Wajib: debounce input alamat (≥800ms), cache hasil geocoding di Redis, set header `User-Agent` berisi identitas aplikasi (syarat kebijakan Nominatim), dan sediakan koreksi pin manual saat geocoding meleset. Untuk skala produksi, siapkan opsi self-host Nominatim / Photon.

### Aturan tetap turunan arsitektur
- **Jangan** simpan lokasi sebagai dua kolom float — selalu `geography(Point,4326)`.
- **Jangan** hardcode kunci Supabase/Redis — pakai env var Vercel.
- **Jangan** ekspos `service_role` key Supabase ke frontend — hanya `anon` key di client.
- Bucket Supabase Storage **privat**; akses berkas hanya lewat signed URL berumur pendek.
- Email dikirim lewat **queue Redis**, bukan sinkron di dalam request.

> ⚠️ **Peringatan agentic:** Semua prompt di bawah untuk tool dengan akses sistem nyata (edit file, jalankan terminal, migrasi DB). Sebelum tempel: cek path file, forbidden actions, dan stop conditions sudah sesuai kondisi repo aslimu. Konfirmasi direktori & permission cocok.

---

## 📌 Cara membaca prompt ini

Setiap prompt sudah dibuat dengan pola Claude Code yang benar:
- **Starting state** (kondisi awal) → **Target state** (hasil akhir)
- **Baca dulu** (grounding wajib sebelum ngoding)
- **Scope file** (folder/berkas yang boleh disentuh) — anti "ngedit ke mana-mana"
- **Forbidden actions** (yang TIDAK boleh) — anti over-engineering & anti rusak
- **Selesai jika** (acceptance criteria, diambil dari Definition of Done roadmap)
- **Berhenti & tanya** (checkpoint sebelum aksi destruktif)

Ganti placeholder `[...]` bila perlu. Prompt sengaja "front-loaded" — semua info di satu giliran, karena Opus 4.x bekerja paling baik begitu.

---

## 🌐 PROMPT 0 — Blok Konteks Bersama (tempel di awal SETIAP sesi baru)

Karena tiap halaman = sesi baru, tempel blok ringkas ini di bagian atas prompt halaman apa pun agar Claude Code paham fondasinya tanpa harus dijelaskan ulang.

```
## Konteks proyek JOBARTA (bawa terus)
Platform pencari kerja berbasis PETA INTERAKTIF untuk Jakarta.

ARSITEKTUR (jangan ganti tanpa persetujuan):
- Frontend: HTML/CSS + React.js (Vite) + react-leaflet + supercluster
- Backend: Node.js, modular monolith (folder per modul: auth, jobs, geo, users, chat)
- Database: PostgreSQL + PostGIS
- Peta & geocoding: OpenStreetMap (tiles OSM, geocoding via Nominatim) — BUKAN Google Maps
- Auth: OAuth Google via Supabase Auth (bukan form password manual)
- Storage: Supabase Storage, bucket privat + signed URL
- Cache/queue: Redis
- Real-time: Socket.io (server persisten TERPISAH dari Vercel)
- Hosting: Vercel (frontend + REST/API routes)

Baca dulu sebelum menulis kode apa pun:
- Roadmap-Jobarta (1).md  (fase, aturan, Definition of Done)
- Diagram Jobarta/Sumber Mermaid/01-erd.mmd  (skema DB: profiles, companies, company_members, jobs, applications, regions)
- Diagram Jobarta/Sumber Mermaid/05-arsitektur.mmd  (lapisan sistem)

Aturan tetap yang mengikat semua halaman:
- Lokasi selalu geography(Point,4326) + spatial index GiST — JANGAN dua kolom float.
- Query geo dibatasi bounding box viewport (ST_MakeEnvelope) / radius (ST_DWithin) — jangan tarik seluruh Jakarta.
- Role: seeker | employer | recruiter | admin. Otorisasi wajib di backend (RLS Postgres/middleware), bukan cuma disembunyikan di UI.
- Mobile-first: tiap halaman harus jalan mulus di HP Android kelas menengah / 4G.
- Perusahaan belum "verified" TIDAK boleh posting lowongan.
- Berkas (CV, logo, dokumen legal) di Supabase Storage bucket PRIVAT, akses via signed URL.
- Kunci API/service key lewat env var Vercel. JANGAN kirim service_role key ke browser.
- Panggilan Nominatim wajib di-debounce + di-cache Redis (batas ±1 req/detik).

DESIGN SYSTEM (definisikan sebagai CSS custom property, jangan hex mentah di komponen):
--color-background   #F0E5CF   krem hangat — latar halaman
--color-surface      #F7F6F2   off-white — kartu, panel, input
--color-border       #C8C6C6   1,6:1 — HANYA garis pemisah, NEVER teks/ikon
--color-primary      #4B6587   aksi, link, header — 5,5:1
--color-on-primary   #F7F6F2
--color-foreground   #2E3A4D   teks isi — 10,6:1
--color-accent       #3F6B4F   badge TERVERIFIKASI + CTA "Lamar Sekarang" — 5,7:1
--color-destructive  #9E3B3B   error, tombol lapor — 6,2:1
--color-ring         #4B6587   focus ring 3px
Dark mode: bg #23211E · surface #2E2B26 · border #4A453D · primary #8FA8C8
           fg #F0E5CF · accent #7FB68C · destructive #E08585
Font: Lexend (judul) + Source Sans 3 (isi). Body min 16px. Ritme spasi 8pt.
Target sentuh min 44×44px. Layar penuh pakai 100dvh, NEVER 100vh.
Latar #F0E5CF dan permukaan #F7F6F2 cuma beda 1,16:1 — kartu WAJIB punya garis
atau bayangan, jangan mengandalkan beda warna saja.
Sumber lengkap: BLOK-DESIGN-SYSTEM.md — kalau ragu, ikuti file itu.

Batasan kerja:
- Hanya buat yang diminta halaman ini. Jangan tambah fitur, file, abstraksi, atau refactor di luar scope.
- Berhenti dan tanya sebelum: menghapus file, menambah dependency baru, mengubah skema DB, atau menyentuh config CI/deploy.
- Setelah tiap langkah besar, cetak: ✅ [apa yang selesai].
```

---

# FASE 0-1 · Fondasi & Halaman Publik

## PROMPT 1 — Landing / Home (publik)

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: kamu frontend engineer React yang mengutamakan halaman ringan & cepat di HP.

Starting state: proyek React+Vite sudah ada, routing dasar terpasang, belum ada halaman landing.
Target state: halaman "/" publik yang menjelaskan JOBARTA dan mengarahkan ke peta & login Google.

Baca dulu: src/ (struktur routing & komponen layout yang sudah ada), BLOK-DESIGN-SYSTEM.md (palet & tipografi mengikat). 🔴 JANGAN pakai JOBARTA Home.html sebagai acuan — export itu USANG (font Archivo, latar #0A1B20), bertentangan dengan design system yang berlaku.

Bangun:
- Hero: judul "Cari kerja terdekat lewat peta", subjudul singkat, 2 CTA — "Lihat Peta Lowongan" (ke /peta, aksi utama) dan "Masuk dengan Google" (ke /login). 🔴 TIDAK ADA rute /register — pendaftaran = login Google pertama kali lalu /onboarding (lihat PROMPT 2 & 3).
- Section penjelas alur 3 langkah (cari di peta → lamar → dipanggil).
- Section untuk perusahaan (CTA "Pasang Lowongan").
- Footer: link Kebijakan Privasi & Syarat Penggunaan.

Scope file: hanya src/pages/Landing/ + entri route di router. Boleh tambah aset gambar ringan.
Forbidden: jangan pasang animasi berat, jangan tambah UI library baru, jangan sentuh backend.
Selesai jika: "/" render tanpa error, semua CTA menuju route yang benar, layout rapi di lebar 375px dan 1440px.
Berhenti & tanya sebelum: menambah dependency baru.
```
🎯 **Target:** Claude Code · 💡 Halaman entri ringan dengan scope terkunci ke folder Landing supaya tidak menyentuh fitur lain.

---

## PROMPT 2 — Login (OAuth Google)

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: fullstack engineer yang teliti soal keamanan auth.

Starting state: proyek Supabase sudah dibuat; provider Google di Supabase Auth aktif. Frontend belum punya halaman login.
Target state: halaman /login berisi SATU tombol "Lanjutkan dengan Google" + halaman /auth/callback yang menyelesaikan sesi dan redirect sesuai role.

Baca dulu: tabel profiles di 01-erd.mmd (kolom role), konfigurasi client Supabase di src/lib/.

Bangun:
- Halaman /login: tombol "Lanjutkan dengan Google" → supabase.auth.signInWithOAuth({ provider: 'google' }).
  TIDAK ada form email+password. Tidak ada halaman lupa password.
- Halaman /auth/callback: tukar code → sesi, lalu baca profiles milik user.
  - Jika profiles.role KOSONG/belum ada → redirect ke /onboarding (lihat PROMPT 3).
  - Jika sudah ada → seeker → /peta · employer → /perusahaan · admin → /admin.
- Sesi dikelola Supabase client (auto refresh token). JANGAN bikin penyimpanan token manual.
- Guard route: komponen <ProtectedRoute requiredRole="..."> yang membaca sesi Supabase.
- Tampilkan error OAuth (user batal, domain tidak diizinkan) dengan pesan jelas berbahasa Indonesia.

Scope file: src/pages/Auth/Login/, src/pages/Auth/Callback/, src/lib/supabase.js, komponen guard route.
Forbidden: JANGAN menulis service_role key di kode frontend — hanya VITE_SUPABASE_ANON_KEY.
  JANGAN simpan JWT manual di localStorage. JANGAN bikin sistem password sendiri di samping OAuth.
  JANGAN jadikan guard route satu-satunya pengaman — RLS di Postgres tetap wajib.
Selesai jika: login Google berhasil di URL production Vercel (bukan cuma localhost), redirect per-role benar, refresh halaman tidak membuat user logout, user tanpa role diarahkan ke onboarding.
Berhenti & tanya sebelum: mengubah konfigurasi provider Auth atau menambah provider login lain.
```
🎯 **Target:** Claude Code · 💡 Dikunci "tidak ada form password" supaya Claude tidak diam-diam membangun sistem auth kedua di samping OAuth — sumber bug paling umum saat migrasi ke OAuth.

---

## PROMPT 3 — Onboarding Pilih Peran + Consent PDP

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: fullstack engineer, patuh regulasi (UU PDP No. 27/2022).

Starting state: login Google sudah jalan (PROMPT 2). User baru punya akun Auth tapi baris profiles-nya belum punya role.
Target state: halaman /onboarding — sekali jalan — yang menetapkan peran user dan merekam consent PDP.

Baca dulu: 01-erd.mmd (profiles: role, email, consent_pdp, consent_at; companies: name, verif_status, owner).

Catatan penting: karena auth-nya OAuth Google, TIDAK ADA halaman "register" berisi form email/password.
Pendaftaran = login Google pertama kali + halaman onboarding ini.

Bangun:
- Nama & email diambil otomatis dari profil Google (read-only, tampilkan saja).
- Pilih peran: "Cari Kerja" (seeker) atau "Pasang Lowongan" (employer).
- Employer wajib mengisi nama perusahaan → buat baris companies dengan verif_status='unverified'
  dan catat user sebagai owner di company_members.
- 🔴 Checkbox consent PDP WAJIB dicentang sebelum submit; simpan consent_pdp=true + consent_at (timestamp server).
  Sertakan link ke /privasi dan /syarat di samping checkbox.
- Setelah simpan: seeker → /profil · employer → /perusahaan.
- 🔴 Halaman ini tidak bisa dilewati: user yang profiles.role masih kosong selalu dilempar balik ke /onboarding.

Scope file: src/pages/Auth/Onboarding/ + fungsi backend set-role. Skema DB hanya diubah bila kolom consent belum ada — tanya dulu.
Forbidden: JANGAN izinkan submit tanpa consent. JANGAN auto-verify perusahaan.
  JANGAN percaya role yang dikirim dari client tanpa validasi backend — user bisa mengirim role='admin'.
  Role 'admin' TIDAK BOLEH bisa dipilih lewat halaman ini.
Selesai jika: user Google baru bisa memilih peran satu kali, consent tersimpan dengan timestamp, employer baru berstatus unverified, mencoba set role='admin' lewat API ditolak.
Berhenti & tanya sebelum: mengubah skema tabel profiles/companies.
```
🎯 **Target:** Claude Code · 💡 Larangan "role dari client tanpa validasi" penting justru karena OAuth: setelah login, user punya token sah dan bisa memanggil API set-role langsung untuk mengangkat dirinya jadi admin.

---

## PROMPT 4 — Kebijakan Privasi & Syarat Penggunaan

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: frontend engineer.

Starting state: belum ada halaman legal.
Target state: dua route statis /privasi dan /syarat berisi konten Kebijakan Privasi & ToS, ter-link dari footer & form registrasi.

Bangun:
- Render dari file Markdown/MDX agar konten mudah diedit non-teknis.
- Struktur bagian: data apa yang dikumpulkan (CV, lokasi domisili, email), tujuan, penyimpanan, hak pengguna (UU PDP), kontak.
- Isi teks boleh placeholder [ISI KONTEN LEGAL] bila belum final — tandai jelas bagian yang harus diisi tim.

Scope file: src/pages/Legal/ + konten markdown. Tidak menyentuh backend.
Forbidden: jangan mengarang klaim hukum spesifik; beri placeholder untuk yang perlu ditinjau manusia.
Selesai jika: kedua halaman live & ter-link dari footer dan dari checkbox consent PDP di /onboarding (PROMPT 3).
```
🎯 **Target:** Claude Code · 💡 Konten legal ditandai placeholder agar Claude tidak mengarang pasal — wajib ditinjau tim.

---

# FASE 2 · MVP Inti — Sisi Pencari Kerja

## PROMPT 5 — Profil & Form CV Seeker

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: fullstack engineer, hati-hati soal upload file & data pribadi.

Starting state: tabel profiles ada (headline, skills[], experience_years, expected_salary_min/max, location, region_id).
Target state: halaman /profil (seeker) untuk mengisi CV terstruktur + set lokasi domisili di peta + radius preferensi + upload berkas CV.

Baca dulu: 01-erd.mmd (profiles), 02-flow-seeker.mmd (alur seeker).

Bangun:
- Form terstruktur: headline, skills (tag input), pengalaman (tahun), ekspektasi gaji min/max.
- Map picker (react-leaflet) untuk pin domisili → simpan sebagai geography(Point,4326); tentukan region_id dari titik.
- Slider radius preferensi (km).
- Upload file CV ke Supabase Storage bucket PRIVAT bernama `cv`:
  validasi tipe (pdf/doc/docx) & ukuran (maks 5MB) di server, path `cv/{user_id}/{uuid}.pdf`,
  simpan path-nya saja di DB — bukan file mentah, bukan URL publik.
  Untuk menampilkan/mengunduh, buat signed URL berumur pendek (±60 detik) saat dibutuhkan.
- 🔴 RLS policy bucket: user hanya boleh menulis ke folder {user_id} miliknya sendiri.

Peta: gunakan tiles OpenStreetMap standar
  (https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png) dan WAJIB tampilkan atribusi
  "© OpenStreetMap contributors" — ini syarat lisensi ODbL, bukan opsional.

Scope file: src/pages/Profile/Seeker/ + modul geo & upload di backend jika endpoint belum ada. Map picker jadi komponen reusable src/components/MapPicker/.
Forbidden: jangan simpan lokasi sebagai dua float. Jangan pakai bucket publik / URL permanen tanpa signing. Jangan pakai tiles Google Maps atau Mapbox.
Selesai jika: seeker bisa menyimpan profil lengkap, titik domisili tampil benar di peta, atribusi OSM terlihat, file CV ter-upload & hanya bisa diakses lewat signed URL (URL langsung ke bucket ditolak 403).
Berhenti & tanya sebelum: membuat bucket Supabase baru atau mengubah RLS policy storage.
```
🎯 **Target:** Claude Code · 💡 MapPicker dibuat reusable karena dipakai lagi di posting lowongan (Prompt 10). Atribusi OSM diangkat jadi acceptance criteria karena sering terlupa dan itu pelanggaran lisensi.

---

## PROMPT 6 — Halaman Peta Utama 🔴 (fitur paling khas)

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: frontend engineer spesialis peta interaktif & performa mobile.

Starting state: endpoint pencarian lowongan geo (ST_DWithin / bounding box) tersedia atau perlu dibuat bareng modul geo.
Target state: halaman /peta split-view: daftar lowongan (kiri) + peta (kanan) yang tersinkron, dengan clustering, radius, filter, dan versi mobile.

Baca dulu: 05-arsitektur.mmd (react-leaflet + supercluster), 02b-flow-cari-lamar.mmd, roadmap Fase 2 poin 5-7 & 9.

Bangun:
- Tiles OpenStreetMap standar + atribusi "© OpenStreetMap contributors" (wajib, lisensi ODbL).
- Split view desktop: list job card di kiri, peta di kanan.
- 🔴 Sinkron dua arah: hover job card menyorot pin, hover pin menyorot card.
- Marker clustering (supercluster) saat zoom-out.
- 🔴 Query dibatasi bounding box viewport — panggil ulang saat pan/zoom BERHENTI (debounce), jangan tiap frame, jangan tarik seluruh Jakarta.
- Radius search + tombol "lokasi saya" (geolocation).
- Filter: kategori, gaji, tipe kerja, area.
- 🔴 Mobile: peta full-screen + bottom sheet daftar lowongan (kerjakan sekarang, bukan "polish nanti").

Scope file: src/pages/Map/ + src/components/JobCard, JobList, MapView, FilterBar + service API pencarian. Modul geo backend hanya bila endpoint belum ada.
Cache: hasil query bounding box populer di-cache Redis (TTL pendek, ±60 detik) agar pan/zoom berulang tidak selalu memukul Postgres.

Forbidden: jangan render seluruh pin Jakarta sekaligus. Jangan animasi berat. Jangan panggil API tiap event pan tanpa debounce. Jangan pakai tiles berbayar (Google/Mapbox).
Selesai jika: peta memuat < 3 detik dengan 200 pin dummy; sinkron hover jalan; pan/zoom hanya menarik data viewport; atribusi OSM terlihat; versi mobile (bottom sheet) berfungsi di 375px.
Berhenti & tanya sebelum: menambah library peta/clustering selain react-leaflet + supercluster.
```
🎯 **Target:** Claude Code · 💡 Batasan bounding-box + debounce ditulis eksplisit karena ini penyebab #1 peta lemot di produk sejenis.

---

## PROMPT 7 — Detail Lowongan

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: fullstack engineer.

Starting state: tabel jobs & applications ada (lihat ERD & state 04-state-lamaran.mmd).
Target state: halaman /lowongan/:id menampilkan detail lowongan + tombol Lamar dengan pencegahan lamaran ganda.

Baca dulu: 01-erd.mmd (jobs, applications), 04-state-lamaran.mmd (UNIQUE job_id+seeker_id).

Bangun:
- Tampilkan: judul, perusahaan (badge verified), deskripsi, tipe kerja, gaji (hormati salary_visible), lokasi + mini-map, jarak dari domisili seeker.
- Tombol "Lamar" → buat application status 'submitted' + cover_note opsional.
- 🔴 Cegah lamaran ganda di level DB (UNIQUE job_id, seeker_id); jika sudah melamar, tombol jadi "Sudah dilamar".
- Hanya lowongan status 'published' yang bisa dilamar.

Scope file: src/pages/JobDetail/ + endpoint apply di modul jobs/applications.
Forbidden: jangan andalkan pengecekan ganda hanya di UI — wajib constraint DB. Jangan tampilkan gaji jika salary_visible=false.
Selesai jika: seeker bisa apply sekali, apply kedua ditolak DB, status awal 'submitted', lowongan non-published tidak bisa dilamar.
Berhenti & tanya sebelum: mengubah constraint tabel applications.
```
🎯 **Target:** Claude Code · 💡 Anti lamaran-ganda dipaksa ke constraint DB, bukan UI, sesuai catatan di diagram state.

---

## PROMPT 8 — Lamaran Saya (Seeker)

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: fullstack engineer.

Starting state: tabel applications dengan status submitted/viewed/interview/accepted/rejected.
Target state: halaman /lamaran menampilkan semua lamaran seeker beserta status terkini.

Baca dulu: 04-state-lamaran.mmd (alur status), 02b-flow-cari-lamar.mmd.

Bangun:
- Daftar lamaran: judul lowongan, perusahaan, tanggal, badge status (submitted → viewed → interview → accepted/rejected).
- Filter berdasarkan status, urut terbaru.
- Klik menuju detail lowongan.
- Otorisasi: seeker hanya melihat lamarannya sendiri (cek di backend/RLS).

Scope file: src/pages/Applications/Seeker/ + endpoint list applications by seeker.
Forbidden: jangan mengambil lamaran milik user lain; otorisasi wajib di backend.
Selesai jika: seeker melihat hanya lamarannya, status akurat sesuai state machine, akses API lamaran orang lain ditolak.
```
🎯 **Target:** Claude Code · 💡 Otorisasi kepemilikan ditegakkan di backend agar tidak bisa ditembus lewat API langsung.

---

# FASE 2 · MVP Inti — Sisi Perusahaan & Admin

## PROMPT 9 — Profil Perusahaan + Verifikasi Legalitas

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: fullstack engineer, ketat soal anti-penipuan.

Starting state: tabel companies (verif_status: unverified|pending|verified|rejected, nib, npwp) & company_members.
Target state: halaman /perusahaan untuk melengkapi profil + upload dokumen legal → status menjadi 'pending'.

Baca dulu: 01-erd.mmd (companies, company_members), 03-flow-employer.mmd, roadmap Fase 2 poin 2.

Bangun:
- Form profil: nama, slug, deskripsi, logo, website.
- Upload dokumen legalitas (NIB, NPWP) → object storage + signed URL; set verif_status='pending'.
- Tampilkan status verifikasi jelas (unverified/pending/verified/rejected + alasan jika rejected).
- 🔴 Jika belum 'verified', BLOKIR akses ke form posting lowongan (di backend, bukan cuma UI).

Scope file: src/pages/Company/Profile/ + modul companies backend + reuse komponen upload.
Forbidden: jangan izinkan posting saat status != verified. Jangan auto-approve.
Selesai jika: employer bisa submit verifikasi (status pending), tidak bisa posting sebelum verified, dokumen tersimpan aman.
Berhenti & tanya sebelum: mengubah enum verif_status atau skema companies.
```
🎯 **Target:** Claude Code · 💡 Gate "verified sebelum posting" dikunci di backend — mitigasi risiko lowongan palsu dari roadmap.

---

## PROMPT 10 — Posting Lowongan (map picker + geocoding)

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: fullstack engineer.

Starting state: MapPicker reusable sudah dibuat (Prompt 5); tabel jobs ada.
Target state: halaman /lowongan/baru untuk membuat lowongan dengan pin lokasi & geocoding alamat otomatis.

Baca dulu: 01-erd.mmd (jobs), 03b-flow-posting.mmd, MapPicker component.

Bangun:
- Form: judul, deskripsi, employment_type (fulltime/parttime/kontrak/magang), salary_min/max + salary_visible.
- Input alamat teks → geocoding via Nominatim (OpenStreetMap) → pin muncul di map picker;
  user bisa geser pin untuk koreksi → simpan geography(Point,4326).
- Tentukan region_id dari titik.
- Status: draft / published / closed. Simpan draft tanpa publish.
- 🔴 Hanya perusahaan verified yang boleh submit (cek backend).

🔴 Aturan Nominatim (kebijakan penggunaan OSM — wajib, kalau dilanggar IP diblokir):
- Panggilan geocoding HANYA dari backend, tidak langsung dari browser.
- Maksimal ±1 request/detik → debounce input alamat minimal 800ms + antre di server.
- Kirim header User-Agent / Referer berisi identitas aplikasi & email kontak.
- Cache hasil geocoding di Redis (key = alamat ternormalisasi, TTL panjang ±30 hari).
- Batasi pencarian ke Jakarta: parameter viewbox + bounded=1 + countrycodes=id.
- Sediakan fallback: kalau Nominatim gagal/timeout, user tetap bisa menaruh pin manual —
  form JANGAN sampai buntu karena layanan geocoding down.

Scope file: src/pages/JobPosting/ + modul jobs & geo backend + reuse MapPicker.
Forbidden: jangan simpan lokasi sebagai dua float. Jangan publish jika perusahaan belum verified.
  Jangan panggil Nominatim dari frontend. Jangan pakai Google Geocoding. Jangan hardcode kredensial — pakai env var.
Selesai jika: employer verified bisa membuat lowongan dengan pin akurat, geocoding mengisi pin otomatis & bisa dikoreksi manual, alamat yang sama tidak memanggil Nominatim dua kali (kena cache), form tetap bisa disubmit saat Nominatim dimatikan, draft & publish berfungsi.
Berhenti & tanya sebelum: mengganti provider geocoding atau melakukan self-host Nominatim.
```
🎯 **Target:** Claude Code · 💡 Rate limit Nominatim ditulis eksplisit karena layanan ini gratis tapi agresif memblokir; cache Redis + fallback pin manual mencegah fitur posting mati total saat OSM lambat.

---

## PROMPT 11 — Daftar Pelamar & Ubah Status (Employer)

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: fullstack engineer.

Starting state: applications dengan state machine (04-state-lamaran.mmd).
Target state: halaman /lowongan/:id/pelamar untuk perusahaan melihat pelamar & mengubah status lamaran.

Bangun:
- Daftar pelamar per lowongan: nama, headline, skills, jarak, CV (signed URL), status.
- Aksi ubah status sesuai transisi yang SAH: submitted→viewed→interview→accepted/rejected (ikuti diagram; jangan izinkan transisi ilegal).
- 🔴 Otorisasi: hanya anggota company (company_members) pemilik lowongan yang bisa lihat/ubah — tegakkan di backend.

Scope file: src/pages/Applications/Employer/ + endpoint list & update status.
Forbidden: jangan izinkan transisi status yang tidak ada di state machine. Jangan biarkan perusahaan lain melihat pelamar bukan miliknya.
Selesai jika: employer melihat pelamar lowongannya, transisi status hanya yang sah, akses lintas-perusahaan ditolak API.
Berhenti & tanya sebelum: mengubah aturan transisi status.
```
🎯 **Target:** Claude Code · 💡 Transisi status dibatasi ke state machine resmi supaya data lamaran tidak jadi tak konsisten.

---

## PROMPT 12 — Panel Admin Verifikasi

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: fullstack engineer. Halaman internal — fungsional, tidak perlu cantik.

Starting state: companies berstatus 'pending' menunggu review.
Target state: halaman /admin (role admin) untuk approve/reject verifikasi perusahaan.

Bangun:
- Daftar perusahaan status 'pending' + dokumen (NIB/NPWP via signed URL).
- Tombol Approve (verif_status='verified', set verified_by=admin, verified_at) / Reject (status='rejected' + alasan).
- 🔴 Guard route & endpoint: hanya role admin.

Scope file: src/pages/Admin/ + endpoint admin verifikasi.
Forbidden: jangan buat UI mewah. Jangan izinkan non-admin mengakses (cek backend, bukan cuma sembunyikan menu).
Selesai jika: admin bisa approve/reject, status perusahaan berubah, non-admin ditolak di level API.
Berhenti & tanya sebelum: memberi kemampuan admin menghapus data perusahaan/user.
```
🎯 **Target:** Claude Code · 💡 Sengaja "fungsional saja" sesuai roadmap — mencegah Claude over-engineer panel internal.

---

# FASE 4 · Chat & Notifikasi

## PROMPT 13 — Chat / Inbox (Socket.io)

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: fullstack engineer real-time, ketat soal otorisasi per-pesan.

🔴 BACA INI DULU — BLOKER INFRASTRUKTUR:
Frontend JOBARTA di-hosting di Vercel (serverless). Vercel TIDAK BISA menjalankan server
Socket.io: fungsinya mati setelah request selesai, sedangkan Socket.io butuh proses hidup
terus yang memegang koneksi WebSocket. Jangan coba "akali" dengan long-polling di API route
Vercel — itu akan boros, tidak stabil, dan mahal.
Sebelum menulis kode, PASTIKAN keputusan hosting chat sudah diambil:
  (A) Server Socket.io terpisah di Railway/Render/Fly.io  ← rekomendasi
  (B) Ganti ke Supabase Realtime (WebSocket dikelola Supabase)
  (C) Layanan pihak ketiga (Pusher/Ably)
Kalau belum diputuskan: BERHENTI dan tanya. Jangan pilih sendiri.

Starting state: keputusan hosting chat di atas SUDAH diambil; ada relasi lamaran seeker↔job↔company.
Target state: halaman /pesan (inbox + ruang percakapan) real-time, pesan persisten ke Postgres.

Baca dulu: roadmap Fase 4 (semua poin), khususnya aturan produk poin 2.

Bangun:
- Server Socket.io berjalan sebagai service Node terpisah (bukan di Vercel), room per
  conversation_id, pesan disimpan ke Postgres.
- Verifikasi identitas socket dengan JWT Supabase saat handshake — JANGAN percaya user_id
  yang dikirim client lewat payload socket.
- Konfigurasi CORS server socket hanya untuk domain Vercel produksi + localhost dev.
- Jika nanti server chat di-scale lebih dari 1 instance, wajib Redis adapter Socket.io
  agar pesan tersampaikan lintas instance (Redis sudah ada di stack).
- 🔴 Aturan produk (tegakkan di BACKEND): percakapan hanya bisa dimulai SETELAH ada lamaran.
- KEPUTUSAN TIM yang harus dikonfirmasi dulu: apakah kedua pihak boleh memulai chat, atau hanya perusahaan? (default aman: hanya perusahaan). JANGAN tebak — tanya sebelum implementasi.
- Inbox, status read/unread, riwayat + pagination, tombol report & block.
- 🔴 Otorisasi per-pesan: non-peserta percakapan tidak bisa baca, termasuk lewat API langsung.

Scope file: src/pages/Chat/ (frontend) + modul chat backend (socket + REST riwayat).
Forbidden: jangan kirim email/notifikasi sinkron di request (itu Prompt 14). Jangan izinkan chat tanpa lamaran. Jangan lewati otorisasi peserta.
Selesai jika: dua user beda perangkat chat real-time tanpa refresh; pesan tidak hilang saat koneksi putus-nyambung; akses percakapan orang lain via API ditolak.
Berhenti & tanya sebelum: memutuskan hosting server socket; memutuskan siapa yang boleh memulai chat (keputusan produk); menambah broker/queue baru.
```
🎯 **Target:** Claude Code · 💡 Bloker Vercel×Socket.io ditaruh di baris pertama supaya Claude tidak terlanjur menulis seluruh modul chat lalu gagal saat deploy — ini kegagalan arsitektur yang mahal kalau ketahuan belakangan.

---

## PROMPT 14 — Notifikasi (in-app + email)

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: backend-leaning fullstack engineer.

Starting state: ada event (pesan baru, perubahan status lamaran).
Target state: notifikasi in-app + email, email dikirim lewat queue (bukan sinkron di request).

Bangun:
- Notifikasi in-app: bell + daftar (pesan baru, perubahan status lamaran), read/unread.
- Email lewat queue Redis — JANGAN kirim email sinkron dalam siklus request.
- (Opsional 🟡) notifikasi lowongan baru sesuai preferensi area & kategori seeker.

Scope file: src/components/Notifications/ (frontend) + modul notifikasi backend + worker queue.
Forbidden: jangan kirim email sinkron. Jangan hardcode kredensial SMTP — pakai env var.
Selesai jika: notifikasi in-app muncul realtime/near-realtime; email masuk inbox (bukan spam) via queue; kegagalan email tidak menggagalkan request utama.
Berhenti & tanya sebelum: menambah layanan email/queue baru.
```
🎯 **Target:** Claude Code · 💡 "Email via queue, bukan sinkron" ditulis eksplisit — kesalahan umum yang bikin request lambat/gagal.

---

# FASE 5-6 · Matching, Performa & Pertumbuhan

## PROMPT 15 — Badge Matching & Rekomendasi (rule-based)

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: backend engineer.

Starting state: data jobs, profiles, applications lengkap.
Target state: skor kecocokan rule-based (BUKAN ML) 0-100 tampil sebagai badge di job card & rekomendasi kandidat untuk perusahaan.

Bangun:
- Skor 0-100 dengan bobot: jarak 30% · skill 30% · kategori 15% · pengalaman 15% · gaji 10%.
- Badge "Cocok 85%" di job card (integrasikan ke halaman /peta Prompt 6).
- Rekomendasi kandidat untuk perusahaan berdasarkan skor yang sama.
- Dokumentasikan rumus pembobotan di komentar/DOC singkat.

Scope file: modul matching backend + integrasi ke JobCard. Jangan rombak halaman peta selain menambah badge.
Forbidden: jangan pakai ML/model eksternal. Jangan ubah query geo inti selain menambah komponen skor.
Selesai jika: skor tampil & masuk akal saat dicek manual di 10 sampel; rekomendasi kandidat konsisten dengan skor.
```
🎯 **Target:** Claude Code · 💡 Ditegaskan "rule-based, bukan ML" sesuai roadmap Fase 5 agar tidak over-engineer.

---

## PROMPT 16 — Optimasi Performa & PWA

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: performance engineer frontend + backend.

Starting state: MVP jalan; peta bisa lemot pada banyak pin / HP lemah.
Target state: performa dioptimalkan + PWA installable.

Bangun:
- Redis cache untuk query area/filter populer.
- Cursor pagination + infinite scroll pada daftar lowongan.
- Debounce event pan/zoom peta (jika belum).
- Kompres aset, kecilkan bundle, hindari animasi berat.
- (🟡) PWA: installable, offline shell, push notification.

Scope file: lintas modul TAPI hanya perubahan performa & PWA — jangan ubah logika bisnis.
Forbidden: jangan mengubah perilaku fitur; ini murni optimasi. Jangan tambah dependency berat.
Selesai jika: peta tetap lancar dengan 1.000+ pin; Lighthouse mobile ≥ 80; app bisa di-install ke home screen.
Berhenti & tanya sebelum: menambah Redis/infra baru bila belum ada.
```
🎯 **Target:** Claude Code · 💡 Dikunci "murni optimasi, jangan ubah logika bisnis" agar refactor performa tidak diam-diam mengubah fitur.

---

## PROMPT 17 — Dashboard Recruiter (multi-perusahaan)

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: fullstack engineer.

Starting state: company_members & role recruiter sudah disiapkan sejak Fase 1.
Target state: dashboard /recruiter untuk mengelola beberapa perusahaan/lowongan dari satu akun.

Bangun:
- Daftar perusahaan tempat user jadi member (company_members), switcher perusahaan aktif.
- Ringkasan: lowongan aktif, pelamar masuk, rasio lamaran terbalas per perusahaan.
- Kelola lowongan & pelamar lintas perusahaan yang menjadi haknya.
- 🔴 Otorisasi: hanya perusahaan tempat user terdaftar sebagai member (owner/admin/recruiter).

Scope file: src/pages/Recruiter/ + endpoint agregasi. Reuse komponen lowongan/pelamar yang ada.
Forbidden: jangan beri akses ke perusahaan di luar keanggotaan user. Jangan duplikasi komponen — reuse.
Selesai jika: recruiter melihat & mengelola hanya perusahaan miliknya, metrik per perusahaan akurat, akses lintas-perusahaan ilegal ditolak.
Berhenti & tanya sebelum: mengubah model company_members.
```
🎯 **Target:** Claude Code · 💡 Memanfaatkan company_members yang "sudah disiapkan sejak Fase 1" — reuse, bukan bikin model baru.

---

## PROMPT 18 — Monetisasi (Featured / Kuota / Paket)

```
[TEMPEL BLOK KONTEKS PROYEK DI ATAS DULU]

Peran: fullstack engineer.

Starting state: platform sudah dipakai; pencari kerja tetap GRATIS selamanya.
Target state: fitur monetisasi sisi perusahaan — featured listing, kuota posting, paket recruiter.

Bangun:
- Featured listing: lowongan bisa ditandai featured (tampil menonjol di peta/daftar), berbatas waktu.
- Kuota posting per paket perusahaan.
- Halaman paket & status langganan perusahaan.
- 🔴 Seeker tidak pernah dikenai biaya — jangan ada paywall di sisi pencari kerja.

Scope file: src/pages/Billing/ + modul billing backend. Jangan sentuh alur seeker.
Forbidden: jangan pasang paywall apa pun untuk seeker. Jangan integrasi payment gateway tanpa konfirmasi (kredensial & pilihan provider).
Selesai jika: perusahaan bisa membeli/aktifkan paket, kuota & featured berlaku, seeker sepenuhnya gratis.
Berhenti & tanya sebelum: memilih & mengintegrasikan payment gateway.
```
🎯 **Target:** Claude Code · 💡 Aturan "seeker gratis selamanya" dikunci + payment gateway ditahan sampai konfirmasi tim.

---

## 🗂️ Ringkasan urutan pengerjaan (ikuti fase roadmap)

| # | Halaman | Fase | Prioritas |
|---|---|---|---|
| 1 | Landing / Home | 1 | ✅ |
| 2 | Login | 1 | ✅ |
| 3 | Register (seeker/employer) | 1-3 | ✅ (+consent PDP Fase 3) |
| 4 | Privasi & ToS | 3 | ✅ |
| 5 | Profil & CV Seeker | 2 | ✅ |
| 6 | **Peta Utama** | 2 | 🔴 inti |
| 7 | Detail Lowongan | 2 | ✅ |
| 8 | Lamaran Saya | 2 | ✅ |
| 9 | Profil + Verifikasi Perusahaan | 2 | ✅ 🔴 gate |
| 10 | Posting Lowongan | 2 | ✅ 🔴 |
| 11 | Daftar Pelamar | 2 | ✅ |
| 12 | Panel Admin Verifikasi | 2 | ✅ |
| 13 | Chat / Inbox | 4 | ✅ |
| 14 | Notifikasi | 4 | ✅ |
| 15 | Badge Matching | 5 | 🟡 |
| 16 | Performa & PWA | 5 | ✅/🟡 |
| 17 | Dashboard Recruiter | 6 | 🟡 |
| 18 | Monetisasi | 6 | 🟡 |

> **Catatan penting dari roadmap:** jangan lompat ke Fase 4 (Chat) sebelum Fase 3 membuktikan ada lamaran yang benar-benar direspons perusahaan. Chat tidak menyelamatkan platform yang lowongannya sepi.
