#!/bin/sh
# Rakit semua canvas JOBARTA jadi SATU dokumen berisi beberapa page.
# Sumbernya tetap per folder; folder _gabungan cuma hasil rakitan — jangan diedit langsung.
set -e
cd "$(dirname "$0")"
rm -rf _gabungan && mkdir _gabungan

cp sistem-komponen/Warna.dc.html       _gabungan/Warna.dc.html
cp sistem-komponen/Tipografi.dc.html   _gabungan/Tipografi.dc.html
cp sistem-komponen/Tombol.dc.html      _gabungan/Tombol.dc.html
cp sistem-komponen/Form.dc.html        _gabungan/Form.dc.html
cp sistem-komponen/Main.dc.html        _gabungan/Main.dc.html
cp sistem-komponen/BadgeStatus.dc.html _gabungan/BadgeStatus.dc.html
cp sistem-komponen/EmptyState.dc.html  _gabungan/EmptyState.dc.html

cp kerangka-peta/Main.dc.html    _gabungan/PetaMobile.dc.html
cp kerangka-peta/Desktop.dc.html _gabungan/PetaDesktop.dc.html
cp kerangka-peta/States.dc.html  _gabungan/PetaStates.dc.html

cp detail-lowongan/Main.dc.html    _gabungan/DetailMobile.dc.html
cp detail-lowongan/Desktop.dc.html _gabungan/DetailDesktop.dc.html
cp detail-lowongan/States.dc.html  _gabungan/DetailStates.dc.html

cp lengkapi-profil/Main.dc.html      _gabungan/ProfilMobile.dc.html
cp lengkapi-profil/Desktop.dc.html   _gabungan/ProfilDesktop.dc.html
cp lengkapi-profil/Unggah.dc.html    _gabungan/ProfilUnggah.dc.html
cp lengkapi-profil/Lampirkan.dc.html _gabungan/ProfilLampirkan.dc.html
cp lengkapi-profil/Pengingat.dc.html _gabungan/ProfilPengingat.dc.html
cp lengkapi-profil/Dialog.dc.html    _gabungan/ProfilDialog.dc.html

cp canvas-gabungan.json _gabungan/canvas.json
echo "ok: $(ls _gabungan/*.dc.html | wc -l) artboard dirakit"
