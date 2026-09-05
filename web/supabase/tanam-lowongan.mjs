/* Menanam 30 lowongan contoh ke tabel `lowongan` di Supabase.
 *
 * KENAPA ADA: sampai 2026-09-05 ke-30 lowongan itu hidup di JavaScript
 * (`src/data/lowongan.js`) dan ikut ditampilkan di peta — tapi TIDAK BISA
 * DILAMAR. Kolom `lamaran.lowongan_id` bertipe uuid dan kebijakan RLS
 * `lamaran: kirim` menuntut lowongannya benar-benar ada di tabel `lowongan`.
 * Jadi setiap pengunjung yang menekan "Lamar Sekarang" di lowongan bawaan
 * mendapat galat yang menyalahkan koneksinya:
 *
 *   POST /rest/v1/lamaran → 400
 *   {"code":"22P02","message":"invalid input syntax for type uuid: \"jkt-001\""}
 *
 * Menanamnya sebagai baris sungguhan memperbaiki itu di akarnya: melamar
 * jalan, dasbor employer terisi, integritas FK utuh, dan tidak ada satu pun
 * kebijakan keamanan yang perlu dilonggarkan.
 *
 * CARA PAKAI:
 *   node supabase/tanam-lowongan.mjs
 *
 * Aman dijalankan berulang: skrip berhenti kalau tabelnya sudah berisi.
 * Kredensial akun pemilik dibuat acak dan TIDAK disimpan — akun itu cuma
 * wadah kepemilikan, tidak dipakai masuk oleh siapa pun.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import { lowongan as statis } from "../src/data/lowongan.js";

const env = (() => {
  const t = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const a = (n) => (t.match(new RegExp(`^${n}=(.*)$`, "m"))?.[1] ?? "").trim().replace(/^["']|["']$/g, "");
  return { url: a("VITE_SUPABASE_URL"), kunci: a("VITE_SUPABASE_PUBLISHABLE_KEY") || a("VITE_SUPABASE_ANON_KEY") };
})();

const SITUS = process.env.SITUS ?? "https://jobarta.vercel.app";

/** `dipostingHari` (umur dalam hari) → timestamp absolut. */
function dibuatPada(hari) {
  return new Date(Date.now() - (hari ?? 0) * 86400000).toISOString();
}

function keBaris(l, pemilik) {
  return {
    pemilik,
    posisi: l.posisi,
    perusahaan: l.perusahaan,
    kategori: l.kategori,
    tipe: l.tipe,
    gaji_min: l.gajiMin ?? null,
    gaji_max: l.gajiMax ?? null,
    lat: l.lat,
    lng: l.lng,
    alamat: l.alamat,
    deskripsi: l.deskripsi ?? "",
    syarat: l.syarat ?? [],
    // Status verifikasi ikut dibawa supaya peta tetap memperlihatkan CAMPURAN
    // terverifikasi dan belum — perbedaan itu bagian dari cerita produknya.
    terverifikasi: Boolean(l.terverifikasi),
    diverifikasi_pada: l.diverifikasiPada ?? null,
    dibuat_pada: dibuatPada(l.dipostingHari),
  };
}

const b = await chromium.launch();
const page = await b.newPage();

// Akun pemilik: didaftarkan lewat layar Daftar supaya trigger `profiles` ikut
// jalan, persis seperti pengguna sungguhan.
const nama = "contoh" + Date.now().toString(36);
const sandi = crypto.randomUUID(); // tidak pernah dicetak, tidak pernah disimpan

await page.goto(`${SITUS}/daftar`);
await page.fill("#d-username", nama);
await page.fill("#d-password", sandi);
await page.locator(".consent input[type=checkbox]").check();
await page.click("button[type=submit]");
const dlg = page.locator("text=Ya, lanjut tanpa email");
if (await dlg.count()) await dlg.click();
await page.waitForURL(/\/onboarding/, { timeout: 30000 });

const hasil = await page.evaluate(
  async ({ url, kunci, baris }) => {
    const k = Object.keys(localStorage).find((x) => x.startsWith("sb-") && x.endsWith("-auth-token"));
    const s = JSON.parse(localStorage.getItem(k));
    const sesi = s.currentSession ?? s;
    const uid = sesi.user.id;
    const h = { apikey: kunci, Authorization: `Bearer ${sesi.access_token}`, "Content-Type": "application/json" };

    const sudahAda = await (await fetch(`${url}/rest/v1/lowongan?select=id&limit=1`, { headers: h })).json();
    if (Array.isArray(sudahAda) && sudahAda.length) return { lewat: true };

    // Peran employer: dibutuhkan supaya akun ini sah memiliki lowongan.
    await fetch(`${url}/rest/v1/profiles?id=eq.${uid}`, {
      method: "PATCH",
      headers: { ...h, Prefer: "return=minimal" },
      body: JSON.stringify({ role: "employer", full_name: "Lowongan Contoh JOBARTA" }),
    });

    const isi = baris.map((r) => ({ ...r, pemilik: uid }));
    const r = await fetch(`${url}/rest/v1/lowongan`, {
      method: "POST",
      headers: { ...h, Prefer: "return=representation" },
      body: JSON.stringify(isi),
    });
    const teks = await r.text();
    return { status: r.status, jumlah: r.ok ? JSON.parse(teks).length : 0, pesan: r.ok ? null : teks.slice(0, 300) };
  },
  { url: env.url, kunci: env.kunci, baris: statis.map((l) => keBaris(l, null)) }
);

await b.close();

if (hasil.lewat) {
  console.log("Tabel `lowongan` sudah berisi — tidak ada yang ditanam.");
} else if (hasil.status >= 400) {
  console.error(`GAGAL (${hasil.status}): ${hasil.pesan}`);
  process.exit(1);
} else {
  console.log(`Ditanam ${hasil.jumlah} lowongan sebagai akun pemilik "${nama}".`);
}
