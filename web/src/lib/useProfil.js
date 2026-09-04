import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../konteks/useAuth";
import { bacaProfil, simpanProfil, muatProfil, simpanProfilJauh } from "./profil";

/**
 * Profil pencari kerja, satu pintu untuk seluruh aplikasi.
 *
 * Pola yang dipakai: TULIS DULU KE LAYAR, kirim ke server belakangan.
 * Orang yang mengganti domisili di 4G yang tersendat tidak boleh menunggu
 * jaringan sebelum melihat perubahannya sendiri. Cache localStorage yang
 * membuat layar tampil seketika saat aplikasi dibuka; jawaban server
 * menimpanya begitu datang.
 *
 * @returns {[object, (patch: object) => object]} profil dan penyimpannya.
 */
export function useProfil() {
  const { sesi } = useAuth();
  const [profil, setProfil] = useState(bacaProfil);

  useEffect(() => {
    if (!sesi.id) return;
    let hidup = true;
    muatProfil(sesi.id).then((jauh) => {
      /* null = tidak bisa diambil (mode lokal atau jaringan gagal). Cache yang
         sudah tampil dibiarkan; mengosongkan layar hanya karena satu permintaan
         gagal akan terbaca sebagai "data saya hilang". */
      if (hidup && jauh) setProfil(jauh);
    });
    return () => {
      hidup = false;
    };
  }, [sesi.id]);

  const perbarui = useCallback(
    (patch) => {
      const baru = simpanProfil(patch);
      setProfil(baru);
      /* Kegagalan kirim tidak dilaporkan ke pengguna di sini: perubahannya
         sudah aman di perangkat, dan pemuatan berikutnya akan mengirim ulang.
         Melempar dialog error untuk sesuatu yang tidak hilang justru mengajari
         orang mengabaikan dialog. */
      if (sesi.id) simpanProfilJauh(sesi.id, patch);
      return baru;
    },
    [sesi.id]
  );

  return [profil, perbarui];
}
