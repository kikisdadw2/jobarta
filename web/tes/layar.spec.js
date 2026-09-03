import { test, expect } from "@playwright/test";

/* Uji visual alur seeker.
 *
 * Kenapa Playwright dan bukan melihat langsung di jendela Chrome: jendela
 * Chrome tersnap ke lebar layar, jadi 375px tidak pernah benar-benar teruji.
 * Di sini viewport dikunci, dan setiap layar disimpan sebagai PNG untuk
 * dibandingkan dengan artboard.
 */

const HP = { width: 375, height: 812 };
const DESKTOP = { width: 1440, height: 900 };

/** Profil terisi + satu CV, supaya tombol Lamar tidak membuka sheet CV.
 *
 * Sesi ikut dipasang: melamar butuh login (artboard DetailStates state 5), dan
 * pengguna yang sudah punya profil lengkap plus CV menurut definisinya sudah
 * melewati onboarding. Fixture tanpa sesi menggambarkan keadaan yang tidak bisa
 * terjadi di produk. */
async function pasangProfil(page, { denganCv }) {
  // addInitScript jalan di SETIAP navigasi, termasuk reload — kalau ia menulis
  // tanpa syarat, ia menghapus perubahan yang justru sedang diuji bertahan.
  await page.addInitScript((cv) => {
    if (localStorage.getItem("jobarta.profil")) return;
    localStorage.setItem(
      "jobarta.sesi",
      JSON.stringify({
        username: "rizkyghazirah",
        authMethod: "password",
        fullName: "Rizky Ghazirah Himawan",
        role: "seeker",
        accountStatus: "active",
      })
    );
    localStorage.setItem(
      "jobarta.profil",
      JSON.stringify({
        namaLengkap: "Rizky Ghazirah Himawan",
        domisili: "Tebet",
        foto: null,
        cv,
        pengingatDitutup: false,
      })
    );
    localStorage.removeItem("jobarta.lamaran");
  }, denganCv ? { nama: "CV-Rizky-2026.pdf", ukuran: 1887436, tipe: "application/pdf", diunggahPada: new Date().toISOString() } : null);
}

test.describe("Peta", () => {
  test("375px: peta penuh, pil mengambang, sheet tiga tahap", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangProfil(page, { denganCv: true });
    await page.goto("/peta");

    await expect(page.getByRole("button", { name: "Filter" })).toBeVisible();
    // Bilah saring desktop TIDAK boleh ikut tampil di layar sempit.
    await expect(page.getByRole("link", { name: "Lamaran Saya" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Lokasi saya" })).toBeVisible();

    // Pegangan menaikkan sheet setahap: setengah → penuh → peek.
    const panel = page.locator(".panel");
    const pegangan = page.getByRole("button", { name: /Daftar lowongan, tinggi/ });

    /* Tinggi sheet dianimasikan 200ms. Tanpa menunggu, screenshot dan
     * boundingBox terbaca di TENGAH animasi — tes bisa lolos karena panel
     * kebetulan masih tinggi, bukan karena tata letaknya benar. */
    async function tungguTinggi(kelas, tinggi) {
      await expect(panel).toHaveClass(new RegExp(`panel--${kelas}`));
      await expect
        .poll(async () => Math.round((await panel.boundingBox()).height))
        .toBeCloseTo(tinggi, -1);
    }

    await tungguTinggi("setengah", 406);
    await page.screenshot({ path: "tes/hasil/peta-375-setengah.png" });

    await pegangan.click();
    await tungguTinggi("penuh", 714);
    await page.screenshot({ path: "tes/hasil/peta-375-penuh.png" });

    await pegangan.click();
    await tungguTinggi("peek", 240);
    await page.screenshot({ path: "tes/hasil/peta-375-peek.png" });

    // Di peek, pengingat profil mengalah pada hasil pencarian.
    await expect(page.locator(".pengingat")).toBeHidden();

    // Peek wajib memuat SATU KARTU UTUH, bukan potongan kartu.
    const kartu = page.locator(".kartu").first();
    const kotakPanel = await panel.boundingBox();
    const kotakKartu = await kartu.boundingBox();
    expect(kotakKartu.y + kotakKartu.height).toBeLessThanOrEqual(
      kotakPanel.y + kotakPanel.height + 1
    );
  });

  test("1440px: split view dengan bilah saring", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await pasangProfil(page, { denganCv: true });
    await page.goto("/peta");

    await expect(page.getByLabel("Gaji minimum")).toBeVisible();
    await expect(page.getByLabel("Radius")).toBeVisible();
    // Pil mengambang milik layar sempit — jangan bocor ke desktop.
    await expect(page.getByRole("button", { name: "Filter" })).toBeHidden();
    await page.screenshot({ path: "tes/hasil/peta-1440.png" });
  });

  test("sheet filter menyaring dan menutup", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangProfil(page, { denganCv: true });
    await page.goto("/peta");

    await page.getByRole("button", { name: "Filter" }).click();
    const sheet = page.getByRole("dialog", { name: "Saringan lowongan" });
    await sheet.getByLabel("Kategori").selectOption("Kurir");
    await page.screenshot({ path: "tes/hasil/peta-375-filter.png" });

    // Slider radius mati sebelum lokasi dinyalakan — dan alasannya ditulis.
    await expect(sheet.getByLabel(/^Radius/)).toBeDisabled();
    await expect(sheet).toContainText("Ketuk “Lokasi Saya” di bawah dulu");

    const lihat = sheet.getByRole("button", { name: /^Lihat \d+ lowongan$/ });
    await expect(lihat).toBeVisible();
    await lihat.click();
    await expect(page.getByRole("dialog", { name: "Saringan lowongan" })).toBeHidden();
    await expect(page.locator(".pil__badge")).toHaveText("1");
  });
});

test.describe("Melamar", () => {
  test("punya CV: langsung terkirim dan bertahan setelah refresh", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangProfil(page, { denganCv: true });
    await page.goto("/peta");

    await page.locator(".kartu__tombol").first().click();
    await page.getByRole("button", { name: "Lamar Sekarang" }).click();
    await page.getByRole("button", { name: "Ya, Kirim Lamaran" }).click();
    await expect(page.getByText(/Sudah dilamar/)).toBeVisible();

    // Inti bug lama: status hilang begitu halaman dimuat ulang.
    await page.reload();
    await page.locator(".kartu__tombol").first().click();
    await expect(page.getByText(/Sudah dilamar/)).toBeVisible();

    await page.goto("/lamaran");
    await expect(page.locator(".riwayat__baris")).toHaveCount(1);
    await page.screenshot({ path: "tes/hasil/lamaran-375.png" });

    /* Kartu tidak boleh menyisakan lubang kosong: tinggi kartu harus mendekati
     * jumlah tinggi isinya. Ini yang menangkap .riwayat__utama yang meregang. */
    const kartu = await page.locator(".riwayat__baris").boundingBox();
    const utama = await page.locator(".riwayat__utama").boundingBox();
    const aksi = await page.locator(".riwayat__aksi").boundingBox();
    expect(kartu.height).toBeLessThan(utama.height + aksi.height + 60);

    // Halaman yang sedang dibuka ditandai di menu.
    await expect(page.getByRole("link", { name: "Lamaran Saya" })).toHaveClass(/active/);
  });

  test("membatalkan lamaran menghapusnya dari riwayat", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangProfil(page, { denganCv: true });
    await page.goto("/peta");

    await page.locator(".kartu__tombol").first().click();
    await page.getByRole("button", { name: "Lamar Sekarang" }).click();
    await page.getByRole("button", { name: "Ya, Kirim Lamaran" }).click();

    await page.goto("/lamaran");
    await page.getByRole("button", { name: "Batalkan lamaran" }).click();
    await expect(page.locator(".riwayat__baris")).toHaveCount(0);
    await expect(page.getByText("Kamu belum melamar ke mana pun")).toBeVisible();

    // Pembatalan harus benar-benar tersimpan, bukan cuma hilang dari layar.
    await page.reload();
    await expect(page.getByText("Kamu belum melamar ke mana pun")).toBeVisible();
    await page.screenshot({ path: "tes/hasil/lamaran-kosong-375.png" });
  });

  test("tanpa CV: sheet just-in-time muncul, konfirmasi tidak tertinggal", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangProfil(page, { denganCv: false });
    await page.goto("/peta");

    await page.locator(".kartu__tombol").first().click();
    await page.getByRole("button", { name: "Lamar Sekarang" }).click();
    await page.getByRole("button", { name: "Ya, Kirim Lamaran" }).click();

    // Judul sheet menyebut nama perusahaan, bukan "Unggah CV" generik.
    await expect(
      page.getByRole("dialog", { name: /Lampirkan CV untuk melamar di/ })
    ).toBeVisible();
    // Konfirmasi TIDAK boleh tertinggal di belakang scrim.
    await expect(page.getByRole("button", { name: "Ya, Kirim Lamaran" })).toBeHidden();
    await page.screenshot({ path: "tes/hasil/lampirkan-cv-375.png" });

    // Jalan keluar untuk yang belum punya CV.
    await page.getByRole("button", { name: /Saya belum punya CV/ }).click();
    await expect(page.getByText(/Sudah dilamar/)).toBeVisible();
  });
});

test.describe("Lengkapi Profil", () => {
  test("375px bertumpuk, 1440px dua kolom", async ({ page }) => {
    await pasangProfil(page, { denganCv: false });

    await page.setViewportSize(HP);
    await page.goto("/profil");
    await expect(page.getByRole("heading", { name: /Sedikit lagi/ })).toBeVisible();
    // Sapaan dipotong dua kata pertama, bukan lima.
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sedikit lagi, Rizky Ghazirah");
    await page.screenshot({ path: "tes/hasil/profil-375.png", fullPage: true });

    const judul = await page.getByRole("heading", { level: 1 }).boundingBox();
    const nama = await page.getByLabel("Nama lengkap").boundingBox();
    expect(nama.y).toBeGreaterThan(judul.y); // bertumpuk

    await page.setViewportSize(DESKTOP);
    await page.screenshot({ path: "tes/hasil/profil-1440.png", fullPage: true });
    const judulD = await page.getByRole("heading", { level: 1 }).boundingBox();
    const namaD = await page.getByLabel("Nama lengkap").boundingBox();
    expect(namaD.x).toBeGreaterThan(judulD.x + judulD.width - 1); // dua kolom
  });

  test("CV ditolak dengan sebab dan cara memperbaiki", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangProfil(page, { denganCv: false });
    await page.goto("/profil");

    await page.setInputFiles('input[type="file"][accept*="pdf"]', {
      name: "cv.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("bukan pdf"),
    });
    await expect(page.locator(".dropzone__galat")).toContainText("PDF, DOC, atau DOCX");
    await expect(page.locator(".dropzone--galat")).toBeVisible();
  });

  test("pengingat kelengkapan muncul di peta dan bisa ditutup", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangProfil(page, { denganCv: false });
    await page.goto("/peta");

    const pengingat = page.locator(".pengingat");
    await pengingat.scrollIntoViewIfNeeded();
    await expect(pengingat).toContainText("Profil kamu 1 dari 3 lengkap");

    // Cincin: satu busur per item, dan angkanya ditulis — bukan warna saja.
    await expect(page.locator(".cincin__ruas")).toHaveCount(3);
    await expect(page.locator(".cincin__ruas--isi")).toHaveCount(1);
    await expect(page.locator(".cincin__angka")).toHaveText("1/3");
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");

    // Pengingat mendahului kartu lowongan pertama.
    const kotakPengingat = await pengingat.boundingBox();
    const kotakKartu = await page.locator(".kartu").first().boundingBox();
    expect(kotakPengingat.y).toBeLessThan(kotakKartu.y);
    await page.screenshot({ path: "tes/hasil/pengingat-375.png" });
    await page.getByRole("button", { name: "Tutup pengingat" }).click();
    await expect(pengingat).toBeHidden();

    await page.reload();
    await expect(page.locator(".pengingat")).toBeHidden();
  });
});

test.describe("Detail lowongan", () => {
  test("terverifikasi: badge dulu, gaji belakangan, tanggal verifikasi disebut", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangProfil(page, { denganCv: true });
    await page.goto("/peta?lowongan=jkt-001");

    const detail = page.getByRole("dialog");
    await expect(detail.getByText("Terverifikasi")).toBeVisible();
    await expect(detail.getByText(/Legalitas usaha diperiksa JOBARTA pada \d/)).toBeVisible();

    // Badge harus mendahului gaji: itu pertanyaan pertama pengguna.
    const badge = await detail.locator(".badge--terverifikasi").boundingBox();
    const chipGaji = await detail.locator(".detail__chip li").first().boundingBox();
    expect(badge.y).toBeLessThan(chipGaji.y);

    // Janji perlindungan memakai hijau (accent), bukan merah.
    await expect(detail.locator(".janji-aman")).toContainText(
      "JOBARTA tidak pernah meminta biaya"
    );
    await page.screenshot({ path: "tes/hasil/detail-375.png", fullPage: true });
  });

  test("belum terverifikasi: dinyatakan eksplisit, bukan sekadar tanpa badge", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangProfil(page, { denganCv: true });

    // jkt-004 sengaja diseed tanpa verifikasi — lihat src/data/lowongan.js.
    await page.goto("/peta?lowongan=jkt-004");
    const detail = page.getByRole("dialog");
    await expect(detail.locator(".badge--terverifikasi")).toHaveCount(0);
    await expect(detail.getByText("Perusahaan ini belum diverifikasi")).toBeVisible();
    await page.screenshot({ path: "tes/hasil/detail-belum-verifikasi-375.png", fullPage: true });
  });

  test("CTA sticky tetap terlihat setelah menggulir", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangProfil(page, { denganCv: true });
    await page.goto("/peta?lowongan=jkt-001");

    const cta = page.getByRole("button", { name: "Lamar Sekarang" });
    await expect(cta).toBeInViewport();
    // Yang menggulir adalah `.detail`, bukan `.detail__isi` — panel aksi berdiri
    // di luar isi supaya janji keamanan & tombol lapor ikut tergulir.
    await page.locator(".detail").evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await expect(cta).toBeInViewport();
    // Baris terakhir isi tidak boleh tertutup CTA.
    const lapor = await page.getByRole("button", { name: "Laporkan Lowongan Ini" }).boundingBox();
    const kotakCta = await cta.boundingBox();
    expect(lapor.y + lapor.height).toBeLessThanOrEqual(kotakCta.y + 1);
  });
});

test.describe("Pemulihan akun", () => {
  test("lupa password: respons seragam, tidak membocorkan siapa yang terdaftar", async ({ page }) => {
    await page.setViewportSize(HP);
    await page.goto("/lupa-password");

    // Fieldnya email pemulihan, BUKAN username — username tak bisa dikirimi apa pun.
    await expect(page.getByLabel("Email pemulihan")).toBeVisible();
    await expect(page.getByLabel("Username")).toHaveCount(0);

    await page.getByLabel("Email pemulihan").fill("tidak-terdaftar@contoh.com");
    await page.getByRole("button", { name: "Kirim tautan atur ulang" }).click();
    await expect(page.getByText(/Kalau alamat itu terdaftar/)).toBeVisible();
    await page.screenshot({ path: "tes/hasil/lupa-terkirim-375.png" });

    // Hitung mundur jadi teks tombol, dan tombolnya mati selama menunggu.
    const kirimUlang = page.getByRole("button", { name: /Kirim ulang dalam \d+ detik/ });
    await expect(kirimUlang).toBeDisabled();
  });

  test("lupa password: jalan buntu digambar, bukan disembunyikan", async ({ page }) => {
    await page.setViewportSize(HP);
    await page.goto("/lupa-password");

    await page.getByRole("button", { name: "Lihat pilihan yang tersisa" }).click();
    await expect(
      page.getByRole("heading", { name: /tidak bisa dibuka lagi/ })
    ).toBeVisible();
    // Dua tombol nyata, bukan permintaan maaf.
    await expect(page.getByRole("link", { name: "Daftar akun baru" })).toBeVisible();
    await expect(page.getByRole("link", { name: /WhatsApp/ })).toBeVisible();
    await page.screenshot({ path: "tes/hasil/lupa-buntu-375.png" });
  });

  test("atur ulang: syarat password sama persis dengan layar Daftar", async ({ page }) => {
    await page.setViewportSize(HP);

    await page.goto("/daftar");
    const syaratDaftar = await page.locator(".syarat li").allInnerTexts();

    await page.goto("/atur-ulang");
    const syaratAturUlang = await page.locator(".syarat li").allInnerTexts();

    expect(syaratAturUlang).toEqual(syaratDaftar);
    expect(syaratDaftar.length).toBe(3);
  });

  test("atur ulang: pencabutan sesi diberitahu sebelum tombol ditekan", async ({ page }) => {
    await page.setViewportSize(HP);
    await page.goto("/atur-ulang");

    const pemberitahuan = page.getByText(/keluar otomatis dari semua perangkat lain/);
    await expect(pemberitahuan).toBeVisible();

    const simpan = page.getByRole("button", { name: "Simpan password baru" });
    await expect(simpan).toBeDisabled();

    await page.getByLabel("Password baru", { exact: true }).fill("jakarta2026");
    await page.getByLabel("Ulangi password baru").fill("jakarta2026");
    await expect(simpan).toBeEnabled();
    await page.screenshot({ path: "tes/hasil/atur-ulang-375.png" });

    // Berhasil = langsung masuk, bukan dilempar balik ke layar Masuk.
    await simpan.click();
    await page.getByRole("button", { name: "Lanjut cari lowongan" }).click();
    await expect(page).toHaveURL(/\/peta/);
  });

  test("atur ulang: tautan kedaluwarsa & terpakai selalu punya jalan keluar", async ({ page }) => {
    await page.setViewportSize(HP);

    await page.goto("/atur-ulang?keadaan=kedaluwarsa");
    await expect(page.getByRole("link", { name: "Kirim tautan baru" })).toBeVisible();

    await page.goto("/atur-ulang?keadaan=terpakai");
    await expect(page.getByRole("link", { name: "Masuk dengan password baru" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Bukan saya/ })).toBeVisible();
  });

  test("verifikasi email wajib bisa dilewati", async ({ page }) => {
    await page.setViewportSize(HP);
    await page.goto("/verifikasi-email?email=rizky@email.com");

    // Alamat ditampilkan PENUH supaya salah ketik ketahuan sekarang.
    await expect(page.getByText("rizky@email.com")).toBeVisible();
    await page.screenshot({ path: "tes/hasil/verifikasi-375.png" });

    await page.getByRole("button", { name: "Lanjut dulu, verifikasi nanti" }).click();
    await expect(page).toHaveURL(/\/peta/);
  });

  test("Masuk menautkan ke lupa password", async ({ page }) => {
    await page.setViewportSize(HP);
    await page.goto("/masuk");
    await page.getByRole("link", { name: "Lupa password?" }).click();
    await expect(page).toHaveURL(/\/lupa-password/);
  });
});

test.describe("Onboarding", () => {
  /** Onboarding butuh sesi; tanpa itu halamannya menolak masuk. */
  async function pasangSesi(page, authMethod) {
    await page.addInitScript((m) => {
      localStorage.setItem(
        "jobarta.sesi",
        JSON.stringify({
          username: "rizkyghazirah",
          authMethod: m,
          fullName: m === "google" ? "Rizky Ghazirah Himawan" : null,
          role: null,
          accountStatus: "pending_consent",
          recoveryEmail: m === "google" ? "rizky.ghazirah@gmail.com" : null,
        })
      );
    }, authMethod);
  }

  test("pilih peran: terpilih ditandai lebih dari sekadar warna", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangSesi(page, "google");
    await page.goto("/onboarding");

    await expect(page.getByText("Langkah 1 dari 3")).toBeVisible();
    const seeker = page.getByRole("button", { name: /Saya Cari Kerja/ });

    // Seluruh kartu bisa ditekan, bukan cuma judulnya.
    const kotak = await seeker.boundingBox();
    expect(kotak.height).toBeGreaterThan(100);

    await seeker.click();
    // Penanda terpilih harus terbaca oleh mesin, bukan cuma tampak beda warna.
    await expect(seeker).toHaveAttribute("aria-pressed", "true");
    await page.screenshot({ path: "tes/hasil/onboarding-peran-375.png" });
  });

  test("consent jalur Google: pertanyaan penuh, tombol mati sampai dicentang", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangSesi(page, "google");
    await page.goto("/onboarding");

    await page.getByRole("button", { name: /Saya Cari Kerja/ }).click();
    await page.getByRole("button", { name: "Lanjut" }).click();
    await page.getByRole("button", { name: "Lanjut" }).click();

    await expect(page.getByText("Langkah 3 dari 3")).toBeVisible();
    const setuju = page.getByRole("button", { name: /Setuju & mulai pakai/ });
    await expect(setuju).toBeDisabled();

    const kotak = page.getByRole("checkbox");
    await expect(kotak).not.toBeChecked(); // tidak pernah tercentang otomatis
    await kotak.check();
    await expect(setuju).toBeEnabled();
    await page.screenshot({ path: "tes/hasil/onboarding-consent-375.png" });
  });

  test("menolak: tombolnya netral, bukan merah — menolak itu hak, bukan kesalahan", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangSesi(page, "google");
    await page.goto("/onboarding");

    await page.getByRole("button", { name: /Saya Cari Kerja/ }).click();
    await page.getByRole("button", { name: "Lanjut" }).click();
    await page.getByRole("button", { name: "Lanjut" }).click();
    await page.getByRole("button", { name: "Saya tidak setuju" }).click();

    const tolak = page.getByRole("button", { name: "Ya, saya tidak setuju" });
    await expect(tolak).toBeVisible();
    const warna = await tolak.evaluate((el) => getComputedStyle(el).borderColor);
    expect(warna).not.toContain("158, 59, 59"); // #9E3B3B
    await page.screenshot({ path: "tes/hasil/onboarding-menolak-375.png" });
  });

  test("sukses seeker: menyerahkan ke langkah berikutnya, bukan berhenti di selamat", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangSesi(page, "google");
    await page.goto("/onboarding");

    await page.getByRole("button", { name: /Saya Cari Kerja/ }).click();
    await page.getByRole("button", { name: "Lanjut" }).click();
    await page.getByRole("button", { name: "Lanjut" }).click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /Setuju & mulai pakai/ }).click();

    await expect(page.getByRole("heading", { name: /Akun kamu siap/ })).toBeVisible();
    await page.screenshot({ path: "tes/hasil/onboarding-sukses-375.png" });

    // "Lihat peta dulu" bukan basa-basi — ia harus benar-benar ada.
    await expect(page.getByRole("button", { name: /Lihat peta dulu/ })).toBeVisible();
    await page.getByRole("button", { name: /Lengkapi profil sekarang/ }).click();
    await expect(page).toHaveURL(/\/profil/);
  });

  test("consent jalur password: ringkasan bertanggal, tanpa checkbox ulang", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangSesi(page, "password");
    await page.goto("/onboarding");

    await page.getByRole("button", { name: /Saya Cari Kerja/ }).click();
    await page.getByRole("button", { name: "Lanjut" }).click();
    await page.getByRole("button", { name: "Lanjut" }).click();

    await expect(page.getByRole("heading", { name: "Yang kamu setujui" })).toBeVisible();
    // Mencentang dua kali untuk persetujuan yang sama membuat orang berhenti membaca.
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    await page.screenshot({ path: "tes/hasil/onboarding-consent-password-375.png" });
  });
});

/* ── Regresi keamanan & konsistensi gerbang ───────────────────────────────
 * Dua bug di bawah lolos dari suite ini sebelumnya: yang satu diuji DAFTAR
 * syaratnya (bukan gerbangnya), yang satu diuji dengan alamat yang kebetulan
 * bukan pemicunya. Tes berikut menguji perilakunya, bukan tampilannya. */
test.describe("Regresi gerbang & enumerasi", () => {
  test("Daftar: password lemah tidak bisa lolos meski consent dicentang", async ({ page }) => {
    await page.setViewportSize(HP);
    await page.goto("/daftar");

    await page.fill("#d-username", "rizkyghazirah");
    await page.locator("#d-username").blur();
    await page.fill("#d-password", "a");          // gagal semua syarat
    await page.locator(".consent input").check();

    // Gerbangnya harus menguji password, bukan cuma consent — kalau tidak,
    // password ini diterima di Daftar lalu ditolak di AturUlang.
    await expect(page.getByRole("button", { name: "Daftar", exact: true })).toBeDisabled();

    await page.fill("#d-password", "jakarta2026"); // lolos syarat wajib
    await expect(page.getByRole("button", { name: "Daftar", exact: true })).toBeEnabled();
  });

  test("Lupa password: semua alamat mendapat layar yang sama persis", async ({ page }) => {
    await page.setViewportSize(HP);
    const judul = [];

    // Termasuk alamat yang dulu memicu layar "akun Google" — itulah oracle-nya.
    for (const alamat of ["rizky@email.com", "tidak-ada-sama-sekali@email.com"]) {
      await page.goto("/lupa-password");
      await page.fill("#lp-email", alamat);
      await page.getByRole("button", { name: /Kirim tautan/i }).click();
      judul.push(await page.getByRole("heading", { level: 1 }).innerText());
    }

    expect(judul[0]).toBe(judul[1]);
    expect(judul[0]).toMatch(/Cek email kamu/);
  });

  test("Lupa password: layar akun Google tetap ada, lewat tautan email", async ({ page }) => {
    await page.setViewportSize(HP);
    // Artboard menghendaki layar ini ada; yang dilarang cuma memicunya dari form.
    await page.goto("/lupa-password?keadaan=google");
    await expect(
      page.getByRole("heading", { name: /dipakai untuk masuk dengan Google/i })
    ).toBeVisible();
  });
});

/* ── State tombol Lamar yang sebelumnya tidak ada sama sekali ─────────────── */
test.describe("Detail lowongan: state tombol Lamar", () => {
  test("belum login: diminta masuk, dan dikembalikan ke lowongan yang sama", async ({ page }) => {
    await page.setViewportSize(HP);
    await page.goto("/peta");                       // sengaja tanpa sesi
    await page.locator(".kartu__tombol").first().click();

    await expect(page.getByRole("button", { name: "Lamar Sekarang" })).toHaveCount(0);
    const masuk = page.getByRole("link", { name: "Masuk untuk Melamar" });
    await expect(masuk).toBeVisible();
    // Label menyebut tujuannya, dan tautannya membawa balik ke lowongan ini.
    await expect(masuk).toHaveAttribute("href", /lanjut=.*lowongan/);
  });

  test("lowongan ditutup: tombol lamar diganti jalan keluar, bukan dimatikan", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangProfil(page, { denganCv: true });
    await page.goto("/peta?lowongan=jkt-003");

    await expect(page.getByText(/Lowongan ini ditutup pada/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Lamar Sekarang" })).toHaveCount(0);
    // Tombol mati tidak memberi jalan ke mana pun; harus ada penggantinya.
    await expect(page.getByRole("link", { name: "Cari Lowongan Serupa" })).toBeVisible();
  });

  test("sudah dilamar: tanggal melamar disebut", async ({ page }) => {
    await page.setViewportSize(HP);
    await pasangProfil(page, { denganCv: true });
    await page.goto("/peta");

    await page.locator(".kartu__tombol").first().click();
    await page.getByRole("button", { name: "Lamar Sekarang" }).click();
    await page.getByRole("button", { name: "Ya, Kirim Lamaran" }).click();

    // Tanpa tanggal, orang tidak yakin lamarannya terkirim lalu mencoba lagi.
    await expect(page.getByText(/Kamu melamar pada \d+ \w+ \d{4}/)).toBeVisible();
  });
});

test.describe("Simpan lowongan", () => {
  test("tersimpan bertahan setelah muat ulang, dan bisa dibatalkan", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/peta?lowongan=jkt-001");

    const simpan = page.getByRole("button", { name: "Simpan Lowongan" });
    await expect(simpan).toHaveAttribute("aria-pressed", "false");
    await simpan.click();

    // Ditandai DUA hal sekaligus: kata dan state, bukan warna saja.
    const tersimpan = page.getByRole("button", { name: "Tersimpan" });
    await expect(tersimpan).toHaveAttribute("aria-pressed", "true");

    await page.reload();
    await expect(page.getByRole("button", { name: "Tersimpan" })).toBeVisible();

    // Bisa dibatalkan — menyimpan bukan aksi sekali jalan.
    await page.getByRole("button", { name: "Tersimpan" }).click();
    await expect(page.getByRole("button", { name: "Simpan Lowongan" })).toBeVisible();
  });

  test("peta kecil memusat pada pin walau kontainernya berubah lebar", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/peta?lowongan=jkt-021");

    const peta = page.locator(".peta-kecil .leaflet-container");
    await expect(peta).toBeVisible();
    const pin = page.locator(".peta-kecil .leaflet-marker-icon").first();
    await expect(pin).toBeVisible();

    /* Pin harus berada di sekitar tengah petanya. Kalau Leaflet tidak diberi
     * tahu kontainernya berubah lebar, pin menggeser jauh ke tepi — itu bug
     * yang membuat alamat Sunter menampilkan laut. */
    const kotakPeta = await peta.boundingBox();
    const kotakPin = await pin.boundingBox();
    const pusatPeta = kotakPeta.x + kotakPeta.width / 2;
    const pusatPin = kotakPin.x + kotakPin.width / 2;
    expect(Math.abs(pusatPin - pusatPeta)).toBeLessThan(24);
  });
});

test.describe("Cuplikan peta di landing", () => {
  test("menekan pin mengganti kartu sorot, dan kartunya menuju lowongan itu", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForTimeout(1200);

    const kartu = page.locator(".sorot");
    const awal = await kartu.locator(".sorot__posisi").innerText();

    /* Pin di cuplikan hero WAJIB bisa ditekan: artboard menulis "kartu lowongan
     * muncul saat pin ditekan". Sebelumnya markernya `interactive={false}`,
     * jadi petanya hidup tapi mati rasa. */
    const pin = page.locator(".mini-peta .leaflet-marker-icon");
    await expect(pin.first()).toBeVisible();
    const jumlah = await pin.count();
    expect(jumlah).toBeGreaterThan(1);

    // Tekan pin lain sampai isinya benar-benar berganti.
    for (let i = 1; i < jumlah; i++) {
      await pin.nth(i).click({ force: true });
      if ((await kartu.locator(".sorot__posisi").innerText()) !== awal) break;
    }
    await expect(kartu.locator(".sorot__posisi")).not.toHaveText(awal);

    // Menekan AREA petanya (bukan pin) membuka peta penuh. Leaflet tidak
    // meneruskan klik marker ke event peta, jadi kedua perilaku hidup
    // berdampingan tanpa saling menimpa.
    const kotak = await page.locator(".mini-peta").boundingBox();
    await page.mouse.click(kotak.x + 60, kotak.y + kotak.height - 40);
    await expect(page).toHaveURL(/\/peta$/);
    await page.goBack();
    await page.waitForTimeout(1000);

    // Kartunya tautan ke lowongan yang sedang disorot, bukan kotak mati.
    await expect(kartu).toHaveAttribute("href", /\/peta\?lowongan=jkt-/);
    await kartu.click();
    await expect(page).toHaveURL(/\/peta\?lowongan=jkt-/);
  });
});

test.describe("Kerangka halaman peta", () => {
  test("halaman peta tidak pernah bisa digulir sendiri", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/peta");
    await page.waitForTimeout(800);

    /* Daftar lowongan menggulir DI DALAM panelnya. Kalau area gulir dokumen
     * ikut terbentuk, scrollbar halaman muncul dan menyeretnya menjatuhkan
     * seluruh aplikasi ke atas, menyisakan bidang kosong di bawah peta. */
    const tinggi = await page.evaluate(() => ({
      vh: window.innerHeight,
      dokumen: document.documentElement.scrollHeight,
    }));
    expect(tinggi.dokumen).toBeLessThanOrEqual(tinggi.vh + 1);

    await page.evaluate(() => window.scrollTo(0, 4000));
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    // Panelnya sendiri TETAP harus bisa digulir — yang dikunci cuma dokumennya.
    const panel = page.locator(".panel");
    await panel.evaluate((el) => el.scrollTo(0, 600));
    expect(await panel.evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
  });

  test("panel detail tetap bisa digulir walau kerangkanya dikunci", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/peta?lowongan=jkt-001");
    await page.waitForTimeout(600);

    const detail = page.locator(".detail");
    await detail.evaluate((el) => el.scrollTo(0, 500));
    expect(await detail.evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
  });
});
