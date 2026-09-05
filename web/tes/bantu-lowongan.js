/* Mengambil id lowongan SUNGGUHAN dari database.
 *
 * 🔴 Sebelum 2026-09-05 tes menyemai id hardcoded `jkt-001`. Itu berhenti
 *    bekerja begitu 30 lowongan contoh ditanam sebagai baris database dengan
 *    uuid — dan berhentinya itu benar: id `jkt-*` memang tidak pernah ada di
 *    tabel, dan lowongan ber-id seperti itu TIDAK BISA DILAMAR. Tes yang
 *    memakainya sedang menguji dunia yang tidak dihuni penggunanya.
 *
 * Mengambilnya dari database membuat tes ikut bergerak bersama data
 * sungguhan, dan gagal kalau lowongannya benar-benar hilang.
 */
import fs from "node:fs";

const env = (() => {
  const teks = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const ambil = (nama) =>
    (teks.match(new RegExp(`^${nama}=(.*)$`, "m"))?.[1] ?? "").trim().replace(/^["']|["']$/g, "");
  return {
    url: ambil("VITE_SUPABASE_URL"),
    kunci: ambil("VITE_SUPABASE_PUBLISHABLE_KEY") || ambil("VITE_SUPABASE_ANON_KEY"),
  };
})();

/** @returns {Promise<string[]>} id lowongan aktif, terbaru dulu. */
export async function idLowonganNyata(jumlah = 2) {
  const r = await fetch(
    `${env.url}/rest/v1/lowongan?select=id&aktif=eq.true&limit=${jumlah}`,
    { headers: { apikey: env.kunci, Authorization: `Bearer ${env.kunci}` } }
  );
  if (!r.ok) throw new Error(`gagal mengambil lowongan: ${r.status} ${await r.text()}`);
  const baris = await r.json();
  if (baris.length < jumlah) {
    throw new Error(
      `butuh ${jumlah} lowongan, database cuma punya ${baris.length}. ` +
        `Jalankan: node supabase/tanam-lowongan.mjs`
    );
  }
  return baris.map((b) => b.id);
}

/** Id yang dijamin TIDAK ada — untuk menguji penanganan lowongan yang hilang. */
export const ID_HILANG = "00000000-0000-4000-8000-000000000000";

/* Peta id lama → posisi. Tes visual menunjuk lowongan TERTENTU karena isinya
   penting (mis. `jkt-004` sengaja tidak terverifikasi), jadi ia tidak bisa
   sekadar mengambil yang pertama. Posisi bertahan melewati penanaman; id
   tidak. */
const POSISI = {
  "jkt-001": "Kasir Minimarket",
  "jkt-002": "Barista",
  "jkt-003": "Staf Gudang",
  "jkt-004": "Admin Data Entry",
  "jkt-021": "Operator Jahit",
};

const cache = new Map();

/** Id database untuk sebuah lowongan contoh, dicari lewat posisinya. */
export async function idContoh(idLama) {
  if (cache.has(idLama)) return cache.get(idLama);
  const posisi = POSISI[idLama];
  if (!posisi) throw new Error(`posisi untuk ${idLama} belum dipetakan di tes/bantu-lowongan.js`);
  const r = await fetch(
    `${env.url}/rest/v1/lowongan?select=id&posisi=eq.${encodeURIComponent(posisi)}&limit=1`,
    { headers: { apikey: env.kunci, Authorization: `Bearer ${env.kunci}` } }
  );
  if (!r.ok) throw new Error(`gagal mencari "${posisi}": ${r.status}`);
  const baris = await r.json();
  if (!baris.length) {
    throw new Error(`lowongan "${posisi}" tidak ada di database. Jalankan: node supabase/tanam-lowongan.mjs`);
  }
  cache.set(idLama, baris[0].id);
  return baris[0].id;
}
