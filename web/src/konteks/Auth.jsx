import { useCallback, useEffect, useState } from "react";
import { KonteksAuth } from "./konteks";
import { supabase, adaSupabase, emailSintetis } from "../lib/supabase";
import { bacaSesi, simpanSesi, hapusSesi, KOSONG } from "../lib/sesi";

/* Sumber tunggal keadaan "siapa yang sedang masuk".
 *
 * Dua mode, satu bentuk data:
 *
 *   MODE LOKAL   — `.env.local` kosong. Sesi ditandai di localStorage, password
 *                  tidak pernah diperiksa. Cukup untuk demo, bukan autentikasi.
 *   MODE SUPABASE — kedua variabel terisi. Sesi datang dari Supabase Auth dan
 *                  profilnya dari tabel `profiles`.
 *
 * Komponen tidak pernah tahu bedanya: keduanya mengembalikan objek `sesi`
 * dengan field yang sama persis.
 *
 * 🔴 `memuat` bukan hiasan. Di mode Supabase, membaca sesi butuh perjalanan ke
 *    jaringan; tanpa keadaan "sedang memuat", setiap halaman akan berkedip
 *    sebagai "belum masuk" lebih dulu dan rute terlindungi akan melempar
 *    pengguna yang SUDAH login ke layar Masuk. Di mode lokal `memuat` langsung
 *    false, jadi tidak ada kedipan yang dibuat-buat.
 */

/** Ubah satu baris `profiles` jadi bentuk sesi yang dipakai seluruh aplikasi. */
function dariProfil(baris, user) {
  if (!baris) return { ...KOSONG };
  return {
    id: baris.id,
    username: baris.username,
    authMethod: baris.auth_method,
    fullName: baris.full_name ?? user?.user_metadata?.full_name ?? null,
    foto: baris.foto_url ?? user?.user_metadata?.avatar_url ?? null,
    domisili: baris.domisili ?? null,
    role: baris.role,
    accountStatus: baris.account_status,
    recoveryEmail: baris.recovery_email,
    emailTerverifikasi: baris.recovery_email_verified,
  };
}

export function PenyediaAuth({ children }) {
  const [sesi, setSesi] = useState(() => (adaSupabase ? { ...KOSONG } : bacaSesi()));
  const [memuat, setMemuat] = useState(adaSupabase);

  const ambilProfil = useCallback(async (user) => {
    if (!user) return { ...KOSONG };
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    // Trigger `on_auth_user_created` yang membuat barisnya. Kalau ia belum
    // sempat jalan (jarang, tapi mungkin di detik pertama pendaftaran),
    // jangan anggap pengguna belum masuk — kembalikan yang kita tahu dari
    // user auth-nya dan biarkan pemuatan berikutnya melengkapi.
    if (error || !data) {
      return {
        ...KOSONG,
        id: user.id,
        fullName: user.user_metadata?.full_name ?? null,
        authMethod: user.user_metadata?.auth_method ?? "google",
      };
    }
    return dariProfil(data, user);
  }, []);

  useEffect(() => {
    if (!adaSupabase) return;

    let hidup = true;

    supabase.auth.getSession().then(async ({ data }) => {
      const isi = await ambilProfil(data.session?.user ?? null);
      if (!hidup) return;
      setSesi(isi);
      setMemuat(false);
    });

    /* Menangkap tiga hal sekaligus: login, logout, dan kembalinya pengguna dari
     * redirect Google. Tanpa langganan ini, jalur OAuth berhasil di Supabase
     * tapi antarmuka tetap menampilkan "belum masuk" sampai halaman dimuat ulang. */
    const { data: langganan } = supabase.auth.onAuthStateChange(async (_ev, sesiBaru) => {
      const isi = await ambilProfil(sesiBaru?.user ?? null);
      if (!hidup) return;
      setSesi(isi);
      setMemuat(false);
    });

    return () => {
      hidup = false;
      langganan.subscription.unsubscribe();
    };
  }, [ambilProfil]);

  /* ---------- Aksi ---------- */

  const masukGoogle = useCallback(async () => {
    if (!adaSupabase) {
      // Mode lokal: tandai perangkat ini, tanpa memeriksa apa pun.
      return simpanSesi({
        username: "pengguna.google",
        authMethod: "google",
        fullName: "Rizky Ghazirah Himawan",
        accountStatus: "pending_consent",
        recoveryEmail: "rizky@email.com",
      });
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
    if (error) {
      /* Pesan dibedakan: provider yang belum dinyalakan di dashboard adalah
       * masalah konfigurasi yang permanen sampai admin memperbaikinya, bukan
       * gangguan sesaat. Menyuruh orang "coba lagi sebentar" untuk kasus itu
       * membuat mereka mengulang sesuatu yang tidak akan pernah berhasil. */
      const belumAktif = /provider is not enabled|unsupported provider/i.test(
        error.message || ""
      );
      throw new Error(
        belumAktif
          ? "Masuk lewat Google belum tersedia. Pakai username dan password dulu."
          : "Tidak bisa membuka layar Google. Coba lagi sebentar."
      );
    }
    return null; // halaman berpindah ke Google; hasilnya masuk lewat onAuthStateChange
  }, []);

  const masukPassword = useCallback(async (username, password) => {
    if (!adaSupabase) {
      return simpanSesi({ username, authMethod: "password", accountStatus: "active" });
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: emailSintetis(username),
      password,
    });
    /* Pesannya SENGAJA tidak menyebut mana yang salah. Kalau dipisah
     * ("username tidak ditemukan"), siapa pun bisa memetakan daftar pengguna
     * JOBARTA satu per satu. Ini aturan yang sama dengan layar Lupa Password. */
    if (error) throw new Error("Username atau password salah. Cek lagi, atau atur ulang password.");
    return null;
  }, []);

  const daftarPassword = useCallback(async ({ username, password, recoveryEmail }) => {
    if (!adaSupabase) {
      return simpanSesi({
        username,
        authMethod: "password",
        accountStatus: "pending_consent",
        recoveryEmail: recoveryEmail || null,
      });
    }
    const { error } = await supabase.auth.signUp({
      email: emailSintetis(username),
      password,
      options: {
        data: {
          username: username.toLowerCase(),
          auth_method: "password",
          is_synthetic_email: true,
          recovery_email: recoveryEmail || null,
        },
      },
    });
    if (error) {
      throw new Error(
        error.message.includes("already")
          ? "Username itu sudah dipakai. Coba yang lain."
          : "Pendaftaran gagal. Periksa koneksi lalu coba lagi."
      );
    }
    return null;
  }, []);

  const perbaruiProfil = useCallback(async (patch) => {
    if (!adaSupabase) return setSesi(simpanSesi(patch));

    const kolom = {};
    if ("role" in patch) kolom.role = patch.role;
    if ("fullName" in patch) kolom.full_name = patch.fullName;
    if ("domisili" in patch) kolom.domisili = patch.domisili;
    if ("accountStatus" in patch) kolom.account_status = patch.accountStatus;
    if ("recoveryEmail" in patch) kolom.recovery_email = patch.recoveryEmail;
    if ("username" in patch) kolom.username = patch.username;

    const { error } = await supabase.from("profiles").update(kolom).eq("id", sesi.id);
    if (error) throw new Error("Perubahan belum tersimpan. Periksa koneksi lalu coba lagi.");
    setSesi((s) => ({ ...s, ...patch }));
    return null;
  }, [sesi.id]);

  const keluar = useCallback(async () => {
    if (adaSupabase) await supabase.auth.signOut();
    hapusSesi();
    setSesi({ ...KOSONG });
  }, []);

  const nilai = {
    sesi,
    memuat,
    sudahMasuk: Boolean(sesi.username || sesi.id),
    modeSupabase: adaSupabase,
    masukGoogle,
    masukPassword,
    daftarPassword,
    perbaruiProfil,
    keluar,
  };

  return <KonteksAuth.Provider value={nilai}>{children}</KonteksAuth.Provider>;
}

