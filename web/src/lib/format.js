const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** "Rp 4.900.000 – Rp 5.300.000" · harian ditandai eksplisit supaya tidak dikira gaji bulanan. */
export function formatGaji(min, max, tipe) {
  if (min == null) return "Gaji tidak disebutkan";
  const satuan = tipe === "Harian" ? "/hari" : "/bulan";
  if (max == null || max === min) return `${rupiah.format(min)}${satuan}`;
  return `${rupiah.format(min)} – ${rupiah.format(max)}${satuan}`;
}

export function formatWaktu(hari) {
  if (hari === 0) return "Hari ini";
  if (hari === 1) return "Kemarin";
  if (hari < 7) return `${hari} hari lalu`;
  const minggu = Math.floor(hari / 7);
  return minggu === 1 ? "Seminggu lalu" : `${minggu} minggu lalu`;
}

/**
 * Jarak garis lurus (haversine) dalam km.
 * Ini pengganti sementara `ST_Distance` PostGIS: cukup akurat untuk skala Jakarta
 * (galat < 0,5%), dan bentuk hasilnya sama sehingga pemanggilnya tidak berubah
 * ketika perhitungan dipindah ke database.
 */
export function jarakKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatJarak(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}

/** "2 Juli 2026" — dipakai untuk tanggal verifikasi & tanggal melamar. */
export function formatTanggal(iso) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Inisial perusahaan untuk avatar, maksimal dua huruf. */
export function inisial(nama) {
  return String(nama)
    .split(/\s+/)
    .filter((k) => !/^(pt|cv|ud|toko|warung)$/i.test(k))
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase() ?? "")
    .join("");
}
