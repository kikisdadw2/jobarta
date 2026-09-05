/* BLOK B7 — poles visual, dijaga dengan angka.
 *
 * Kontras dihitung dari tokens.css, bukan dari tangkapan layar: nilainya jadi
 * fakta yang bisa diulang, dan setiap perubahan palet yang menjatuhkannya di
 * bawah WCAG AA langsung memerahkan tes ini.
 *
 * Pelajaran yang membentuk berkas ini: `--color-warning-teks` pernah dinyatakan
 * "lolos kontras" karena diuji di atas SATU permukaan saja. Di atas latar krem
 * ia sebenarnya 4,17:1. Karena itu setiap warna teks di sini diuji terhadap
 * KEDUA permukaan.
 */
import { test, expect } from "@playwright/test";
import fs from "node:fs";

/* Komentar dibuang lebih dulu. Tanpa itu, kalimat penjelas yang menyebut nama
   token diikuti titik dua ikut terbaca sebagai deklarasi — dan karena
   Object.fromEntries memenangkan kecocokan TERAKHIR, nilai token yang sah
   tertimpa oleh potongan prosa. */
const tokens = (() => {
  const teks = fs
    .readFileSync(new URL("../src/tokens.css", import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  return Object.fromEntries(
    [...teks.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
  );
})();

function luminansi(hex) {
  const h = hex.replace("#", "");
  const kanal = [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * kanal[0] + 0.7152 * kanal[1] + 0.0722 * kanal[2];
}

function rasio(a, b) {
  const [x, y] = [luminansi(a), luminansi(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const LATAR = ["--color-background", "--color-surface"];

test.describe("B7 kontras ≥ 4.5:1", () => {
  for (const warna of [
    "--color-foreground",
    "--color-teks-redup",
    "--color-primary",
    "--color-destructive",
    "--color-accent",
    "--color-warning-teks",
  ]) {
    test(`${warna} lolos AA di kedua permukaan`, () => {
      for (const latar of LATAR) {
        const v = rasio(tokens[warna], tokens[latar]);
        console.log(`  ${warna} di ${tokens[latar]} → ${v.toFixed(2)}:1`);
        expect(v, `${warna} di ${latar} hanya ${v.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  test("teks di atas tombol berisi lolos AA", () => {
    for (const isi of ["--color-primary", "--color-accent", "--color-destructive"]) {
      const v = rasio(tokens["--color-on-primary"], tokens[isi]);
      console.log(`  teks tombol di ${isi} → ${v.toFixed(2)}:1`);
      expect(v, `teks di atas ${isi} hanya ${v.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

test.describe("B7 token, bukan angka lepas", () => {
  const BERKAS = ["src/App.css", "src/halaman.css", "src/landing.css", "src/lengkapi.css", "src/perusahaan.css"];

  test("tidak ada font-size px lepas di luar tokens.css", () => {
    const pelanggar = [];
    for (const f of BERKAS) {
      const kode = fs.readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
      kode.split("\n").forEach((b, i) => {
        if (/font-size:\s*\d+px/.test(b)) pelanggar.push(`${f}:${i + 1}`);
      });
    }
    expect(pelanggar, `pakai var(--fs-*): ${pelanggar.join(", ")}`).toEqual([]);
  });

  test("skala tipografi lengkap dan menaik", () => {
    const skala = ["--fs-xs", "--fs-sm", "--fs-base", "--fs-md", "--fs-lg", "--fs-xl", "--fs-2xl", "--fs-3xl", "--fs-4xl"];
    const nilai = skala.map((k) => {
      expect(tokens[k], `${k} tidak ada`).toBeTruthy();
      return parseInt(tokens[k], 10);
    });
    for (let i = 1; i < nilai.length; i++) {
      expect(nilai[i], `${skala[i]} tidak lebih besar dari ${skala[i - 1]}`).toBeGreaterThan(nilai[i - 1]);
    }
    // Teks isi tidak boleh di bawah 16px: di bawah itu iOS men-zoom paksa input.
    expect(parseInt(tokens["--fs-base"], 10)).toBeGreaterThanOrEqual(16);
  });
});

test.describe("B7 gerak & fokus", () => {
  test("setiap @keyframes punya penangkal prefers-reduced-motion", () => {
    const BERKAS = ["src/App.css", "src/halaman.css", "src/landing.css", "src/lengkapi.css", "src/perusahaan.css", "src/tokens.css"];
    const semua = BERKAS.map((f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), "utf8")).join("\n");
    const adaKeyframes = /@keyframes/.test(semua);
    expect(adaKeyframes).toBeTruthy();
    /* Satu sapu jagat di tokens.css cukup: ia memangkas SEMUA durasi animasi
       dan transisi, termasuk yang ditambahkan nanti tanpa ingat aturan ini. */
    expect(semua, "tidak ada kill-switch prefers-reduced-motion global").toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,200}animation-duration:\s*0\.01ms\s*!important/
    );
  });

  test("outline: none selalu punya pengganti fokus", () => {
    const BERKAS = ["src/App.css", "src/halaman.css", "src/landing.css", "src/lengkapi.css", "src/perusahaan.css"];
    for (const f of BERKAS) {
      const kode = fs.readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
      const jumlah = (kode.match(/outline:\s*none/g) || []).length;
      if (!jumlah) continue;
      /* Satu-satunya pemakaian sah: cincin fokus dipindah ke ::after supaya
         melingkari kartunya, bukan barisan judul di dalamnya. */
      expect(kode, `${f} memakai outline:none tanpa pengganti`).toMatch(/focus-visible[\s\S]*?::after[\s\S]*?outline:\s*\d/);
    }
  });

  test("fokus terlihat di semua elemen interaktif", () => {
    const kode = fs.readFileSync(new URL("../src/App.css", import.meta.url), "utf8");
    expect(kode).toMatch(/:where\(a, button, input, select, textarea, summary, \[tabindex\]\):focus-visible/);
  });
});

test.describe("B7 keadaan memuat memakai kerangka", () => {
  for (const [nama, rute] of [["Lamaran Saya", "/lamaran"], ["Tersimpan", "/tersimpan"]]) {
    test(`${nama} memuat dengan kerangka, bukan spinner telanjang`, async ({ page }) => {
      /* Rute terlindungi: pengunjung tanpa sesi dialihkan sebelum kerangkanya
         sempat tampil, jadi yang diuji di sini STRUKTUR komponennya. Perilaku
         end-to-end-nya sudah dijaga tes b4-tersimpan. */
      const berkas = rute === "/lamaran" ? "LamaranSaya" : "Tersimpan";
      const kode = fs.readFileSync(new URL(`../src/halaman/${berkas}.jsx`, import.meta.url), "utf8");
      expect(kode, `${nama} masih memakai kalimat "Memuat…" polos`).toContain("KerangkaDaftar");
      expect(kode).not.toMatch(/<p className="catatan" role="status">\s*Memuat/);
    });
  }

  test("kerangka mengumumkan diri sekali, batangnya disembunyikan dari pembaca layar", () => {
    // Komentar dibuang: berkas itu MENJELASKAN kenapa role="status" cuma sekali,
    // dan penjelasan itu sendiri tidak boleh ikut terhitung.
    const kode = fs
      .readFileSync(new URL("../src/komponen-ui/KerangkaDaftar.jsx", import.meta.url), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    expect(kode).toMatch(/role="status"/);
    expect(kode).toMatch(/aria-hidden="true"/);
    expect((kode.match(/role="status"/g) || []).length, "role=status lebih dari satu").toBe(1);
  });
});

test.describe("B7 hierarki visual", () => {
  /* Yang dihitung adalah CTA primer yang TERLIHAT BERSAMAAN, bukan jumlahnya
     di berkas. Onboarding punya 9 di kode dan itu benar — empat langkah plus
     layar penolakan saling eksklusif, tidak pernah tampil serentak. */
  for (const rute of ["/", "/masuk", "/daftar", "/peta", "/lupa-password", "/rute-ngawur-xyz"]) {
    for (const lebar of [390, 1440]) {
      test(`${rute} @${lebar}px: paling banyak satu CTA primer terlihat`, async ({ page }) => {
        await page.setViewportSize({ width: lebar, height: 900 });
        await page.goto(rute);
        await page.waitForTimeout(1000);

        const terlihat = await page.evaluate(() =>
          [...document.querySelectorAll(".tombol--primary")]
            .filter((e) => e.offsetParent !== null)
            .map((e) => e.textContent.trim())
        );
        expect(
          terlihat.length,
          `${terlihat.length} CTA primer bersaing: ${terlihat.join(" | ")}`
        ).toBeLessThanOrEqual(1);
      });
    }
  }
});
