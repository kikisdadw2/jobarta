import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, adaSupabase } from "../lib/supabase";
import { Logo } from "../komponen-ui/Dasar";
import { useAuth } from "../konteks/useAuth";
import { arahSetelahMasuk } from "../lib/arah";

/* Pendaratan setelah kembali dari Google.
 *
 * 🔴 Kenapa rute ini ada, padahal `detectSessionInUrl` sudah menyala.
 *
 *    Google memulangkan pengguna dengan token di fragment URL. Supabase
 *    menukarnya jadi sesi, tapi penukaran itu ASINKRON. Kalau Google
 *    dipulangkan langsung ke /onboarding, halaman itu ikut dirender pada
 *    milidetik pertama — saat sesinya belum jadi. Rute terlindungi membaca
 *    "belum masuk" dan MELEMPAR BALIK orang yang sebenarnya baru saja berhasil
 *    login. Gejalanya: masuk lewat Google, lalu tiba-tiba kembali ke layar
 *    Masuk tanpa penjelasan.
 *
 *    Halaman ini menahan satu langkah sampai sesinya benar-benar ada, baru
 *    meneruskan. Ia tidak pernah menjadi tujuan yang diketik manusia.
 */

/* Batas tunggu. Tanpa ini, kegagalan penukaran token berakhir jadi layar
 * berputar selamanya — kegagalan paling membingungkan, karena tidak ada yang
 * bisa dilakukan pengguna selain menunggu sesuatu yang tak akan datang. */
const BATAS_MS = 12000;

export default function Callback() {
  const navigate = useNavigate();
  const [galat, setGalat] = useState(null);
  const [teknis, setTeknis] = useState("");
  const { sesi, memuat, sudahMasuk } = useAuth();

  /* 🔴 Sesi Supabase ada LEBIH DULU daripada baris `profiles` yang memuat
   *    peran. Versi lama berpindah begitu sesinya ada — selalu ke
   *    /onboarding — sehingga pengguna Google yang sudah lama terdaftar
   *    ditanyai perannya berulang kali. Di sini kita menunggu profilnya
   *    lengkap, baru menentukan arah. */
  const [siapPindah, setSiapPindah] = useState(false);

  useEffect(() => {
    if (!siapPindah || memuat || !sudahMasuk) return;
    navigate(arahSetelahMasuk(sesi), { replace: true });
  }, [siapPindah, memuat, sudahMasuk, sesi, navigate]);

  useEffect(() => {
    if (!adaSupabase) {
      navigate("/onboarding", { replace: true });
      return;
    }

    let hidup = true;

    /* Google bisa memulangkan kegagalan lewat query/fragment, misalnya ketika
       pengguna menekan "Batal" di layar persetujuan. Itu bukan galat teknis,
       jadi jangan ditampilkan sebagai kerusakan. */
    const frag = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const cari = new URLSearchParams(window.location.search);
    const galatOAuth = frag.get("error_description") || cari.get("error_description") || frag.get("error") || cari.get("error");
    if (galatOAuth) {
      /* Sebab teknisnya DISIMPAN, tidak dibuang. Versi pertama halaman ini
         hanya menampilkan kalimat umum, dan akibatnya kegagalan pertama di
         lapangan tidak bisa didiagnosis sama sekali — kode galatnya sudah
         terlanjur hilang bersama URL. Kalimat ramah untuk pengguna, kode
         mentah di balik "Detail teknis" untuk yang memperbaiki. */
      const kode = frag.get("error") || cari.get("error") || "";
      const rinci = frag.get("error_description") || cari.get("error_description") || "";
      setTeknis([kode, rinci].filter(Boolean).join(" — ") || galatOAuth);
      setGalat(
        /access_denied|cancel/i.test(galatOAuth)
          ? "Kamu membatalkan masuk lewat Google. Tidak ada yang berubah."
          : "Masuk lewat Google tidak selesai. Coba lagi, atau pakai username dan password."
      );
      return;
    }

    /* Dua jalur, mana pun yang lebih dulu tiba:
       - sesi SUDAH ada saat halaman ini dibuka (penukaran selesai duluan)
       - sesi datang belakangan lewat onAuthStateChange */
    const teruskan = () => {
      if (!hidup) return;
      /* Menyalakan niat, bukan langsung berpindah: arah tujuannya baru bisa
         diputuskan sesudah profil (dan perannya) tiba. Efek di atas yang
         mengeksekusi, dengan `replace` supaya halaman ini tidak muncul saat
         pengguna menekan Kembali. */
      setSiapPindah(true);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) teruskan();
    });

    const { data: langganan } = supabase.auth.onAuthStateChange((_ev, sesi) => {
      if (sesi) teruskan();
    });

    const jam = setTimeout(() => {
      if (!hidup) return;
      setGalat("Masuk lewat Google terlalu lama. Coba lagi, atau pakai username dan password.");
    }, BATAS_MS);

    return () => {
      hidup = false;
      clearTimeout(jam);
      langganan.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
        <div className="auth auth--tunggal">
      {/* Pembungkus `auth auth--tunggal` WAJIB, bukan hiasan: aturan 980px di
        halaman.css:288 mengunci `.auth__utama` ke 620px di tepi kiri untuk layar
        Masuk yang punya panel samping. Tanpa `.auth--tunggal`, halaman yang
        berdiri sendiri mewarisi lebar itu dan isinya terjepit di kiri dengan
        820px ruang kosong di kanannya. */}
      <main className="auth__utama" aria-live="polite">
        <div className="auth__kotak kotak-tunggu">
          <Logo />
          {galat ? (
            <>
              <h1 className="auth__judul">Belum berhasil masuk</h1>
              <p className="auth__sub">{galat}</p>
              {teknis && (
                <details className="galat-teknis">
                  <summary>Detail teknis</summary>
                  <code>{teknis}</code>
                </details>
              )}
              <button
                type="button"
                className="tombol tombol--primary tombol--penuh tombol--besar"
                onClick={() => navigate("/masuk", { replace: true })}
              >
                Kembali ke halaman Masuk
              </button>
            </>
          ) : (
            <>
              <h1 className="auth__judul">Menyiapkan akunmu…</h1>
              {/* Kalimatnya menyebut APA yang sedang ditunggu. "Memuat…" tidak
                  memberi tahu apa pun, dan menunggu tanpa tahu terasa lebih lama. */}
              <p className="auth__sub">Sebentar, kami sedang menyelesaikan masuk lewat Google.</p>
              <span className="pemuat" role="status" aria-label="Sedang memproses" />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
