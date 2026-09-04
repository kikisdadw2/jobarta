/* BLOK B0 — audit menyeluruh, TIDAK mengubah kode.
 * 13 rute x 3 viewport. Hasil mentah ditulis ke tes/hasil/b0.json. */
import { test, expect } from "@playwright/test";
import fs from "node:fs";

const VIEWPORT = [
  ["desktop-1440", 1440, 900],
  ["ios-390", 390, 844],
  ["android-360", 360, 740],
];

const PUBLIK = ["/", "/masuk", "/daftar", "/onboarding", "/peta", "/lupa-password", "/atur-ulang", "/verifikasi-email"];
const SEEKER = ["/profil", "/lamaran"];
const EMPLOYER = ["/perusahaan", "/perusahaan/pasang", "/perusahaan/verifikasi"];

const PASS = "jobarta2026";
/* 🔴 Maksimum 20 karakter — batas nyata yang ditegakkan lib/username.js sejak
   2026-09-04. Versi pertama fungsi ini memakai "ujisee" + Date.now() + 3 digit
   = 22 karakter, sehingga tombol Daftar TETAP NONAKTIF dan sesi tidak pernah
   terbentuk; kelima rute terlindungi lalu terbaca "redirect ke /masuk" seolah
   ada bug otorisasi. Base36 memendekkan stempel waktu dari 13 jadi 8 karakter. */
const baru = (p) => p + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100);

async function buatAkun(page, peran) {
  const u = baru(peran === "employer" ? "ue" : "us");
  process.stdout.write("    == buat akun " + peran + " (" + u + ")" + String.fromCharCode(10));

  /* Timeout dipendekkan drastis di dalam fungsi ini. Dengan default 30 detik,
     satu aksi yang gagal menahan 30 detik walau errornya ditelan .catch() —
     tujuh iterasi jadi 3,5 menit per akun, dikali dua akun dikali tiga viewport
     jadi 40 menit. Yang dibutuhkan di sini bukan kesabaran, tapi menyerah cepat. */
  const semula = 30000;
  page.setDefaultTimeout(4000);
  try {
    await page.goto("/daftar");
    await page.fill("#d-username", u);
    await page.fill("#d-password", PASS);
    await page.locator(".consent input[type=checkbox]").check();
    await page.click("button[type=submit]");
    const dlg = page.locator("text=Ya, lanjut tanpa email");
    if (await dlg.count()) await dlg.click();
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 20000 });
    await page.waitForTimeout(1200);

    const kartu = page.locator(".peran__kartu").nth(peran === "employer" ? 1 : 0);
    if (await kartu.count()) await kartu.click().catch(() => {});
    await page.waitForTimeout(300);

    for (let i = 0; i < 6; i++) {
      const cek = page.locator("input[type=checkbox]:not(:checked)");
      if (await cek.count()) await cek.first().check({ timeout: 2000 }).catch(() => {});
      const lanjut = page
        .locator("button:has-text('Lanjut'), button:has-text('Selesai'), button:has-text('Simpan'), button[type=submit]")
        .last();
      if (!(await lanjut.count())) break;
      const bisa = await lanjut.isEnabled({ timeout: 1500 }).catch(() => false);
      if (!bisa) break;
      await lanjut.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(1000);
      if (!/onboarding/.test(page.url())) break;
    }
  } catch (e) {
    process.stdout.write("    !! akun " + peran + " tidak tuntas: " + String(e).slice(0, 90) + String.fromCharCode(10));
  } finally {
    page.setDefaultTimeout(semula);
  }
  return u;
}

const PERIKSA = () => {
  const kanal = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lum = (p) => 0.2126 * kanal(p[0] / 255) + 0.7152 * kanal(p[1] / 255) + 0.0722 * kanal(p[2] / 255);
  const urai = (s) => {
    const m = String(s).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(",").map(Number);
    return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 };
  };
  const bg = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const w = urai(getComputedStyle(n).backgroundColor);
      if (w && w.a > 0.5) return w.rgb;
      n = n.parentElement;
    }
    return [255, 255, 255];
  };
  const rasio = (a, b) => {
    const s = [lum(a), lum(b)].sort((m, n) => n - m);
    return (s[0] + 0.05) / (s[1] + 0.05);
  };
  const tampak = (el) => {
    const r = el.getBoundingClientRect();
    const g = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && g.visibility !== "hidden" && g.opacity !== "0";
  };
  const jejak = (el) => {
    const k = typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/)[0] : "";
    return el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + k;
  };

  const o = { overflow: null, pelanggarOverflow: [], kontras: [], sentuh: [], teksKecil: [], linkMati: [], placeholder: [] };

  const lebar = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;
  if (sw > lebar + 1) {
    o.overflow = sw + "px > " + lebar + "px";
    const semua = document.querySelectorAll("*");
    for (const el of semua) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (getComputedStyle(el).position === "fixed") continue;
      if (r.right <= lebar + 1) continue;
      let ind = el.parentElement;
      let potong = false;
      while (ind) {
        const ox = getComputedStyle(ind).overflowX;
        if (ox === "hidden" || ox === "clip" || ox === "auto") { potong = true; break; }
        ind = ind.parentElement;
      }
      if (!potong) o.pelanggarOverflow.push(jejak(el) + " kanan=" + Math.round(r.right) + "px");
    }
  }

  for (const el of document.querySelectorAll("p,span,a,li,label,h1,h2,h3,h4,button,td,th,div,small")) {
    if (!tampak(el)) continue;
    let t = "";
    for (const n of el.childNodes) if (n.nodeType === 3) t += n.textContent.trim();
    if (t.length < 2) continue;
    const g = getComputedStyle(el);
    const fg = urai(g.color);
    if (!fg || fg.a < 0.9) continue;
    const px = parseFloat(g.fontSize);
    const tebal = parseInt(g.fontWeight, 10) >= 700;
    if (px < 14) o.teksKecil.push(jejak(el) + " " + px + "px \"" + t.slice(0, 24) + "\"");
    const batas = px >= 24 || (tebal && px >= 18.66) ? 3 : 4.5;
    const r = rasio(fg.rgb, bg(el));
    if (r < batas) o.kontras.push(jejak(el) + " " + r.toFixed(2) + ":1 (butuh " + batas + ") " + Math.round(px) + "px \"" + t.slice(0, 24) + "\"");
  }

  const sebaris = (el) => {
    if (el.tagName !== "A") return false;
    const p = el.parentElement;
    return !!p && /^(P|LI|SPAN|LABEL|SMALL)$/.test(p.tagName) && p.textContent.replace(el.textContent, "").trim().length > 0;
  };
  for (const el of document.querySelectorAll("button,a,input[type=checkbox],input[type=radio],[role=button]")) {
    if (!tampak(el) || el.classList.contains("skip-link")) continue;
    if (el.closest(".leaflet-container,.leaflet-control") || sebaris(el) || el.closest("label")) continue;
    const ga = getComputedStyle(el, "::after");
    let r = el.getBoundingClientRect();
    if (ga.content !== "none" && ga.position === "absolute" && el.offsetParent) r = el.offsetParent.getBoundingClientRect();
    if (r.width < 44 || r.height < 44) {
      const nama = (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 20);
      o.sentuh.push(jejak(el) + " " + Math.round(r.width) + "x" + Math.round(r.height) + " \"" + nama + "\"");
    }
  }

  for (const el of document.querySelectorAll("a")) {
    if (!tampak(el)) continue;
    const h = el.getAttribute("href");
    if (h === null || h === "" || h === "#") o.linkMati.push(jejak(el) + " href=\"" + h + "\" \"" + el.innerText.trim().slice(0, 24) + "\"");
  }

  const badan = document.body.innerText;
  for (const kata of ["lorem ipsum", "TODO", "FIXME", "dummy", "PLACEHOLDER", "coming soon"]) {
    const i = badan.toLowerCase().indexOf(kata.toLowerCase());
    if (i >= 0) o.placeholder.push(kata + " -> " + badan.slice(Math.max(0, i - 20), i + 40).replace(/\n/g, " "));
  }

  return o;
};

const kumpul = [];

for (const vp of VIEWPORT) {
  const namaVp = vp[0];
  test("B0 " + namaVp, async ({ page }) => {
    test.setTimeout(420000);
    await page.setViewportSize({ width: vp[1], height: vp[2] });

    const konsol = [];
    const jaringan = [];
    page.on("console", (m) => { if (m.type() === "error") konsol.push(m.text().slice(0, 160)); });
    page.on("pageerror", (e) => konsol.push("PAGEERROR " + String(e).slice(0, 160)));
    page.on("response", (r) => { if (r.status() >= 400) jaringan.push(r.status() + " " + r.url().slice(0, 110)); });

    async function audit(rute, catatan) {
      konsol.length = 0;
      jaringan.length = 0;
      process.stdout.write("    -> " + namaVp + " " + rute + String.fromCharCode(10));
      await page.goto(rute, { waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForTimeout(rute === "/peta" ? 3500 : 1400);
      let hasil;
      try { hasil = await page.evaluate(PERIKSA); } catch (e) { hasil = { galat: String(e) }; }
      kumpul.push(Object.assign({
        viewport: namaVp,
        rute,
        urlAkhir: new URL(page.url()).pathname,
        catatan: catatan || "",
        konsol: [...new Set(konsol)],
        jaringan: [...new Set(jaringan)],
      }, hasil));
    }

    for (const r of PUBLIK) await audit(r);

    await buatAkun(page, "seeker");
    for (const r of SEEKER) await audit(r, "sesi seeker");

    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
    await buatAkun(page, "employer");
    for (const r of EMPLOYER) await audit(r, "sesi employer");

    fs.mkdirSync("tes/hasil", { recursive: true });
    fs.writeFileSync("tes/hasil/b0.json", JSON.stringify(kumpul, null, 1));
    console.log("  " + namaVp + ": " + kumpul.filter((x) => x.viewport === namaVp).length + " rute diaudit");
  });
}
