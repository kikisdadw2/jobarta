/* BLOK B5 — higienis web: judul, meta, favicon, robots, sitemap.
 *
 * Judul per rute dijaga tes karena ia jenis kerusakan yang tidak terlihat:
 * halaman tetap tampil sempurna walau judulnya salah, jadi tidak ada yang
 * melaporkannya. Yang menemukan cuma tab peramban dan hasil pencarian.
 */
import { test, expect } from "@playwright/test";
import { META_RUTE, metaUntuk, rakitJudul } from "../src/lib/useJudul.js";

/* Rute publik saja — sisanya butuh sesi dan akan dialihkan ke /masuk,
   yang membuat judulnya sah-sah saja berbeda. */
const PUBLIK = ["/", "/masuk", "/daftar", "/peta", "/lupa-password", "/verifikasi-email"];

test.describe("B5 judul per rute", () => {
  for (const rute of PUBLIK) {
    test(`${rute} punya judul sendiri`, async ({ page }) => {
      await page.goto(rute);
      await page.waitForTimeout(700);
      const judul = await page.title();
      expect(judul, `judul kosong di ${rute}`).toBeTruthy();
      expect(judul).toBe(rakitJudul(metaUntuk(rute)));
      expect(judul).toContain("JOBARTA");
      console.log(`\n  ${rute} -> "${judul}"`);
    });
  }

  test("tidak ada dua rute berbagi judul yang sama", async () => {
    const judul = META_RUTE.map(([p]) => rakitJudul(metaUntuk(p)));
    const kembar = judul.filter((j, i) => judul.indexOf(j) !== i);
    expect(kembar, `judul kembar: ${kembar.join(", ")}`).toEqual([]);
  });

  test("tidak ada dua rute berbagi deskripsi yang sama", async () => {
    const desc = META_RUTE.map(([p]) => metaUntuk(p).deskripsi);
    const kembar = desc.filter((d, i) => desc.indexOf(d) !== i);
    expect(kembar, "deskripsi kembar").toEqual([]);
  });

  test("setiap rute di App.jsx punya entri meta — tidak ada yang jatuh ke 404", async () => {
    /* Penjaga terhadap kelalaian paling mungkin: menambah rute baru lalu lupa
       menambahkan judulnya, sehingga tab-nya berbunyi "tidak ditemukan". */
    const fs = await import("node:fs");
    const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
    const rute = [...app.matchAll(/path="([^"*]+)"/g)].map((m) => m[1]);
    const bolong = rute.filter((r) => metaUntuk(r).judul === "Halaman tidak ditemukan");
    expect(bolong, `rute tanpa entri meta: ${bolong.join(", ")}`).toEqual([]);
    console.log(`\n  ${rute.length} rute di App.jsx, semuanya punya meta`);
  });

  test("navigasi memperbarui judul, dan tag description tidak digandakan", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(600);
    const awal = await page.title();

    await page.goto("/peta");
    await page.waitForTimeout(600);
    expect(await page.title()).not.toBe(awal);

    // Kalau tag ditambah alih-alih diperbarui, Googlebot membaca yang pertama
    // dan semua halaman berikutnya mewarisi deskripsi beranda.
    expect(await page.locator('meta[name="description"]').count()).toBe(1);
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc.toLowerCase()).toContain("peta");
    console.log(`\n  /peta description: "${desc.slice(0, 55)}…"`);
  });
});

test.describe("B5 berkas pendukung", () => {
  for (const [berkas, tipe] of [
    ["/favicon.ico", /icon|image/],
    ["/apple-touch-icon.png", /image\/png/],
    ["/site.webmanifest", /json|manifest/],
    ["/robots.txt", /text\/plain/],
    ["/sitemap.xml", /xml/],
    ["/og.png", /image\/png/],
  ]) {
    test(`${berkas} tersedia`, async ({ request }) => {
      const r = await request.get(berkas);
      expect(r.status(), `${berkas} tidak ada`).toBe(200);
      expect(r.headers()["content-type"] || "").toMatch(tipe);
    });
  }

  test("robots.txt melindungi rute bersesi dan menunjuk sitemap", async ({ request }) => {
    const isi = await (await request.get("/robots.txt")).text();
    for (const r of ["/profil", "/lamaran", "/tersimpan", "/perusahaan"]) {
      expect(isi, `${r} tidak di-Disallow`).toContain(`Disallow: ${r}`);
    }
    expect(isi).toContain("Sitemap:");
  });

  test("sitemap hanya memuat rute publik", async ({ request }) => {
    const isi = await (await request.get("/sitemap.xml")).text();
    expect(isi).toContain("<loc>https://jobarta.vercel.app/peta</loc>");
    for (const r of ["/profil", "/lamaran", "/perusahaan", "/onboarding"]) {
      expect(isi, `${r} bocor ke sitemap`).not.toContain(`${r}</loc>`);
    }
  });
});

test.describe("B5 meta sosial statis", () => {
  test("Open Graph lengkap dan menunjuk gambar yang benar-benar ada", async ({ page, request }) => {
    await page.goto("/");
    for (const p of ["og:title", "og:description", "og:image", "og:url", "og:type"]) {
      const isi = await page.locator(`meta[property="${p}"]`).getAttribute("content");
      expect(isi, `${p} kosong`).toBeTruthy();
    }
    const gambar = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect((await request.get(new URL(gambar).pathname)).status()).toBe(200);

    expect(await page.locator('meta[name="twitter:card"]').getAttribute("content")).toBe("summary_large_image");
    expect(await page.locator('meta[name="theme-color"]').getAttribute("content")).toBe("#4B6587");
  });

  test("JSON-LD Organization sah dan bisa diurai", async ({ page }) => {
    await page.goto("/");
    const mentah = await page.locator('script[type="application/ld+json"]').innerText();
    const data = JSON.parse(mentah);
    expect(data["@type"]).toBe("Organization");
    expect(data.name).toBe("JOBARTA");
    expect(data.url).toContain("jobarta");
  });
});
