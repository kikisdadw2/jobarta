# DESIGN.md — JOBARTA

Sistem visual dikunci 2026-08-28. Sumber tunggal: `D:\JOBARTA\BLOK-DESIGN-SYSTEM.md`.
Jangan improvisasi di komponen; ubah tokennya, bukan nilainya di tempat pemakaian.

## Tema

Krem hangat, tenang, merakyat. Bukan putih klinis, bukan gelap teknis. Latar krem
dipilih karena layar dibaca di luar ruangan, di HP kelas menengah, sering di bawah
matahari Jakarta.

**Mode gelap sengaja TIDAK dipakai** (keputusan 2026-09-01). Nilai gelapnya tetap
tercatat di sistem dan di artboard `Gelap`, tapi aplikasi dikunci terang lewat
`color-scheme: light`. Jangan menambahkan blok `prefers-color-scheme` tanpa
membatalkan keputusan ini lebih dulu.

## Warna

Token di `src/tokens.css`. Rasio kontras dihitung terhadap `#F7F6F2`.

| Token | Nilai | Peran | Kontras |
|---|---|---|---|
| `--color-background` | `#F0E5CF` | latar halaman | — |
| `--color-surface` | `#F7F6F2` | kartu, panel, input | — |
| `--color-border` | `#C8C6C6` | garis pemisah saja | 1,6:1 |
| `--color-primary` | `#4B6587` | aksi, tautan, header | 5,5:1 |
| `--color-on-primary` | `#F7F6F2` | teks di atas primary | 6,0:1 |
| `--color-foreground` | `#2E3A4D` | teks isi | 10,6:1 |
| `--color-accent` | `#3F6B4F` | Terverifikasi + CTA "Lamar Sekarang" | 5,7:1 |
| `--color-destructive` | `#9E3B3B` | error dan pelaporan | 6,2:1 |
| `--color-warning` | `#A08B4A` | badge Menunggu Verifikasi | — |
| `--color-ring` | `#4B6587` | focus ring 3px, offset 2px | — |

**Aturan yang mengikat:**

1. `#C8C6C6` tidak pernah memikul makna. Ia garis, bukan teks, bukan ikon, bukan
   label nonaktif. Teks nonaktif memakai `--color-primary` dengan opacity.
2. Hijau `#3F6B4F` sengaja memikul dua peran: badge Terverifikasi dan CTA
   "Lamar Sekarang". Keduanya berarti "aman", dan pengguna sasaran belajar warna
   lebih cepat daripada ikon.
3. Merah `#9E3B3B` tidak pernah dekoratif, betapapun cocoknya dengan krem.
4. Latar `#F0E5CF` dan permukaan `#F7F6F2` cuma beda 1,16:1 — terlalu tipis untuk
   jadi satu-satunya pemisah. Kartu **wajib** punya garis atau bayangan.

## Tipografi

- **Judul:** Lexend (400/500/600/700)
- **Isi:** Source Sans 3 (400/600/700)
- **Skala:** 12 · 14 · 16 · 18 · 24 · 32 · 40
- Isi minimal 16px di mobile. Line-height 1,5–1,75. Panjang baris 60–75 karakter.
- Angka berkolom pakai `font-variant-numeric: tabular-nums`.
- Judul pakai `text-wrap: balance`.

## Spasi & layout

Ritme 8pt: `4 · 8 · 16 · 24 · 32 · 48` (token `--sp-1` … `--sp-6`).
Radius `10px` (`--radius`), bayangan kartu halus lewat `--shadow-card`.

Breakpoint yang digambar hanya dua: **375px** dan **1440px**, dengan ambang
`900px` di kode. Dua kolom di 1440px selalu menjadi satu kolom bertumpuk di 375px.
Layar penuh memakai `100dvh`, **tidak pernah** `100vh` — bilah alamat Chrome
Android mengubah tinggi viewport. Layout full-bleed menghormati
`env(safe-area-inset-*)`.

## Komponen

Berkas CSS terpisah per wilayah: `tokens.css` → `App.css` (peta & detail) →
`halaman.css` (auth & akun) → `landing.css` → `lengkapi.css` (profil, sheet,
pengingat).

- **Tombol** `.tombol` + varian `--primary` `--sekunder` `--accent` `--bahaya`
  `--penuh` `--besar`. Tinggi minimal 44px, `--besar` 52px.
- **Kartu lowongan** `.kartu` — judul, perusahaan + badge, gaji, alamat, chip.
- **Badge** `.badge--terverifikasi` (hijau) dan `.badge--menunggu` (kuning).
- **Bottom sheet** `.sheet` di bawah 900px, berubah jadi dialog tengah di atasnya.
- **Dropzone** `.dropzone` — seret-lepas dan tombol "Pilih berkas" selalu setara.
- **Chip** `.chip` untuk metadata; `.chip--rundingan` untuk gaji yang tidak disebut.

## Ikon

SVG inline saja, gaya Lucide, stroke konsisten 1,8–2,5. **Emoji tidak pernah
dipakai sebagai ikon struktural.**

## Gerak

Transisi 150–300ms, ease-out saat masuk. Hanya `transform` dan `opacity` (plus
`height` pada bottom sheet). Setiap animasi punya varian
`prefers-reduced-motion: reduce`.

## Menulis teks

Bahasa Indonesia, kalimat aktif, sapa dengan "kamu". Label tombol spesifik:
"Lamar Sekarang", bukan "Kirim". Angka pakai numeral. Elipsis "…", kutip
melengkung, `&nbsp;` untuk satuan. Mata uang lewat `Intl.NumberFormat` locale
`id-ID`: Rp 4.500.000.

## Daftar periksa sebelum menyatakan selesai

Semua harus dijawab "tidak": ada teks isi < 16px? ada field tanpa label terlihat?
ada ikon tanpa teks pendamping? ada lebih dari satu aksi utama? ada scroll
horizontal di 375px? susunan 375px cuma versi kecil dari 1440px? ada `#C8C6C6`
dipakai sebagai teks?
