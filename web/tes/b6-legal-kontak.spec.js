/* BLOK B6 — kontak yang bisa diklik & halaman legal.
 *
 * Yang dijaga di sini bukan penampilan, tapi janji: setiap tautan legal harus
 * mendarat di halaman sungguhan, dan setiap jalur kontak harus menuju alamat
 * yang SAMA. Kebijakan privasi yang menyebut satu alamat sementara footer
 * menyebut alamat lain membuat orang mengirim keluhan ke tempat kosong.
 */
import { test, expect } from "@playwright/test";
import { EMAIL_KONTAK } from "../src/lib/kontak.js";
import { idContoh, ID_HILANG } from "./bantu-lowongan.js";

test.describe("B6 halaman legal", () => {
  for (const [nama, rute, kunci] of [
    ["Kebijakan Privasi", "/kebijakan-privasi", /lokasi presisi/i],
    ["Syarat Penggunaan", "/syarat-penggunaan", /biaya untuk melamar|biaya melamar/i],
  ]) {
    test(`${nama} tampil dengan tanggal berlaku`, async ({ page }) => {
      await page.goto(rute);
      await page.waitForTimeout(800);

      await expect(page.locator("h1")).toContainText(nama);
      await expect(page.locator(".legal__tanggal")).toContainText("Terakhir diperbarui");
      await expect(page.locator(".legal__ringkas")).toBeVisible();
      await expect(page.locator(".legal__isi")).toContainText(kunci);
      console.log(`\n  ${rute} -> "${await page.locator("h1").innerText()}"`);
    });

    test(`${nama} menaut balik ke halaman legal satunya`, async ({ page }) => {
      await page.goto(rute);
      await page.waitForTimeout(600);
      const lain = rute === "/kebijakan-privasi" ? "/syarat-penggunaan" : "/kebijakan-privasi";
      await expect(page.locator(`.legal__silang a[href="${lain}"]`)).toBeVisible();
    });
  }

  test("Kebijakan Privasi menyebut kewajiban UU PDP yang konkret", async ({ page }) => {
    await page.goto("/kebijakan-privasi");
    await page.waitForTimeout(800);
    const teks = await page.locator(".legal__isi").innerText();

    /* Enam hal yang WAJIB ada menurut UU PDP. Kalau salah satu hilang saat
       halaman ini disunting nanti, tes ini yang memberi tahu. */
    for (const wajib of [
      /data pribadi/i,
      /dasar pemrosesan|Pasal 20/i,
      /30 hari|berapa lama|masa simpan/i,
      /hak/i,
      /mencabut persetujuan|menarik persetujuan/i,
      /lokasi presisi/i,
    ]) {
      expect(teks, `bagian wajib UU PDP hilang: ${wajib}`).toMatch(wajib);
    }
  });

  test("Kebijakan Privasi menyebut data Google DAN lokasi presisi", async ({ page }) => {
    await page.goto("/kebijakan-privasi");
    await page.waitForTimeout(800);
    const teks = await page.locator(".legal__isi").innerText();
    expect(teks).toMatch(/Google/);
    // Klaim yang harus tetap benar terhadap kode: lokasi tidak pernah dikirim.
    expect(teks).toMatch(/tidak pernah dikirim ke server/i);
  });
});

test.describe("B6 tidak ada lagi tautan legal yang mati", () => {
  for (const rute of ["/", "/masuk", "/daftar"]) {
    test(`${rute}: tautan legal menuju rute sungguhan, bukan "#"`, async ({ page }) => {
      await page.goto(rute);
      await page.waitForTimeout(800);

      const mati = await page.evaluate(() =>
        [...document.querySelectorAll("a")]
          .filter((a) => /kebijakan|privasi|syarat/i.test(a.textContent))
          .map((a) => a.getAttribute("href"))
          .filter((h) => !h || h === "#" || h.startsWith("#"))
      );
      expect(mati, `tautan legal masih mati: ${mati.join(", ")}`).toEqual([]);

      const hidup = page.locator('a[href="/kebijakan-privasi"], a[href="/syarat-penggunaan"]');
      expect(await hidup.count(), `${rute} tidak menaut ke halaman legal`).toBeGreaterThan(0);
      console.log(`\n  ${rute}: ${await hidup.count()} tautan legal hidup`);
    });
  }

  test("tautan legal benar-benar bisa diklik dan mendarat", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(800);
    await page.locator('a[href="/kebijakan-privasi"]').first().click();
    await expect(page).toHaveURL(/\/kebijakan-privasi/);
    await expect(page.locator("h1")).toContainText("Kebijakan Privasi");
  });
});

test.describe("B6 kontak bisa diklik dan konsisten", () => {
  test("semua mailto menuju satu alamat yang sama, dengan subjek terisi", async ({ page }) => {
    const alamat = new Set();
    let tanpaSubjek = [];

    for (const rute of ["/kebijakan-privasi", "/syarat-penggunaan"]) {
      await page.goto(rute);
      await page.waitForTimeout(700);
      const tautan = await page.evaluate(() =>
        [...document.querySelectorAll('a[href^="mailto:"]')].map((a) => a.getAttribute("href"))
      );
      expect(tautan.length, `${rute} tidak punya tautan mailto`).toBeGreaterThan(0);
      for (const h of tautan) {
        alamat.add(h.replace(/^mailto:/, "").split("?")[0]);
        if (!/[?&]subject=/.test(h)) tanpaSubjek.push(`${rute} ${h}`);
      }
    }

    expect([...alamat], "alamat kontak tidak konsisten").toEqual([EMAIL_KONTAK]);
    expect(tanpaSubjek, "ada mailto tanpa subjek").toEqual([]);
    console.log(`\n  semua mailto -> ${[...alamat][0]}, semuanya bersubjek`);
  });

  test("tombol Laporkan Lowongan bukan lagi tombol mati", async ({ page }) => {
    await page.goto(`/peta?lowongan=${await idContoh("jkt-001")}`);
    await page.waitForTimeout(2000);

    const lapor = page.getByRole("link", { name: /Laporkan Lowongan/i });
    await expect(lapor, "tombol laporkan tidak jadi tautan").toBeVisible();

    const href = await lapor.getAttribute("href");
    expect(href).toContain(`mailto:${EMAIL_KONTAK}`);
    expect(href, "subjek tidak menyebut lowongannya").toMatch(/subject=Laporan%20lowongan/);
    expect(href, "badan surat tidak terisi").toMatch(/[?&]body=/);
    console.log(`\n  laporkan -> ${decodeURIComponent(href).slice(0, 72)}…`);
  });

  test("sheet izin lokasi menaut ke Kebijakan Privasi", async ({ page }) => {
    /* Persetujuan izin lokasi tanpa jalan menuju penjelasan lengkapnya tidak
       memenuhi syarat "persetujuan yang diberitahukan" di UU PDP. */
    const fs = await import("node:fs");
    const src = fs.readFileSync(new URL("../src/halaman/Peta.jsx", import.meta.url), "utf8");
    expect(src, "sheet izin kehilangan tautan kebijakan").toContain('to="/kebijakan-privasi"');
  });
});
