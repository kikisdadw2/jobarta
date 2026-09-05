import { test, expect } from "@playwright/test";
import { employerSiap, seekerSiap, bersihkanLowonganku } from "./bantu-sesi.js";

/* Alur sisi perusahaan, ujung ke ujung.
 *
 * Yang diuji di sini bukan tampilan tiap layar, melainkan SATU KLAIM yang
 * menjadi alasan sisi employer dibangun: lowongan yang dipasang perusahaan
 * benar-benar sampai ke pencari kerja. Uji yang berhenti di "form tersimpan"
 * akan tetap hijau meskipun lowongannya tidak pernah muncul di peta.
 */

const HP = { width: 375, height: 812 };
const DESKTOP = { width: 1440, height: 900 };

/* Sesi employer SUNGGUHAN — lihat catatan di tes/bantu-sesi.js soal kenapa
   fixture localStorage berhenti bekerja. */
async function pasangSesiEmployer(page, perusahaan = null) {
  await employerSiap(page, perusahaan);
}

test.describe("sisi perusahaan", () => {
  /* Lowongan yang dipasang tes ini nyata dan tayang di peta publik. Dihapus
     sesudah tiap tes supaya peta yang dilihat orang sungguhan tidak dipenuhi
     lowongan tiruan. */
  test.afterEach(async ({ page }) => {
    await bersihkanLowonganku(page);
  });

  test("dasbor kosong mengajak memasang lowongan pertama", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangSesiEmployer(page);
    await page.goto("/perusahaan");

    await expect(page.getByRole("heading", { name: /belum ada lowongan/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /pasang lowongan pertama/i })).toBeVisible();
    // Verifikasi ditawarkan, tapi tidak menghalangi.
    await expect(page.getByText(/belum diverifikasi/i)).toBeVisible();
  });

  test("seeker tidak bisa masuk ke dasbor perusahaan", async ({ page }) => {
    await seekerSiap(page, { denganCv: false });
    await page.goto("/perusahaan");
    await page.waitForTimeout(1500);
    // Dilempar ke peta, BUKAN ke layar galat: peran yang salah bukan kesalahan.
    await expect(page).toHaveURL(/\/peta/);
  });

  test("tamu diarahkan ke Masuk dengan tujuan dibawa serta", async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto("/perusahaan/pasang");
    await expect(page).toHaveURL(/\/masuk\?peran=employer&lanjut=/);
  });

  test("form menolak lowongan tanpa gaji dan tanpa titik peta", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangSesiEmployer(page);
    await page.goto("/perusahaan/pasang");

    await page.getByLabel("Nama pekerjaan").fill("Kasir Minimarket");
    await page.getByRole("button", { name: "Pasang lowongan", exact: true }).click();

    await expect(page.getByText(/isi gaji minimum/i)).toBeVisible();
    /* Kalimat yang sama muncul dua kali di layar sempit: sebagai keterangan
       field DAN sebagai pesan galat. Keduanya sah — yang dituntut tes ini
       adalah galatnya terlihat, bukan bahwa kalimatnya unik. */
    await expect(page.getByText(/ketuk peta untuk menandai/i).first()).toBeVisible();
    // Tidak berpindah halaman selama masih ada yang salah.
    await expect(page).toHaveURL(/\/perusahaan\/pasang/);
  });

  test("lowongan yang dipasang muncul di peta pencari kerja", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await pasangSesiEmployer(page, {
      nama: "Toko Sejahtera Kemayoran",
      bidang: "Ritel",
      alamat: "Jl. Kemayoran Gempol",
      telepon: "081234567890",
      status: "belum",
    });
    await page.goto("/perusahaan/pasang");

    await page.getByLabel("Nama pekerjaan").fill("Penjaga Toko Malam");
    await page.getByLabel("Kategori").selectOption("Ritel");
    await page.getByLabel("Tipe kerja").selectOption("Penuh Waktu");
    await page.getByLabel("Minimum").fill("4800000");
    await page.getByLabel("Alamat tempat kerja").fill("Jl. Kemayoran Gempol, Jakarta Pusat");
    await page
      .getByLabel("Apa yang dikerjakan?")
      .fill("Menjaga toko pada shift malam, merapikan rak, dan mencatat stok masuk.");

    // Menandai lokasi dengan mengetuk tengah peta.
    const peta = page.locator(".peta-pilih");
    await peta.click({ position: { x: 200, y: 140 } });
    await expect(page.getByText(/lokasi ditandai/i)).toBeVisible();

    await page.getByRole("button", { name: "Pasang lowongan", exact: true }).click();
    await expect(page).toHaveURL(/\/perusahaan\?baru=1/);
    // Teksnya berubah di BLOK B4: pesan sukses ad-hoc diganti <Umpan>.
    await expect(page.getByText(/lowongan kamu sudah tayang/i)).toBeVisible();

    // Klaim intinya: pencari kerja melihatnya.
    await page.goto("/peta");
    await expect(page.getByText("Penjaga Toko Malam").first()).toBeVisible();
  });

  test("verifikasi mengubah lowongan lama jadi terverifikasi", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await pasangSesiEmployer(page, {
      nama: "Toko Sejahtera Kemayoran",
      bidang: "Ritel",
      alamat: "Jl. Kemayoran Gempol",
      telepon: "081234567890",
      status: "diproses",
      dokumen: { nama: "nib.pdf", ukuran: 120000, tipe: "application/pdf" },
    });
    // Lowongan dipasang SEBELUM verifikasi disetujui — inilah yang diuji.
    await page.addInitScript(() => {
      localStorage.setItem(
        "jobarta.lowonganku",
        JSON.stringify([
          {
            id: "lok-uji",
            posisi: "Penjaga Toko Malam",
            perusahaan: "Toko Sejahtera Kemayoran",
            kategori: "Ritel",
            tipe: "Penuh Waktu",
            gajiMin: 4800000,
            gajiMax: 4800000,
            lat: -6.1615,
            lng: 106.8632,
            alamat: "Jl. Kemayoran Gempol, Jakarta Pusat",
            deskripsi: "Menjaga toko pada shift malam dan mencatat stok masuk.",
            syarat: ["Lulusan SMA/SMK"],
            dibuatPada: new Date().toISOString(),
            aktif: true,
          },
        ])
      );
    });

    await page.goto("/perusahaan/verifikasi");
    await page.getByRole("button", { name: /simulasikan admin menyetujui/i }).click();

    await expect(page).toHaveURL(/\/perusahaan$/);
    await expect(page.getByText(/^Terverifikasi$/).first()).toBeVisible();
  });
});
