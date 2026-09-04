/* Geolokasi — SATU SUMBER untuk seluruh aplikasi.
 *
 * 🔴 Aturan paling penting di berkas ini: JANGAN PERNAH memanggil
 *    `getCurrentPosition` tanpa konteks. Sekali pengguna menekan "Block" di
 *    prompt Chrome, izin itu tersimpan permanen untuk origin tersebut — tidak
 *    ada API yang bisa memintanya ulang, dan satu-satunya jalan pulih adalah
 *    pengguna membuka setelan situs sendiri. Jadi prompt browser hanya boleh
 *    muncul SETELAH orangnya tahu untuk apa. Lihat `PENJELASAN_DILIHAT`.
 */

/** Pusat Jakarta, dipakai saat lokasi tidak bisa dibaca. Monas. */
export const PUSAT_JAKARTA = { lat: -6.2088, lng: 106.8456 };

const KUNCI_PENJELASAN = "jobarta.lokasi.dijelaskan";

/** Sudah pernah melihat sheet penjelasan di perangkat ini? */
export function penjelasanSudahDilihat() {
  try {
    return localStorage.getItem(KUNCI_PENJELASAN) === "1";
  } catch {
    return false;
  }
}

export function tandaiPenjelasanDilihat() {
  try {
    localStorage.setItem(KUNCI_PENJELASAN, "1");
  } catch {
    /* mode privat / kuota penuh: sheet muncul lagi lain kali, tidak fatal */
  }
}

/**
 * Kenapa geolokasi tidak bisa dipakai sama sekali di perangkat/konteks ini.
 * @returns {null | { kode: string, judul: string, pesan: string }}
 */
export function penghalang() {
  /* HTTPS wajib. Di HTTP non-localhost, `navigator.geolocation` TETAP ADA tapi
     setiap panggilan langsung gagal — tanpa pemeriksaan ini pengguna melihat
     "gagal membaca lokasi" yang menyesatkan, seolah GPS-nya bermasalah. */
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return {
      kode: "TIDAK_AMAN",
      judul: "Lokasi butuh koneksi aman",
      pesan:
        "Halaman ini dibuka lewat koneksi tidak aman (HTTP), dan peramban mematikan " +
        "geolokasi di sana. Buka JOBARTA lewat alamat https:// untuk memakai fitur ini.",
    };
  }
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return {
      kode: "TIDAK_DIDUKUNG",
      judul: "Peramban ini tidak mendukung lokasi",
      pesan:
        "Kamu tetap bisa mencari dengan mengetik nama daerah di kotak lokasi, " +
        "misalnya “Tebet” atau “Cengkareng”.",
    };
  }
  return null;
}

/* Pesan dibedakan per sebab. Menyamaratakan ketiganya jadi "gagal membaca
 * lokasi" menyembunyikan satu-satunya informasi yang menentukan langkah
 * berikutnya: izin ditolak butuh setelan peramban, sinyal hilang butuh pindah
 * tempat, dan timeout cukup dicoba lagi. */
const PESAN = {
  1: {
    kode: "PERMISSION_DENIED",
    judul: "Izin lokasi ditolak",
    pesan:
      "Peramban menolak membagikan lokasimu. Kamu tetap bisa mencari dengan " +
      "mengetik nama daerah, atau nyalakan izinnya lewat langkah di bawah.",
    bisaCobaLagi: false,
  },
  2: {
    kode: "POSITION_UNAVAILABLE",
    judul: "Lokasi belum ketemu",
    pesan:
      "Izinnya sudah ada, tapi perangkatmu belum bisa memastikan posisi — " +
      "biasanya karena berada di dalam gedung. Coba dekat jendela atau di luar ruangan.",
    bisaCobaLagi: true,
  },
  3: {
    kode: "TIMEOUT",
    judul: "Terlalu lama menunggu",
    pesan: "Sinyal lokasi tidak sempat terbaca. Coba lagi sebentar.",
    bisaCobaLagi: true,
  },
};

const TAK_DIKENAL = {
  kode: "TIDAK_DIKENAL",
  judul: "Lokasi tidak terbaca",
  pesan: "Ada yang menghalangi pembacaan lokasi. Coba lagi, atau ketik nama daerah.",
  bisaCobaLagi: true,
};

export function uraikanGalat(err) {
  return PESAN[err?.code] || TAK_DIKENAL;
}

/** Bentuk posisi yang dipakai seluruh aplikasi. `akurasi` dalam meter. */
function dariPosisi(pos) {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    akurasi: pos.coords.accuracy,
    waktu: pos.timestamp,
  };
}

const OPSI = { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 };

/**
 * Minta posisi SEKALI.
 * @returns {Promise<object>} posisi, atau menolak dengan hasil `uraikanGalat`.
 */
export function mintaPosisi(opsi = {}) {
  return new Promise((selesai, gagal) => {
    const halangan = penghalang();
    if (halangan) return gagal(halangan);
    navigator.geolocation.getCurrentPosition(
      (pos) => selesai(dariPosisi(pos)),
      (err) => gagal(uraikanGalat(err)),
      { ...OPSI, ...opsi }
    );
  });
}

/**
 * Pantau posisi terus-menerus (mode "ikuti saya").
 *
 * 🔴 Pemanggil WAJIB memanggil fungsi pembersih yang dikembalikan. watchPosition
 *    yang tidak pernah dihentikan membuat GPS menyala terus dan menghabiskan
 *    baterai — di HP kelas menengah yang jadi sasaran JOBARTA, itu terasa.
 *
 * @returns {() => void} penghenti; aman dipanggil berkali-kali.
 */
export function pantauPosisi(onPosisi, onGalat, opsi = {}) {
  const halangan = penghalang();
  if (halangan) {
    onGalat?.(halangan);
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (pos) => onPosisi(dariPosisi(pos)),
    (err) => onGalat?.(uraikanGalat(err)),
    { ...OPSI, maximumAge: 5000, ...opsi }
  );
  let mati = false;
  return () => {
    if (mati) return;
    mati = true;
    navigator.geolocation.clearWatch(id);
  };
}

/**
 * Apakah izin SUDAH diberikan sebelumnya?
 *
 * Dipakai untuk melewati sheet penjelasan bagi orang yang sudah mengizinkan —
 * menjelaskan ulang sesuatu yang sudah disetujui hanya menambah satu ketukan.
 * Permissions API tidak ada di semua peramban, jadi jawabannya boleh "entah".
 *
 * @returns {Promise<"granted"|"denied"|"prompt"|"entah">}
 */
export async function statusIzin() {
  try {
    if (!navigator.permissions?.query) return "entah";
    const p = await navigator.permissions.query({ name: "geolocation" });
    return p.state;
  } catch {
    return "entah";
  }
}
