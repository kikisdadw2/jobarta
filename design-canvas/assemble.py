#!/usr/bin/env python3
"""Rakit SEMUA canvas JOBARTA jadi satu dokumen berisi beberapa halaman.

Sumbernya tetap per folder — folder _gabungan cuma hasil rakitan, jangan diedit
langsung. Ubah di folder asalnya, lalu jalankan ulang skrip ini.

Kenapa Python, bukan sh seperti versi lama: sekarang tiap folder sumber sudah
punya canvas.json sendiri, jadi posisi dan ukuran artboard tidak perlu ditulis
ulang dengan tangan — cukup dibaca dari sana. Versi sh lama menyalin berkas saja
dan mengharuskan canvas-gabungan.json disunting manual tiap ada artboard baru,
yang persis bagaimana tiga desain terakhir tidak pernah ikut terangkut.

🔴 Folder `onboarding/` (tanpa awalan angka) TIDAK ikut: itu DESIGN 3 versi lama
   yang menganggap auth Google-only, dibatalkan 2026-08-31. Penggantinya
   `3-onboarding/`. Folder `arah-warna/` juga tidak ikut — itu kanvas
   perbandingan palet, bukan bagian produk.
"""

import json
import os
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "_gabungan")

# (folder, nama halaman, awalan, {berkas asal: nama baru})
SUMBER = [
    ("sistem-komponen", "Sistem Komponen", {
        "Warna.dc.html": "Main.dc.html",          # entry file dokumen gabungan
        "Tipografi.dc.html": "KomponenTipografi.dc.html",
        "Tombol.dc.html": "KomponenTombol.dc.html",
        "Form.dc.html": "KomponenForm.dc.html",
        "Main.dc.html": "KomponenKartuLowongan.dc.html",
        "BadgeStatus.dc.html": "KomponenBadge.dc.html",
        "EmptyState.dc.html": "KomponenEmptyState.dc.html",
    }),
    ("landing", "Landing", {
        "Main.dc.html": "LandingMobile.dc.html",
        "Desktop.dc.html": "LandingDesktop.dc.html",
        "Gelap.dc.html": "LandingGelap.dc.html",
    }),
    ("2b-auth", "Auth", {
        "Main.dc.html": "AuthMasuk.dc.html",
        "MasukLanjutan.dc.html": "AuthMasukLanjutan.dc.html",
        "Daftar.dc.html": "AuthDaftar.dc.html",
        "DaftarDialog.dc.html": "AuthDaftarDialog.dc.html",
        "VerifikasiEmail.dc.html": "AuthVerifikasiEmail.dc.html",
        "LupaPassword.dc.html": "AuthLupaPassword.dc.html",
        "AturUlang.dc.html": "AuthAturUlang.dc.html",
        "Gelap.dc.html": "AuthGelap.dc.html",
    }),
    ("3-onboarding", "Onboarding", {
        "Main.dc.html": "OnboardingPilihPeran.dc.html",
        "LengkapiData.dc.html": "OnboardingLengkapiData.dc.html",
        "ConsentPDP.dc.html": "OnboardingConsent.dc.html",
        "Menolak.dc.html": "OnboardingMenolak.dc.html",
        "Sukses.dc.html": "OnboardingSukses.dc.html",
        "Gelap.dc.html": "OnboardingGelap.dc.html",
    }),
    ("lengkapi-profil", "Lengkapi Profil", {
        "Main.dc.html": "ProfilMobile.dc.html",
        "Desktop.dc.html": "ProfilDesktop.dc.html",
        "Unggah.dc.html": "ProfilUnggah.dc.html",
        "Lampirkan.dc.html": "ProfilLampirkan.dc.html",
        "Pengingat.dc.html": "ProfilPengingat.dc.html",
        "Dialog.dc.html": "ProfilDialog.dc.html",
    }),
    ("kerangka-peta", "Kerangka Peta", {
        "Main.dc.html": "PetaMobile.dc.html",
        "Desktop.dc.html": "PetaDesktop.dc.html",
        "States.dc.html": "PetaStates.dc.html",
    }),
    ("detail-lowongan", "Detail Lowongan", {
        "Main.dc.html": "DetailMobile.dc.html",
        "Desktop.dc.html": "DetailDesktop.dc.html",
        "States.dc.html": "DetailStates.dc.html",
    }),
]

# Jarak vertikal saat halaman gelap sebuah desain ditumpuk di bawah halaman terangnya.
JEDA_BARIS = 400


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)

    pages, artboards, annotations = [], [], []

    for idx, (folder, nama_halaman, peta_nama) in enumerate(SUMBER, start=1):
        page_id = f"page-{idx}"
        pages.append({"id": page_id, "name": nama_halaman})

        src_dir = os.path.join(HERE, folder)
        cv = json.load(open(os.path.join(src_dir, "canvas.json"), encoding="utf-8"))

        # Sumber yang punya halaman sendiri (mis. mode gelap terpisah) diratakan:
        # halaman kedua dan seterusnya digeser ke bawah halaman pertama.
        sub_pages = [p["id"] for p in cv.get("pages", [])] or [None]
        offset = {}
        y_jalan = 0
        for sp in sub_pages:
            offset[sp] = y_jalan
            tinggi = [a["y"] + a["h"] for a in cv["artboards"]
                      if (a.get("page") or sub_pages[0]) == sp]
            y_jalan += (max(tinggi) if tinggi else 0) + JEDA_BARIS

        for a in cv["artboards"]:
            asal = a["file"]
            if asal not in peta_nama:
                raise SystemExit(f"{folder}: {asal} belum punya nama di peta_nama")
            shutil.copy(os.path.join(src_dir, asal), os.path.join(OUT, peta_nama[asal]))
            dy = offset[a.get("page") or sub_pages[0]]
            baru = {k: v for k, v in a.items() if k != "page"}
            baru["file"] = peta_nama[asal]
            baru["y"] = a["y"] + dy
            baru["page"] = page_id
            artboards.append(baru)

        for n in cv.get("annotations", []):
            dy = offset[n.get("page") or sub_pages[0]]
            baru = dict(n)
            baru["id"] = f"{folder.replace('-', '')}-{n['id']}"[:40]
            baru["y"] = n["y"] + dy
            baru["page"] = page_id
            annotations.append(baru)

    manifest = {
        "pages": pages,
        "artboards": artboards,
        "annotations": annotations,
        "launch": {"view": "canvas", "page": "page-1"},
    }
    with open(os.path.join(OUT, "canvas.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"ok: {len(artboards)} artboard · {len(pages)} halaman · {len(annotations)} anotasi")
    for p in pages:
        n = sum(1 for a in artboards if a["page"] == p["id"])
        print(f"   {p['name']:18} {n} artboard")


if __name__ == "__main__":
    main()
