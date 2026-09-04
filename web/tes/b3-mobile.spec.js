/* BLOK B3 — mobile & overflow di enam viewport. */
import { test, expect } from "@playwright/test";

const VIEWPORT = [
  [360, 740], [390, 844], [414, 896],
  [768, 1024], [1024, 768], [1440, 900],
];
const RUTE = ["/", "/masuk", "/daftar", "/peta", "/lupa-password", "/verifikasi-email"];

/** Elemen yang benar-benar melewati tepi kanan, bukan yang induknya memotong. */
const UKUR = () => {
  const lebar = document.documentElement.clientWidth;
  const nakal = [];
  for (const el of document.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (getComputedStyle(el).position === "fixed") continue;
    if (r.right <= lebar + 1) continue;
    let ind = el.parentElement, potong = false;
    while (ind) {
      const ox = getComputedStyle(ind).overflowX;
      if (ox === "hidden" || ox === "clip" || ox === "auto") { potong = true; break; }
      ind = ind.parentElement;
    }
    if (!potong) {
      const k = typeof el.className === "string" ? el.className.split(/\s+/)[0] : "";
      nakal.push(`${el.tagName.toLowerCase()}.${k} kanan=${Math.round(r.right)}`);
    }
  }
  return { lebar, scroll: document.documentElement.scrollWidth, nakal: nakal.slice(0, 5) };
};

/** Input < 16px memicu zoom otomatis iOS saat difokus.
 *
 * Hanya kolom ISIAN TEKS yang memicunya. Checkbox dan radio memakai 13,3px
 * bawaan peramban dan tidak pernah membuat iOS memperbesar layar — memaksanya
 * 16px cuma membesarkan kotak centangnya tanpa alasan. */
const TIPE_TEKS = ["text", "password", "email", "search", "tel", "url", "number", "date", "datetime-local", "month", "time", "week"];
const INPUT_KECIL = (tipe) =>
  [...document.querySelectorAll("input, select, textarea")]
    .filter((el) => {
      if (el.offsetParent === null) return false;
      if (el.tagName === "INPUT" && !tipe.includes(el.type)) return false;
      return parseFloat(getComputedStyle(el).fontSize) < 16;
    })
    .map((el) => `${el.id || el.name || el.type}: ${getComputedStyle(el).fontSize}`);

for (const [w, h] of VIEWPORT) {
  test(`B3 ${w}x${h}: tidak ada scroll horizontal`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: w, height: h });
    const laporan = [];
    for (const rute of RUTE) {
      await page.goto(rute);
      await page.waitForTimeout(rute === "/peta" ? 3000 : 900);
      const u = await page.evaluate(UKUR);
      const kecil = await page.evaluate(INPUT_KECIL, TIPE_TEKS);
      laporan.push(`${rute.padEnd(20)} scroll=${u.scroll}/${u.lebar}` +
        (u.nakal.length ? ` ✗ ${u.nakal.join(" | ")}` : "") +
        (kecil.length ? ` ✗ input<16px: ${kecil.join(", ")}` : ""));
      expect(u.scroll, `overflow di ${rute} @${w}px`).toBeLessThanOrEqual(u.lebar + 1);
      expect(kecil, `input <16px di ${rute} (iOS auto-zoom)`).toEqual([]);
    }
    console.log(`\n  === ${w}x${h} ===\n  ` + laporan.join("\n  "));
  });
}

test.describe("B3 laci navigasi", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  /* Diuji di /lamaran, bukan /profil: NavAkun dipakai LamaranSaya, sedangkan
     layar Profil sengaja minimalis tanpa nav sama sekali. */
  async function masuk(page) {
    const u = "b3" + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100);
    await page.goto("/daftar");
    await page.fill("#d-username", u);
    await page.fill("#d-password", "jobarta2026");
    await page.locator(".consent input[type=checkbox]").check();
    await page.click("button[type=submit]");
    const dlg = page.locator("text=Ya, lanjut tanpa email");
    if (await dlg.count()) await dlg.click();
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 20000 });
  }

  test("hamburger muncul di sempit dan menu terbentang di lebar", async ({ page }) => {
    await masuk(page);
    await page.goto("/lamaran");
    await page.waitForTimeout(1500);
    await expect(page.locator(".hamburger")).toBeVisible();

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(400);
    await expect(page.locator(".hamburger")).toBeHidden();
    await expect(page.locator(".navbar__lebar .navbar__nav")).toBeVisible();
  });

  test("aria-expanded, Escape, dan kunci scroll body", async ({ page }) => {
    await masuk(page);
    await page.goto("/lamaran");
    await page.waitForTimeout(1500);

    const tombol = page.locator(".hamburger");
    await expect(tombol).toHaveAttribute("aria-expanded", "false");
    const kontrol = await tombol.getAttribute("aria-controls");
    expect(kontrol, "aria-controls kosong").toBeTruthy();

    await tombol.click();
    await expect(tombol).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".laci")).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow), "scroll body tidak dikunci").toBe("hidden");
    expect(await page.evaluate((id) => Boolean(document.getElementById(id)), kontrol)).toBe(true);

    await page.keyboard.press("Escape");
    await expect(page.locator(".laci")).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow), "scroll body tetap terkunci").not.toBe("hidden");
    console.log("\n  aria-expanded, Escape, dan kunci scroll body: benar");
  });

  test("fokus terjebak di dalam laci dan kembali ke hamburger", async ({ page }) => {
    await masuk(page);
    await page.goto("/lamaran");
    await page.waitForTimeout(1500);
    await page.click(".hamburger");
    await page.waitForTimeout(300);

    // Tab sepuluh kali; fokus tidak boleh keluar dari laci.
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      const diDalam = await page.evaluate(() =>
        Boolean(document.activeElement?.closest(".laci"))
      );
      expect(diDalam, `fokus lolos ke luar laci pada Tab ke-${i + 1}`).toBe(true);
    }

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    const kembali = await page.evaluate(() =>
      document.activeElement?.classList.contains("hamburger")
    );
    expect(kembali, "fokus tidak kembali ke tombol hamburger").toBe(true);
    console.log("  fokus terjebak 10 Tab, lalu kembali ke hamburger");
  });
});
