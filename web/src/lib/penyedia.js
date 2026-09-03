/* Penyedia login mana yang benar-benar hidup di backend.
 *
 * Kenapa ditanyakan ke server, bukan ditulis sebagai konstanta: tombol "Masuk
 * dengan Google" yang tampil padahal providernya belum dikonfigurasi akan
 * melempar error saat diklik — dan itu justru tombol paling menonjol di layar
 * pertama. Dengan menanyakannya, tombol itu hilang selama Google mati dan
 * muncul sendiri begitu dinyalakan di dashboard, tanpa perlu ganti kode atau
 * deploy ulang.
 *
 * Jawabannya di-cache satu kali per muat halaman: ia tidak berubah di
 * tengah kunjungan, dan setiap layar auth membutuhkannya.
 */

import { useEffect, useState } from "react";
import { adaSupabase } from "./supabase";

let janji = null;

async function ambilPenyedia() {
  if (!adaSupabase) return { google: false };
  const url = import.meta.env.VITE_SUPABASE_URL;
  const kunci =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY;
  const r = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: kunci } });
  if (!r.ok) throw new Error("gagal membaca setelan auth");
  const isi = await r.json();
  return { google: isi?.external?.google === true };
}

export function penyediaAktif() {
  if (!janji) {
    janji = ambilPenyedia().catch(() => {
      /* Gagal bertanya (jaringan putus) = anggap Google mati. Menyembunyikan
       * tombol yang mungkin berfungsi lebih baik daripada menampilkan tombol
       * yang mungkin error: jalur username+password selalu tersedia sebagai
       * gantinya, jadi tidak ada yang terkunci di luar. */
      return { google: false };
    });
  }
  return janji;
}

/** true = tombol Google layak ditampilkan. */
export function useGoogleAktif() {
  const [aktif, setAktif] = useState(false);
  useEffect(() => {
    let batal = false;
    penyediaAktif().then((p) => !batal && setAktif(p.google));
    return () => {
      batal = true;
    };
  }, []);
  return aktif;
}
