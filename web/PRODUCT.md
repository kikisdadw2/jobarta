# JOBARTA

Platform cari kerja berbasis peta interaktif untuk Jakarta. Perusahaan memasang
lowongan dengan pin lokasi; pencari kerja menemukannya lewat peta dan radius di
sekitar rumahnya, lalu melamar.

## Register

**Product.** Sebagian besar permukaannya adalah UI aplikasi: peta, panel detail,
form, onboarding, riwayat lamaran. Halaman landing satu-satunya permukaan brand,
dan ia pun tunduk pada sistem yang sama.

## Pengguna

Pencari kerja Indonesia di Jakarta: banyak lulusan SMA/SMK, pekerja informal, dan
pelaku UMKM. Mayoritas mengakses lewat **HP Android kelas menengah** dengan
koneksi 4G yang tidak stabil. Bahasa antarmuka Bahasa Indonesia, menyapa dengan
"kamu".

Sisi kedua: pemilik usaha kecil yang memasang lowongan. Belum dibangun.

## Masalah yang diselesaikan

Mencari kerja lewat daftar tanpa ujung tidak menjawab pertanyaan yang paling
menentukan bagi pekerja harian: **seberapa jauh dari rumah**. Ongkos dan waktu
tempuh sering membatalkan pekerjaan yang gajinya sudah cocok.

## Posisi strategis: kepercayaan adalah fitur utama

Risiko terbesar produk ini bukan kekurangan lowongan, melainkan **lowongan palsu
dan penipuan kerja**. Karena itu sinyal kepercayaan bukan hiasan, melainkan inti
desain, dan selalu ditampilkan lebih dulu daripada gaji:

- Badge Terverifikasi disertai tanggal pemeriksaan legalitas, supaya terbaca
  sebagai fakta yang bisa dicek, bukan stiker.
- Perusahaan yang belum terverifikasi dinyatakan dengan kalimat eksplisit.
  Ketiadaan badge tidak cukup: pengguna baru tidak tahu badge itu ada.
- Janji "JOBARTA tidak pernah meminta biaya untuk melamar" tampil di setiap
  detail lowongan.
- Tombol lapor selalu tersedia, tapi tidak pernah menyaingi aksi utama.

## Prinsip desain

1. **Satu aksi utama per layar.** Aksi lain tetap ada, hanya lebih rendah secara
   visual.
2. **Sederhana berarti sedikit elemen** — bukan elemen yang dikecilkan,
   disamarkan, atau dihilangkan labelnya. Kesederhanaan tidak pernah mengalahkan
   keterbacaan.
3. **Responsif berarti mengubah susunan**, bukan mengecilkan layout desktop.
   375px dan 1440px digambar terpisah dan memang berbeda bentuk.
4. **Warna tidak pernah jadi satu-satunya pembawa makna.** Selalu ada bentuk,
   ikon, atau kata yang mengulanginya.
5. **Pesan error menyebut cara memperbaiki**, bukan sekadar menyatakan salah.

## Anti-referensi

Bukan startup genit, bukan korporat kaku. Yang dihindari: gradien ungu/pink ala
AI, glassmorphism, animasi dekoratif tanpa makna, abu-abu di atas abu-abu, teks
abu tipis sebagai "estetika", ikon tanpa label demi tampilan bersih, font
Inter/Roboto/Arial.

## Aksesibilitas

WCAG AA ke atas. Teks isi minimal 16px di mobile. Target sentuh minimal 44×44px
dengan jarak minimal 8px. Fokus keyboard selalu terlihat. Ramah pembaca layar.

## Batasan yang mengikat

- **MVP v1 tidak mencakup** chat, matching otomatis, dan notifikasi email.
- Frontend saja sampai saat ini: tidak ada backend, data lowongan dari berkas
  statis, sesi hanya penanda di `localStorage`.
- Sumber kebenaran desain: 36 artboard di `D:\JOBARTA\design-canvas\_export`
  dan `D:\JOBARTA\BLOK-DESIGN-SYSTEM.md`.
- Tenggat ITECHNO CUP 2026: 6 September 2026, 23.59 WIB.
