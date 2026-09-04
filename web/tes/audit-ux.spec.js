/* AUDIT UX — mengukur, bukan menilai dari pandangan.
 * Aturan dari skill ui-ux-pro-max, prioritas CRITICAL & HIGH.
 *
 * 🔴 Audit yang berteriak palsu akan diabaikan orang, jadi pengecualian di
 *    bawah ini disengaja dan masing-masing punya alasan:
 *
 *    - Tautan sebaris di dalam kalimat DIKECUALIKAN dari aturan 44px. WCAG
 *      2.5.5 memang mengecualikannya; memaksa "Kebijakan Privasi" jadi 44px
 *      akan merusak paragrafnya, bukan memperbaiki apa pun.
 *    - `.skip-link` dilewati: ia tersembunyi sampai difokus papan ketik.
 *    - Elemen milik Leaflet dilewati: pin dan atribusi peta bukan kendali kita,
 *      dan atribusi ODbL wajib tampil apa adanya.
 *    - Sasaran yang dibentangkan `::after` (pola stretched link) diukur dari
 *      induk berposisinya, bukan kotak elemennya sendiri.
 *    - Cincin fokus TIDAK diuji di sini. `el.focus()` tidak memicu
 *      `:focus-visible` di Chromium, jadi hasilnya selalu palsu. Fokus diuji
 *      dengan Tab sungguhan di tes/kartu-tekan.spec.js.
 */
import { test } from "@playwright/test";

const HP = { width: 375, height: 812 };
const HALAMAN = ["/", "/masuk", "/daftar", "/peta"];

const AUDIT = () => {
  /* ---- kontras WCAG ---- */
  const kanal = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminansi = ([r, g, b]) =>
    0.2126 * kanal(r / 255) + 0.7152 * kanal(g / 255) + 0.0722 * kanal(b / 255);
  const urai = (s) => {
    const m = String(s).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(",").map((n) => parseFloat(n));
    return { rgb: p.slice(0, 3), alpha: p.length > 3 ? p[3] : 1 };
  };
  const latarEfektif = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const w = urai(getComputedStyle(n).backgroundColor);
      if (w && w.alpha > 0.5) return w.rgb;
      n = n.parentElement;
    }
    return [255, 255, 255];
  };
  const rasio = (a, b) => {
    const [x, y] = [luminansi(a), luminansi(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };

  const temuan = { kontras: [], sentuh: [], label: [], alt: [], judul: [] };
  const terlihat = (el) => {
    const r = el.getBoundingClientRect();
    const g = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && g.visibility !== "hidden" && g.opacity !== "0";
  };
  const jejak = (el) =>
    `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${
      el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/)[0] : ""
    }`;

  /* 1. Kontras teks */
  for (const el of document.querySelectorAll("p, span, a, li, label, h1, h2, h3, h4, button, td, th, div")) {
    if (!terlihat(el)) continue;
    const teks = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join("");
    if (teks.length < 2) continue;
    const g = getComputedStyle(el);
    const depan = urai(g.color);
    if (!depan || depan.alpha < 0.9) continue;
    const ukuran = parseFloat(g.fontSize);
    const tebal = parseInt(g.fontWeight, 10) >= 700;
    const besar = ukuran >= 24 || (tebal && ukuran >= 18.66);
    const r = rasio(depan.rgb, latarEfektif(el));
    const batas = besar ? 3 : 4.5;
    if (r < batas) {
      temuan.kontras.push(`${jejak(el)} "${teks.slice(0, 32)}" → ${r.toFixed(2)}:1 (butuh ${batas}) ${Math.round(ukuran)}px`);
    }
  }

  /* 2. Ukuran sasaran sentuh */
  const sebarisDalamKalimat = (el) => {
    if (el.tagName !== "A") return false;
    const induk = el.parentElement;
    if (!induk) return false;
    // Ada teks lain di sekitarnya = tautan ini bagian dari kalimat.
    const lain = induk.textContent.replace(el.textContent, "").trim();
    return lain.length > 0 && /^(P|LI|SPAN|LABEL|SMALL)$/.test(induk.tagName);
  };
  const dibentangkan = (el) => {
    const g = getComputedStyle(el, "::after");
    return g.content !== "none" && g.position === "absolute";
  };

  for (const el of document.querySelectorAll("button, a, input[type=checkbox], input[type=radio], [role=button]")) {
    if (!terlihat(el)) continue;
    if (el.classList.contains("skip-link")) continue;
    if (el.closest(".leaflet-container, .leaflet-control")) continue;
    if (sebarisDalamKalimat(el)) continue;
    if (el.closest("label")) continue; // kotak centang yang dibungkus label

    let r = el.getBoundingClientRect();
    if (dibentangkan(el) && el.offsetParent) r = el.offsetParent.getBoundingClientRect();

    if (r.width < 44 || r.height < 44) {
      temuan.sentuh.push(`${jejak(el)} "${(el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 24)}" → ${Math.round(r.width)}×${Math.round(r.height)}px`);
    }
  }

  /* 3. Field tanpa label */
  for (const el of document.querySelectorAll("input, select, textarea")) {
    if (!terlihat(el) || el.type === "hidden") continue;
    const punya =
      (el.id && document.querySelector(`label[for="${el.id}"]`)) ||
      el.closest("label") ||
      el.getAttribute("aria-label") ||
      el.getAttribute("aria-labelledby");
    if (!punya) temuan.label.push(`${jejak(el)} placeholder="${el.placeholder || ""}"`);
  }

  /* 5. Gambar tanpa alt */
  for (const el of document.querySelectorAll("img")) {
    if (!terlihat(el)) continue;
    if (el.getAttribute("alt") === null) temuan.alt.push(jejak(el) + " src=" + (el.src || "").slice(-40));
  }

  /* 6. Urutan judul */
  const tingkat = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
    .filter(terlihat)
    .map((h) => +h.tagName[1]);
  for (let i = 1; i < tingkat.length; i++) {
    if (tingkat[i] - tingkat[i - 1] > 1) temuan.judul.push(`h${tingkat[i - 1]} → h${tingkat[i]}`);
  }

  const unik = (a) => [...new Set(a)];
  return Object.fromEntries(Object.entries(temuan).map(([k, v]) => [k, unik(v)]));
};

for (const rute of HALAMAN) {
  test(`audit ${rute} @375px`, async ({ page }) => {
    await page.setViewportSize(HP);
    await page.goto(rute);
    await page.waitForTimeout(rute === "/peta" ? 3000 : 1200);
    const t = await page.evaluate(AUDIT);

    const bagian = [
      ["KONTRAS < WCAG AA", t.kontras],
      ["SASARAN SENTUH < 44px", t.sentuh],
      ["FIELD TANPA LABEL", t.label],
      ["GAMBAR TANPA alt", t.alt],
      ["LONCAT TINGKAT JUDUL", t.judul],
    ];
    console.log(`\n══════ ${rute} ══════`);
    for (const [nama, isi] of bagian) {
      if (!isi.length) { console.log(`  ✓ ${nama}: bersih`); continue; }
      console.log(`  ✗ ${nama}: ${isi.length}`);
      isi.slice(0, 8).forEach((x) => console.log(`      ${x}`));
      if (isi.length > 8) console.log(`      … dan ${isi.length - 8} lagi`);
    }
  });
}
