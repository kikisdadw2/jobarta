# 🗺️ ROADMAP PEMBANGUNAN — JOBARTA 

**Platform Pencari Kerja Berbasis Peta Interaktif — Wilayah Jakarta**

> **Legenda:** 🔴 KRITIS = jangan dilewat, mahal diperbaiki nanti · ✅ WAJIB = harus selesai di fase itu · 🟡 OPSIONAL = kerjakan kalau waktu cukup

---

## 👥 PEMBAGIAN PERAN

| Peran | Tanggung jawab utama | Fase tersibuk |
|---|---|---|
| **Dev A — Backend & Data** | Database + PostGIS, API, auth/RBAC, query geo, keamanan | Fase 1–2 |
| **Dev B — Frontend & Peta** | React, Leaflet, komponen UI, responsif mobile, integrasi API | Fase 2, 5 |
| **Dev C — Support, QA & Dokumentasi** | Seeding data lowongan, testing, dokumen kampus, deploy/DevOps, riset user | Fase 0, 3 |

**Aturan tetap:** satu orang tetap jadi *pemilik keputusan* (siapa yang memutuskan kalau tim beda pendapat). Tanpa ini, tim kecil sering mandek di debat teknis.

---

## FASE 0 — PERSIAPAN & VALIDASI

### Tujuan
Memastikan asumsi paling berisiko sudah terbukti sebelum satu baris kode fitur ditulis.

### Langkah utama
1. ✅ Kunci definisi MVP dalam 1 halaman — tulis eksplisit **apa yang TIDAK dibuat** di v1 (chat, matching, notifikasi email).
2. 🔴 **Pilih area pilot** — 2–3 kecamatan saja (misal Pasar Minggu, Jagakarsa, Cilandak). Semua target & seeding mengacu ke area ini.
3. 🔴 **Uji akurasi geocoding** — ambil 40–50 alamat asli di area pilot (ruko, gerai, gudang), cek hasil Nominatim/OSM vs Google Geocoding. Bandingkan selisih titiknya.
   - Kalau meleset >200 m di lebih dari 20% sampel → pakai Google Geocoding untuk *input alamat*, tetap Leaflet/OSM untuk *tampilan peta*.
4. ✅ Siapkan dataset wilayah DKI Jakarta (GeoJSON batas kecamatan & kelurahan) dari sumber open data.
5. ✅ Wawancara singkat 5–10 calon pengguna (3–5 pencari kerja + 3–5 pemilik usaha di area pilot). Fokus tanya: gimana cara mereka cari kerja/karyawan sekarang, dan apa yang paling bikin frustrasi.
6. ✅ Setup repo GitHub, konvensi branch & commit, board tugas (GitHub Projects/Trello).

### Output fase (Definition of Done)
- [ ] Dokumen MVP 1 halaman, disetujui seluruh tim
- [ ] Hasil uji geocoding + keputusan final map/geocoding provider
- [ ] File GeoJSON wilayah siap pakai
- [ ] Ringkasan hasil wawancara user
- [ ] Repo + board aktif

### 📚 Artefak kampus
Latar belakang, rumusan masalah, tujuan & manfaat, analisis kebutuhan (fungsional & non-fungsional), studi literatur/tinjauan pustaka, analisis sistem berjalan.

---

## FASE 1 — FONDASI TEKNIS

### Tujuan
Semua keputusan arsitektur yang mahal diubah sudah terpasang dan terbukti jalan sampai production.

### Langkah utama
1. 🔴 Setup PostgreSQL **+ ekstensi PostGIS**, buat skema database lengkap sesuai blueprint Bagian 5 — termasuk tabel `company_members` sejak awal, walaupun fitur recruiter belum dibuat.
2. 🔴 Kolom lokasi pakai tipe `geography(Point,4326)` + **spatial index GiST**, bukan dua kolom float.
3. ✅ Import data wilayah DKI ke tabel `regions`.
4. ✅ Bangun autentikasi: register, login, JWT (access + refresh), RBAC middleware per role.
5. ✅ Struktur backend **modular monolith** — pisahkan folder per modul (`auth`, `jobs`, `geo`, `users`), satu deployment.
6. ✅ Setup frontend React + Vite, routing, layout dasar, state management, koneksi ke API.
7. 🔴 Pipeline deploy sampai tuntas: staging + production, CI/CD GitHub Actions, **backup DB otomatis harian**, error tracking (Sentry) — pasang sekarang, bukan nanti.

### Output fase (Definition of Done)
- [ ] Query `ST_DWithin` radius 5 km berhasil dijalankan dengan data dummy
- [ ] User bisa register + login di **environment production**, bukan cuma lokal
- [ ] Push ke `main` otomatis ter-deploy
- [ ] Backup DB terjadwal & sudah diuji restore-nya sekali

### Buat Catatan Singkat
ERD, skema relasi antar tabel, struktur navigasi, spesifikasi database, diagram arsitektur sistem.

---

## FASE 2 — MVP INTI

### Tujuan
Alur nilai utama jalan penuh: **perusahaan posting lowongan → pencari kerja menemukannya lewat peta → melamar.**

### Langkah utama
1. ✅ Profil pencari kerja: form CV terstruktur, upload file CV (validasi tipe & ukuran, simpan di object storage + signed URL), set lokasi rumah via map picker, radius preferensi.
2. ✅ Profil perusahaan + alur **verifikasi legalitas** — upload dokumen, status `pending/verified/rejected`, review manual admin. 🔴 Perusahaan belum verified **tidak boleh** posting.
3. ✅ Panel admin sederhana untuk approve/reject verifikasi (cukup halaman internal, tidak perlu cantik).
4. ✅ Posting lowongan: form + **map picker untuk pin lokasi** + geocoding alamat otomatis, status draft/aktif/tutup.
5. 🔴 **Halaman peta utama** — split view (daftar kiri + peta kanan), render pin, sinkron hover pin ↔ job card, tombol "lokasi saya".
6. 🔴 Radius search + filter (kategori, gaji, tipe kerja, area) — query dibatasi ke **bounding box viewport**, jangan tarik seluruh Jakarta tiap pan/zoom.
7. ✅ Marker clustering saat zoom-out.
8. ✅ Sistem lamaran: tombol apply, cegah lamaran ganda, status tracking (Applied → Reviewed → Shortlisted → Rejected/Accepted), halaman "Lamaran Saya" & daftar pelamar untuk perusahaan.
9. 🔴 **Responsif mobile** — peta full-screen + bottom sheet. Kerjakan bersamaan, jangan ditunda jadi "polish nanti".
10. ✅ Rate limiting (login, apply, posting) + validasi input schema di semua endpoint.

### Output fase (Definition of Done)
- [ ] Satu orang bisa jalanin alur penuh dari nol: daftar akun perusahaan → verifikasi → posting → akun seeker cari di peta → apply → perusahaan lihat & ubah status
- [ ] Alur di atas lancar di HP Android kelas menengah dengan koneksi 4G biasa
- [ ] Halaman peta muat < 3 detik dengan 200 pin dummy

### Buat Catatan Singkat
Use case diagram, activity diagram, sequence diagram, screenshot antarmuka, spesifikasi fungsional.

---

## FASE 3 — SEEDING & RILIS TERBATAS 🔴

### Tujuan
Produk dipakai manusia asli sebelum tim menghabiskan 4 minggu lagi bikin chat.

### Langkah utama
1. 🔴 **Seed sisi lowongan dulu** — target 30–50 lowongan asli di area pilot. Cara: datangi/hubungi langsung UMKM, ritel, F&B, gudang di area itu, tawarkan posting gratis, input manual kalau perlu.
2. ✅ Tulis Kebijakan Privasi & Syarat Penggunaan (wajib sebelum ada user asli, sesuai UU PDP No. 27/2022) + checkbox consent saat registrasi.
3. ✅ Undang 20–30 pencari kerja dari area pilot untuk closed beta.
4. ✅ Pasang analitik dasar: berapa yang daftar, berapa yang apply, berapa lamaran yang direspons perusahaan.
5. ✅ Kumpulkan feedback langsung — wawancara singkat 5–10 user beta.

### Output fase (Definition of Done)
- [ ] Minimal 30 lowongan aktif di area pilot
- [ ] Minimal 20 pencari kerja terdaftar & ada lamaran masuk
- [ ] Kebijakan Privasi & ToS live di website
- [ ] Daftar temuan bug + keluhan user, sudah diprioritaskan

### Buat Catatan Singkat
> Sebelum lanjut ke Fase 4, jawab jujur: **apakah ada lamaran yang benar-benar direspons perusahaan?**
> - **Ya, ada respons & user balik lagi** → lanjut Fase 4, chat memang kebutuhan nyata.
> - **Tidak, lamaran nyangkut / user tidak balik** → **jangan lanjut ke chat.** Ulang Fase 3: perbaiki kualitas & jumlah lowongan dulu. Chat tidak akan menyelamatkan platform yang lowongannya sepi.

### Buat Catatan Singkat
Hasil pengujian black box, kuesioner kepuasan pengguna (bisa pakai skala Likert / SUS), analisis hasil uji coba.

---

## FASE 4 — CHAT & NOTIFIKASI

### Tujuan
Memangkas friksi komunikasi antara pelamar dan perusahaan.

### Langkah utama
1. ✅ Socket.io di server Node yang sama, room per `conversation_id`, pesan persisten ke Postgres.
2. 🔴 **Aturan produk:** percakapan hanya bisa dimulai setelah ada lamaran. Tetapkan di level backend, bukan cuma disembunyikan di UI.
   - *Keputusan yang perlu diambil tim:* apakah kedua pihak boleh memulai chat, atau hanya perusahaan? Membatasi ke perusahaan lebih aman dari spam, tapi menutup jalan seeker bertanya duluan. Pilih satu dan konsisten.
3. ✅ Inbox, status read/unread, riwayat dengan pagination, tombol report & block.
4. ✅ Notifikasi in-app (pesan baru, perubahan status lamaran) + email (pakai queue Redis, jangan kirim sinkron di request).
5. 🟡 Notifikasi lowongan baru sesuai preferensi area & kategori seeker.
6. ✅ Otorisasi per-pesan — pastikan non-peserta percakapan tidak bisa baca, termasuk lewat akses API langsung.

### Output fase (Definition of Done)
- [ ] Dua user beda perangkat bisa chat real-time tanpa refresh
- [ ] Pesan tidak hilang saat koneksi putus lalu nyambung lagi
- [ ] Percobaan akses percakapan orang lain lewat API ditolak
- [ ] Email notifikasi masuk inbox, bukan spam

### Buat Catatan Singkat
Sequence diagram alur chat, dokumentasi pengujian keamanan/otorisasi.

---

## FASE 5 — MATCHING, PERFORMA & POLISH

### Tujuan
Meningkatkan relevansi & kualitas pengalaman, setelah alur inti terbukti dipakai.

### Langkah utama
1. 🟡 **Matching rule-based** (bukan ML): skor 0–100 dengan bobot jarak 30% · skill 30% · kategori 15% · pengalaman 15% · gaji 10%. Tampilkan badge "Cocok 85%" di job card.
2. 🟡 Rekomendasi kandidat untuk perusahaan berdasarkan skor yang sama.
3. ✅ Optimasi performa: cache Redis untuk query area/filter populer, cursor pagination + infinite scroll, debounce event pan/zoom peta.
4. ✅ Uji di HP kelas bawah & koneksi lambat — kompres aset, kurangi ukuran bundle, hindari animasi berat.
5. 🟡 PWA: installable ke home screen, offline shell, push notification.
6. ✅ Perbaikan UX berdasarkan temuan beta Fase 3.

### Output fase (Definition of Done)
- [ ] Skor kecocokan tampil & masuk akal saat dicek manual di 10 sampel
- [ ] Peta tetap lancar dengan 1.000+ pin
- [ ] Lighthouse mobile score ≥ 80
- [ ] Semua keluhan prioritas tinggi dari beta sudah ditangani

### Buat Catatan Singkat
Dokumentasi algoritma matching + rumus pembobotan, hasil pengujian performa.

---

## FASE 6 — RILIS PUBLIK & PERTUMBUHAN

### Langkah utama
1. ✅ Buka pendaftaran publik, tapi **perluas area bertahap** — kecamatan sebelah dulu, bukan langsung se-Jakarta. Pastikan tiap area baru punya cukup lowongan sebelum diumumkan.
2. ✅ Pantau metrik kesehatan platform: **rasio lamaran terbalas** (bukan cuma jumlah user), jumlah lowongan aktif per area, retensi 7 hari.
3. 🟡 Aktifkan monetisasi: featured listing, kuota posting, paket recruiter. Pencari kerja tetap gratis selamanya.
4. 🟡 Bangun fitur recruiter/agen penuh (dashboard multi-perusahaan) — infrastruktur datanya sudah disiapkan sejak Fase 1.
5. ✅ Rutinitas operasional: review verifikasi perusahaan, moderasi laporan, patch keamanan.

### Buat Catatan Singkat
Kesimpulan, saran pengembangan, dokumentasi teknis/manual pengguna.

---

## ⚠️ RISIKO UTAMA & MITIGASI

| Risiko | Dampak | Mitigasi |
|---|---|---|
| 🔴 Lowongan sepi saat user datang | Fatal — user pergi & tidak balik | Seed 30–50 lowongan manual **sebelum** undang seeker (Fase 3) |
| 🔴 Akurasi geocoding OSM buruk di gang/jalan kecil | Fitur inti rusak | Diuji di Fase 0, siap beralih ke Google Geocoding untuk input alamat |
| 🔴 Lowongan palsu / penipuan | Reputasi hancur permanen | Verifikasi legalitas wajib sebelum posting (Fase 2) + tombol report |
| Scope creep — fitur nambah terus | Molor berbulan-bulan | Dokumen MVP 1 halaman jadi acuan; fitur baru masuk backlog, bukan sprint berjalan |
| Tim kecil kehabisan tenaga | Proyek mandek di tengah | Rilis terbatas di Fase 3 memberi bukti nyata & motivasi sebelum fase panjang berikutnya |
| Kehilangan data CV/lowongan | Fatal & masalah hukum | Backup harian otomatis sejak Fase 1, sudah diuji restore |

---

