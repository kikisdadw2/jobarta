# JOBARTA — Aplikasi Web

Frontend JOBARTA: Vite + React + Leaflet, dengan Supabase sebagai backend
autentikasi dan data profil. Dokumentasi lengkap proyek ada di `../README.md`.

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local   # lalu isi kredensial Supabase
npm run dev
```

### Variabel lingkungan

| Variabel | Wajib | Keterangan |
|---|---|---|
| `VITE_SUPABASE_URL` | ya | Project URL dari dashboard Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ya | Kunci **publishable** (project lama: `anon`) |

> ⚠️ Tanpa kedua variabel ini aplikasi **tetap berjalan** memakai mode lokal:
> sesi hanya ditandai di `localStorage` dan password tidak pernah diperiksa.
> Berguna untuk demo UI tanpa backend, tapi bukan autentikasi sungguhan —
> dan tidak memunculkan pesan error apa pun, jadi mudah tertipu.
>
> Vite membaca variabel ini **saat build**, bukan saat halaman dibuka. Setelah
> mengubahnya, dev server harus di-restart dan hosting harus di-redeploy.

> 🔴 Hanya kunci klien (publishable/anon) yang boleh dipakai. Kunci `secret`
> atau `service_role` melewati seluruh Row Level Security dan tidak boleh
> masuk ke kode klien — apa pun yang berprefix `VITE_` berakhir sebagai teks
> polos di dalam bundle JavaScript.

## Menyiapkan database

Buka project Supabase → SQL Editor → jalankan `supabase/schema.sql`.
Berkas itu aman dijalankan berulang. Lalu di Authentication → Sign In / Providers
→ Email, **matikan "Confirm email"**: jalur login username memakai email sintetis
`<username>@pengguna.jobarta.local` yang tidak dapat menerima surat, sehingga akun
akan tersangkut permanen bila konfirmasi diaktifkan.

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Dev server dengan HMR |
| `npm run build` | Build produksi ke `dist/` |
| `npm run preview` | Meninjau hasil build |
| `npx playwright test` | Menjalankan tes end-to-end di `tes/` |

## Struktur

```
src/
  halaman/     13 layar (Landing, Masuk, Daftar, Peta, Profil, …)
  komponen-ui/ komponen yang dipakai ulang
  konteks/     Auth.jsx — seluruh logika sesi & autentikasi
  lib/         akses data: supabase, profil, lamaran, perusahaan
supabase/
  schema.sql   tabel profiles, trigger, RLS, RPC
tes/           spesifikasi Playwright
```
