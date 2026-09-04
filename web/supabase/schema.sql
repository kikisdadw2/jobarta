-- JOBARTA — skema autentikasi & profil
--
-- Cara pakai: buka project di supabase.com → SQL Editor → tempel seluruh berkas
-- ini → Run. Aman dijalankan ulang (semua pakai IF NOT EXISTS / OR REPLACE).
--
-- Konteks keputusan (lihat D:\JOBARTA\decisions.md):
-- JOBARTA punya DUA jalur masuk yang setara — Google OAuth dan username +
-- password. Supabase Auth tidak mendukung login username asli: `auth.users`
-- wajib punya email. Jadi jalur username memakai EMAIL SINTETIS internal
-- (<username>@pengguna.jobarta.local) yang tidak pernah ditampilkan ke
-- pengguna dan tidak pernah dikirimi apa pun.

-- ---------------------------------------------------------------------------
-- 1. Tabel profil
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,

  -- Username unik. Untuk jalur Google ia diturunkan dari email dan boleh null
  -- sampai pengguna memilihnya di onboarding.
  username text unique,

  -- 'google' | 'password'. Menentukan layar mana yang boleh dipakai memulihkan
  -- akun: akun Google tidak punya password untuk diatur ulang.
  auth_method text not null check (auth_method in ('google', 'password')),

  full_name text,
  foto_url text,
  domisili text,

  -- Email pemulihan yang ASLI, terpisah dari email sintetis di auth.users.
  -- 🔴 Aturan keamanan: kolom ini TIDAK PERNAH otomatis menggabungkan akun.
  -- Kalau digabung otomatis, orang lain bisa mengambil alih akun cukup dengan
  -- mendaftar Google memakai alamat yang sama.
  recovery_email text,
  recovery_email_verified boolean not null default false,

  -- Metadata berkas CV: { nama, ukuran, tipe, diunggahPada }.
  -- 🔴 BERKASNYA TIDAK ADA DI SINI, dan memang tidak ada di mana pun untuk
  -- sekarang — yang disimpan hanya keterangannya. Sebelum kolom ini ada,
  -- keterangan itu tinggal di localStorage, sehingga profil yang diisi di
  -- laptop terbaca "0 dari 3 lengkap" begitu dibuka di HP. Saat unggahan
  -- sungguhan masuk ke Supabase Storage, path berkasnya menyusul di sini.
  cv_meta jsonb,

  -- Menandai bahwa email di auth.users adalah sintetis, bukan alamat sungguhan.
  is_synthetic_email boolean not null default false,

  role text check (role in ('seeker', 'employer')),
  account_status text not null default 'pending_consent'
    check (account_status in ('pending_consent', 'active', 'deactivated')),

  -- Jejak persetujuan PDP. Tanggalnya yang jadi bukti kalau ada sengketa,
  -- jadi ia dicatat, bukan sekadar boolean.
  consent_pdp_at timestamptz,
  consent_pdp_source text check (consent_pdp_source in ('form_daftar', 'onboarding')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.is_synthetic_email is
  'true = email di auth.users dibuat dari username, bukan alamat sungguhan milik pengguna. Jangan pernah mengirim email ke alamat itu.';

-- ---------------------------------------------------------------------------
-- 2. Baris profil dibuat OTOMATIS saat akun auth dibuat
-- ---------------------------------------------------------------------------
-- Kenapa trigger, bukan insert dari klien: klien bisa gagal di tengah jalan
-- (jaringan 4G putus tepat setelah signUp berhasil) dan meninggalkan akun auth
-- tanpa profil — pengguna yang bisa masuk tapi tidak punya identitas apa pun.
create or replace function public.buat_profil_baru()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, username, auth_method, full_name, is_synthetic_email, recovery_email
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    coalesce(new.raw_user_meta_data ->> 'auth_method', 'google'),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce((new.raw_user_meta_data ->> 'is_synthetic_email')::boolean, false),
    new.raw_user_meta_data ->> 'recovery_email'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.buat_profil_baru();

-- ---------------------------------------------------------------------------
-- 3. RLS — setiap orang hanya melihat profilnya sendiri
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profil sendiri: baca" on public.profiles;
create policy "profil sendiri: baca"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profil sendiri: ubah" on public.profiles;
create policy "profil sendiri: ubah"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Sengaja TIDAK ada policy INSERT untuk klien: baris profil hanya lahir dari
-- trigger di atas. Membuka insert ke klien membuat orang bisa menyisipkan
-- profil untuk id yang bukan miliknya.

-- ---------------------------------------------------------------------------
-- 4. Ketersediaan username tanpa membocorkan daftar pengguna
-- ---------------------------------------------------------------------------
-- Layar Daftar perlu tahu apakah sebuah username sudah dipakai. Membuka SELECT
-- ke tabel profiles untuk anon akan membocorkan seluruh daftar pengguna, jadi
-- yang dibuka hanya fungsi ini: ia menjawab satu username, boolean, tanpa
-- mengembalikan baris apa pun.
create or replace function public.username_tersedia(nama text)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select not exists (select 1 from public.profiles where username = lower(nama));
$$;

grant execute on function public.username_tersedia(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4c. Mencari email login dari username
-- ---------------------------------------------------------------------------
-- Sejak 2026-09-04 email auth TIDAK selalu sintetis: kalau pendaftar mengisi
-- email pemulihan, alamat ITU yang dipakai sebagai email auth, supaya
-- `resetPasswordForEmail` punya kotak surat sungguhan untuk dituju. Domain
-- sintetis `.local` tidak bisa menerima apa pun, jadi tanpa perubahan ini
-- fitur lupa-password mustahil.
--
-- Konsekuensinya: layar Masuk tidak lagi bisa menebak email dari username,
-- jadi ia harus bertanya. Fungsi inilah yang menjawab.
--
-- 🔴 UTANG KEAMANAN YANG DISADARI. Fungsi ini mengembalikan ALAMAT EMAIL ASLI
--    kepada pemanggil anonim. Siapa pun yang menebak username dengan benar
--    mendapatkan emailnya. Ini lebih berat daripada `username_tersedia` yang
--    hanya menjawab boolean, dan bertentangan dengan sikap anti-enumerasi di
--    layar Masuk dan Lupa Password.
--
--    Mitigasi yang ADA sekarang: hanya melayani akun ber-auth_method
--    'password' (akun Google tidak pernah terbuka), dan hanya cocok persis —
--    tidak ada pencarian sebagian.
--
--    Mitigasi yang BELUM ada dan harus menyusul sebelum rilis publik:
--    pindahkan ke Edge Function yang melakukan login di sisi server, sehingga
--    email tidak pernah meninggalkan basis data. Selama itu belum ada,
--    nyalakan rate limiting di Supabase.
create or replace function public.email_login(nama text)
returns text
language sql
security definer set search_path = public
stable
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.username = lower(nama)
    and p.auth_method = 'password'
  limit 1;
$$;

grant execute on function public.email_login(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4b. Kolom susulan untuk database yang sudah terlanjur dibuat
-- ---------------------------------------------------------------------------
-- `create table if not exists` di atas TIDAK menambah kolom pada tabel yang
-- sudah ada, jadi kolom yang datang belakangan harus disebut lagi di sini.
-- Aman dijalankan berulang.
alter table public.profiles add column if not exists cv_meta jsonb;

-- ---------------------------------------------------------------------------
-- 5. updated_at ikut bergerak
-- ---------------------------------------------------------------------------
create or replace function public.sentuh_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.sentuh_updated_at();
