import { test } from "@playwright/test";
import { idContoh, ID_HILANG } from "./bantu-lowongan.js";

/* Tangkapan pembanding: tiap layar difoto di lebar yang sama dengan artboard
 * (375px dan 1440px) supaya bisa ditumpuk dengan PNG di design-canvas/_export.
 * Ini bukan uji lolos/gagal — ini alat lihat. */

const LAYAR = [
  ["landing", "/"],
  ["masuk", "/masuk"],
  ["daftar", "/daftar"],
  ["onboarding", "/onboarding"],
  ["profil", "/profil"],
  ["lamaran", "/lamaran"],
  ["lupa-password", "/lupa-password"],
  ["atur-ulang", "/atur-ulang"],
  ["verifikasi-email", "/verifikasi-email"],
  ["peta", "/peta"],
  ["detail", `/peta?lowongan=${await idContoh("jkt-001")}`],
];

for (const [nama, rute] of LAYAR) {
  for (const [lebar, tinggi] of [[375, 812], [1440, 900]]) {
    test(`${nama} @${lebar}`, async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("jobarta.sesi", JSON.stringify({
          username: "rizkyghazirah", authMethod: "google",
          fullName: "Rizky Ghazirah Himawan", role: null,
          accountStatus: "pending_consent", recoveryEmail: "rizky@email.com",
        }));
      });
      await page.setViewportSize({ width: lebar, height: tinggi });
      await page.goto(rute);
      await page.waitForTimeout(rute.startsWith("/peta") ? 1800 : 400);
      await page.screenshot({
        path: `tes/banding/${nama}-${lebar}.png`,
        fullPage: !rute.startsWith("/peta"),
      });
    });
  }
}
