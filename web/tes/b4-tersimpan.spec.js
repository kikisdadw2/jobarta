/* BLOK B4 (lanjutan) — layar "Lowongan Tersimpan".
 *
 * Sebelum ini tombol "Simpan Lowongan" menulis ke localStorage tanpa ada
 * satu pun layar yang membacanya. Tes ini menjaga tiga hal sekaligus:
 * daftarnya muncul, kosong dijelaskan, dan simpanan yang sudah tidak tayang
 * DIHITUNG — bukan disaring diam-diam.
 */
import { test, expect } from "@playwright/test";

/* Penjaga rute menolak sesi localStorage palsu — di mode Supabase ia
 * menunggu jawaban jaringan. Jadi akunnya didaftarkan sungguhan, sama seperti
 * b4-umpan.spec.js. */
async function masuk(page) {
  const u = "ts" + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100);
  await page.goto("/daftar");
  await page.fill("#d-username", u);
  await page.fill("#d-password", "jobarta2026");
  await page.locator(".consent input[type=checkbox]").check();
  await page.click("button[type=submit]");
  const dlg = page.locator("text=Ya, lanjut tanpa email");
  if (await dlg.count()) await dlg.click();
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 20000 });
}

/** Isi simpanan sesudah sesi ada, lalu buka halamannya. */
async function bukaDenganSimpanan(page, ids) {
  await page.goto("/peta");
  await page.evaluate((x) => {
    localStorage.setItem("jobarta.simpanan", JSON.stringify(x));
  }, ids);
  await page.goto("/tersimpan");
  await page.waitForTimeout(1500);
}

test.describe("B4 lowongan tersimpan", () => {
  test("simpanan kosong: dijelaskan, dengan satu CTA ke peta", async ({ page }) => {
    await masuk(page);
    await bukaDenganSimpanan(page, []);

    await expect(page.locator("h1")).toContainText("Tersimpan");
    await expect(page.locator(".kosong h2")).toContainText("Belum ada lowongan tersimpan");
    await expect(page.locator(".kosong .tombol--primary")).toHaveAttribute("href", "/peta");
    console.log("\n  kosong: penjelasan + satu CTA");
  });

  test("simpanan yang masih tayang muncul sebagai daftar", async ({ page }) => {
    await masuk(page);
    await bukaDenganSimpanan(page, ["jkt-001", "jkt-002"]);

    await expect(page.locator(".riwayat__baris")).toHaveCount(2);
    await expect(page.locator(".akun__sub")).toContainText("2");
    // Tidak ada yang hilang, jadi kalimat "tidak tayang" TIDAK boleh muncul.
    await expect(page.locator(".akun__sub")).not.toContainText("tidak tayang");
    console.log("  2 tersimpan tampil, tanpa catatan hilang");
  });

  test("simpanan yang sudah tidak tayang dihitung, bukan disaring diam-diam", async ({ page }) => {
    await masuk(page);
    await bukaDenganSimpanan(page, ["jkt-001", "lowongan-yang-sudah-dihapus"]);

    await expect(page.locator(".riwayat__baris")).toHaveCount(1);
    /* Inti tes ini: selisih 2 tersimpan vs 1 tampil HARUS dijelaskan.
       Kalau kalimat ini hilang, orang akan mengira simpanannya lenyap. */
    await expect(page.locator(".akun__sub")).toContainText("1 lainnya sudah tidak tayang");
    console.log("  1 tampil + selisihnya dijelaskan");
  });

  test("semua simpanan hilang: bukan dibilang belum pernah menyimpan", async ({ page }) => {
    await masuk(page);
    await bukaDenganSimpanan(page, ["sudah-dihapus-a", "sudah-dihapus-b"]);

    const judul = page.locator(".kosong h2");
    await expect(judul).toContainText("sudah tidak tayang");
    await expect(judul).not.toContainText("Belum ada");
    await expect(page.locator(".kosong .tombol--primary")).toBeVisible();
    console.log("  kosong karena kedaluwarsa dibedakan dari kosong karena belum pernah");
  });

  test("hapus dari simpanan langsung mengurangi daftar", async ({ page }) => {
    await masuk(page);
    await bukaDenganSimpanan(page, ["jkt-001", "jkt-002"]);
    await expect(page.locator(".riwayat__baris")).toHaveCount(2);

    await page.locator(".tautan-aksi--rusak").first().click();
    await expect(page.locator(".riwayat__baris")).toHaveCount(1);

    // Bertahan setelah muat ulang: yang dihapus benar-benar keluar dari penyimpanan.
    await page.reload();
    await expect(page.locator(".riwayat__baris")).toHaveCount(1);
    console.log("  hapus bertahan setelah reload");
  });

  test("tautan Tersimpan ada di nav akun", async ({ page }) => {
    await masuk(page);
    await page.goto("/lamaran");
    await page.waitForTimeout(1500);
    await expect(
      page.locator(".navbar__lebar").getByRole("link", { name: "Tersimpan" })
    ).toBeVisible();
  });
});
