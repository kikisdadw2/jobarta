/* Regresi tata letak. Empat bug yang dijaga, semuanya ditemukan 2026-09-04
 * dari tangkapan layar HP dan laptop:
 *
 *   FIX 1 — `.perusahaan` dipakai dua maksud: App.css memberinya `display:flex`
 *           untuk baris logo+nama di panel detail, sementara tiga halaman sisi
 *           perusahaan memakainya sebagai pembungkus halaman. Akibatnya seluruh
 *           isi halaman berjajar jadi kolom selebar ~90px.
 *   FIX 2 — `.navbar--landing` memakai `flex-wrap: nowrap`, jadi menu mobile
 *           yang ber-`flex-basis:100%` tidak bisa turun baris dan mendorong
 *           halaman 79px ke luar layar kanan.
 *   FIX 4 — `posisiSaya` dihitung tapi tidak pernah dioper ke peta, jadi tidak
 *           ada penanda posisi pengguna sama sekali.
 */
import { test, expect } from "@playwright/test";

const HP = { width: 375, height: 812 };
const MONAS = { latitude: -6.1754, longitude: 106.8272 };

async function ukurOverflow(page) {
  return page.evaluate(() => {
    const lebar = document.documentElement.clientWidth;
    const nakal = [];
    for (const el of document.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (getComputedStyle(el).position === "fixed") continue;
      if (r.right > lebar + 1) {
        // abaikan yang induknya memang memotong (tile peta)
        let ind = el.parentElement, dipotong = false;
        while (ind) {
          const o = getComputedStyle(ind).overflowX;
          if (o === "hidden" || o === "clip" || o === "auto") { dipotong = true; break; }
          ind = ind.parentElement;
        }
        if (!dipotong) nakal.push(`${el.tagName.toLowerCase()}.${(el.getAttribute("class")||"").split(" ")[0]} → kanan ${Math.round(r.right)}px`);
      }
    }
    return { lebar, scrollWidth: document.documentElement.scrollWidth, nakal: nakal.slice(0, 10) };
  });
}

test("FIX 2 — Landing 375px: menu terbuka tidak lagi meluber", async ({ page }) => {
  await page.setViewportSize(HP);
  await page.goto("/");
  const tutup = await ukurOverflow(page);
  console.log(`\n  menu TERTUTUP : scrollWidth ${tutup.scrollWidth}px (viewport ${tutup.lebar}px)`);
  expect(tutup.scrollWidth, "menu tertutup").toBeLessThanOrEqual(tutup.lebar + 1);

  await page.click("button:has-text('Menu')");
  await page.waitForTimeout(400);
  const buka = await ukurOverflow(page);
  console.log(`  menu TERBUKA  : scrollWidth ${buka.scrollWidth}px · pelanggar: ${JSON.stringify(buka.nakal)}`);
  await page.screenshot({ path: "tes/hasil/fix-landing-375-menu.png" });
  expect(buka.scrollWidth, "menu terbuka").toBeLessThanOrEqual(buka.lebar + 1);
  // menu harus benar-benar terlihat, bukan sekadar tidak meluber
  await expect(page.locator("#menu-utama")).toBeVisible();
  await expect(page.locator("#menu-utama a").first()).toBeInViewport();
});

test("FIX 2b — Landing 1440px menu tetap satu baris", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const a = await ukurOverflow(page);
  console.log(`\n  1440px scrollWidth ${a.scrollWidth}px · pelanggar ${JSON.stringify(a.nakal)}`);
  const nav = page.locator("#menu-utama");
  await expect(nav).toBeVisible();
  const kotak = await nav.boundingBox();
  const header = await page.locator("header.navbar--landing").boundingBox();
  console.log(`  nav tinggi ${Math.round(kotak.height)}px · header tinggi ${Math.round(header.height)}px`);
  // satu baris = tinggi nav jauh di bawah tinggi header bertumpuk
  expect(kotak.height).toBeLessThan(80);
  await page.screenshot({ path: "tes/hasil/fix-landing-1440.png" });
});

test("FIX 4 — titik lokasi muncul di peta setelah izin diberikan", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation(MONAS);
  await page.setViewportSize(HP);
  await page.goto("/peta");
  await page.waitForTimeout(2000);

  await expect(page.locator(".titik-saya")).toHaveCount(0);   // belum diminta
  await page.click("[aria-label='Lokasi saya']");
  await page.waitForTimeout(2500);

  const titik = page.locator(".titik-saya");
  await expect(titik).toHaveCount(1);
  await expect(titik).toBeVisible();
  const kotak = await titik.boundingBox();
  const panel = await page.locator(".panel").boundingBox();
  console.log(`\n  titik-saya di (${Math.round(kotak.x)}, ${Math.round(kotak.y)}) · sheet mulai y=${Math.round(panel.y)}`);
  /* Harus mendarat di bagian peta yang TERLIHAT. Sebelum offset ditambahkan
     titiknya jatuh di y=395, persis di balik bottom sheet: peta bergerak tapi
     tidak ada yang tampak berubah di layar. */
  expect(kotak.y + kotak.height, "titik tertutup bottom sheet").toBeLessThan(panel.y);
  await page.screenshot({ path: "tes/hasil/fix-titik-lokasi.png" });

  const a = await ukurOverflow(page);
  expect(a.scrollWidth).toBeLessThanOrEqual(a.lebar + 1);
});

test("FIX 1 — pembungkus halaman perusahaan bukan flex row lagi", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  /* Yang diuji adalah CASCADE-nya, bukan halamannya — jadi tidak perlu login
     sebagai employer. Bug-nya murni tabrakan nama kelas: `.perusahaan` di
     App.css (baris logo+nama di panel detail) ikut kena ke pembungkus halaman. */
  const hasil = await page.evaluate(() => {
    const buat = (kelas) => {
      const el = document.createElement("main");
      el.className = kelas;
      document.body.appendChild(el);
      const g = getComputedStyle(el);
      const nilai = { display: g.display, maxWidth: g.maxWidth };
      el.remove();
      return nilai;
    };
    return { lama: buat("seksi perusahaan"), baru: buat("seksi halaman-perusahaan") };
  });
  console.log(`\n  .seksi.perusahaan          → display:${hasil.lama.display} maxWidth:${hasil.lama.maxWidth}`);
  console.log(`  .seksi.halaman-perusahaan  → display:${hasil.baru.display} maxWidth:${hasil.baru.maxWidth}`);

  // Kelas baru harus blok biasa dengan lebar baca yang benar.
  expect(hasil.baru.display, "pembungkus halaman jangan flex").toBe("block");
  expect(hasil.baru.maxWidth).toBe("760px");
  // Dan kelas lama memang masih flex — itu wajar, ia milik panel detail.
  expect(hasil.lama.display).toBe("flex");
});

test("FIX 2c — menu terbuka tidak menampilkan tautan ganda", async ({ page }) => {
  await page.setViewportSize(HP);
  await page.goto("/");
  await page.click("button:has-text('Menu')");
  await page.waitForTimeout(300);

  const employer = page.locator("header a", { hasText: "Untuk Perusahaan" });
  const terlihat = await employer.evaluateAll((els) =>
    els.filter((e) => e.offsetParent !== null).length
  );
  console.log(`\n  tautan "Untuk Perusahaan" yang terlihat: ${terlihat}`);
  expect(terlihat, "tautan tampil ganda").toBe(1);

  // Tombol Tutup harus tetap sebaris dengan logo, bukan turun sendiri.
  const merek = await page.locator("header .merek").boundingBox();
  const tutup = await page.locator("button:has-text('Tutup')").boundingBox();
  console.log(`  merek y=${Math.round(merek.y)} · tombol Tutup y=${Math.round(tutup.y)}`);
  expect(Math.abs(merek.y - tutup.y), "Tutup turun ke baris sendiri").toBeLessThan(30);

  await page.screenshot({ path: "tes/hasil/fix-landing-375-menu.png" });
});
