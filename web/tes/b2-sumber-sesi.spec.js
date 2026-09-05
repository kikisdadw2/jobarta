/* Regresi 2026-09-05: jalur Google berhasil masuk, lalu ditolak aplikasinya.
 *
 * Sebabnya satu kelas kesalahan, bukan satu baris: komponen membaca
 * `bacaSesi()` (localStorage) alih-alih `useAuth()`. localStorage hanya diisi
 * jalur username/password, jadi setiap pengguna Google tampak "belum masuk" —
 * di Onboarding ia ditolak mentah-mentah, di Peta ia disuruh masuk lagi tepat
 * saat menekan "Lamar Sekarang".
 *
 * lib/sesi.js sendiri sudah memperingatkan hal ini di komentar berkasnya.
 * Tes ini yang menegakkannya.
 */
import { test, expect } from "@playwright/test";
import fs from "node:fs";

const BERKAS = [
  "src/halaman/Onboarding.jsx",
  "src/halaman/Peta.jsx",
  "src/halaman/Profil.jsx",
  "src/halaman/VerifikasiEmail.jsx",
  "src/halaman/LamaranSaya.jsx",
  "src/halaman/Tersimpan.jsx",
  "src/halaman/Landing.jsx",
  "src/components/PanelDetail.jsx",
];

function isi(rel) {
  return fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
}

test("tidak ada komponen yang memutuskan status masuk dari localStorage", () => {
  const pelanggar = [];
  for (const berkas of BERKAS) {
    /* Yang dilarang adalah PEMANGGILAN `bacaSesi(`, bukan penyebutannya di
       komentar — komentar yang menjelaskan kenapa pola itu salah justru harus
       boleh tetap ada, dan memang ada di ketiga berkas yang pernah kena.

       Komentar blok dibuang lebih dulu sebagai SATU kesatuan, bukan per baris:
       versi per-baris tidak mengenali baris pembuka `/*` dan melaporkan
       komentar penjelas sebagai pelanggaran. */
    const kode = isi(berkas).replace(/\/\*[\s\S]*?\*\//g, (blok) =>
      blok.replace(/[^\n]/g, " ")
    );
    kode.split("\n").forEach((b, i) => {
      if (/\bbacaSesi\s*\(/.test(b.replace(/\/\/.*$/, ""))) {
        pelanggar.push(`${berkas}:${i + 1}`);
      }
    });
  }
  expect(
    pelanggar,
    `pakai useAuth(), bukan bacaSesi(): ${pelanggar.join(", ")}`
  ).toEqual([]);
});

test("Onboarding menjaga dengan sudahMasuk, bukan username", () => {
  const kode = isi("src/halaman/Onboarding.jsx");
  expect(kode, "masih menjaga pakai sesi.username").not.toMatch(/if\s*\(!sesi\.username\)/);
  expect(kode, "tidak menjaga dengan sudahMasuk").toMatch(/if\s*\(!sudahMasuk\)/);
  /* `username` NULL untuk pengguna Google: trigger di schema.sql mengisinya
     dari metadata yang hanya ada di jalur password. */
  expect(kode, "keadaan memuat tidak dibedakan dari belum-masuk").toMatch(/if\s*\(memuat\)/);
});

test("skema memang membiarkan username kosong untuk jalur Google", () => {
  /* Menjaga asumsi di balik perbaikan di atas. Kalau suatu saat username
     diisi juga untuk Google, tes ini gagal dan mengingatkan bahwa penjaganya
     boleh disederhanakan lagi. */
  const skema = fs.readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  expect(skema).toMatch(/username\s+text\s+unique/);
  expect(skema, "username tidak lagi diambil dari metadata").toMatch(
    /raw_user_meta_data\s*->>\s*'username'/
  );
  expect(skema, "username jadi NOT NULL — penjaga Onboarding perlu ditinjau").not.toMatch(
    /username\s+text\s+unique\s+not\s+null/i
  );
});

test.describe("Onboarding tanpa sesi tetap sopan", () => {
  test("pengunjung yang belum masuk diarahkan, bukan dibiarkan buntu", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForTimeout(2500);

    const teks = await page.locator("body").innerText();
    // Boleh "belum masuk" ATAU sudah dialihkan — yang tidak boleh: layar kosong.
    expect(teks.trim().length, "layar kosong").toBeGreaterThan(20);
    if (/belum masuk/i.test(teks)) {
      await expect(page.getByRole("link", { name: /Masuk/i }).first()).toBeVisible();
    }
  });
});
