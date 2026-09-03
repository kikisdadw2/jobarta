-- JOBARTA — skema lowongan (PostGIS)
--
-- Cara pakai: Supabase → SQL Editor → tempel seluruh berkas → Run.
-- Aman dijalankan ulang. Jalankan SETELAH schema.sql.
--
-- Kontrak bentuk data dipertahankan persis seperti `src/data/lowongan.js`:
-- peta, kartu, panel detail, dan Lamaran Saya membaca satu bentuk saja.

-- ---------------------------------------------------------------------------
-- 0. PostGIS
-- ---------------------------------------------------------------------------
create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- 1. Tabel lowongan
-- ---------------------------------------------------------------------------
create table if not exists public.lowongan (
  id uuid primary key default gen_random_uuid(),

  -- Pemilik. on delete cascade: akun employer hilang → lowongannya ikut hilang,
  -- supaya tidak ada pin yatim di peta yang tak bisa dihubungi siapa pun.
  pemilik uuid not null references auth.users on delete cascade,

  posisi text not null,
  perusahaan text not null,
  kategori text not null check (kategori in
    ('Ritel','F&B','Gudang & Logistik','Admin','Kurir','Produksi')),
  tipe text not null check (tipe in
    ('Penuh Waktu','Paruh Waktu','Kontrak','Harian')),

  -- null = tidak disebutkan. Dijaga konsisten: kalau keduanya diisi, min <= max.
  gaji_min bigint check (gaji_min >= 0),
  gaji_max bigint check (gaji_max >= 0),
  constraint gaji_masuk_akal check (
    gaji_min is null or gaji_max is null or gaji_min <= gaji_max
  ),

  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),

  -- Titik geografi diturunkan OTOMATIS dari lat/lng, bukan diisi klien.
  -- Kalau klien mengirimnya sendiri, suatu saat ia akan tidak sinkron dengan
  -- lat/lng dan peta menampilkan pin di tempat yang berbeda dari detailnya.
  geog geography(Point, 4326)
    generated always as (extensions.ST_MakePoint(lng, lat)::geography) stored,

  alamat text not null,
  deskripsi text not null default '',
  syarat text[] not null default '{}',

  -- Legalitas perusahaan sudah diperiksa admin. Ditulis admin, bukan employer.
  terverifikasi boolean not null default false,
  diverifikasi_pada date,

  -- false = ditutup: hilang dari peta, tetap tampil di dasbor pemiliknya.
  aktif boolean not null default true,

  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

-- Index GiST: inti dari pencarian radius. Tanpa ini setiap query jarak
-- memindai seluruh tabel.
create index if not exists lowongan_geog_idx on public.lowongan using gist (geog);
create index if not exists lowongan_pemilik_idx on public.lowongan (pemilik);

drop trigger if exists lowongan_updated_at on public.lowongan;
create trigger lowongan_updated_at
  before update on public.lowongan
  for each row execute function public.sentuh_updated_at();

-- ---------------------------------------------------------------------------
-- 2. RLS
-- ---------------------------------------------------------------------------
alter table public.lowongan enable row level security;

-- Baca: lowongan aktif terbuka untuk SIAPA SAJA, termasuk pengunjung yang
-- belum login. Ini disengaja — peta harus terisi sebelum orang mendaftar.
-- Pemilik tetap melihat lowongannya sendiri walau sudah ditutup.
drop policy if exists "lowongan: baca publik" on public.lowongan;
create policy "lowongan: baca publik"
  on public.lowongan for select
  using (aktif or auth.uid() = pemilik);

-- Tulis: hanya pemiliknya. `with check` pada insert mencegah orang memasang
-- lowongan atas nama akun lain.
drop policy if exists "lowongan: pasang" on public.lowongan;
create policy "lowongan: pasang"
  on public.lowongan for insert
  with check (auth.uid() = pemilik);

drop policy if exists "lowongan: ubah" on public.lowongan;
create policy "lowongan: ubah"
  on public.lowongan for update
  using (auth.uid() = pemilik)
  with check (auth.uid() = pemilik);

drop policy if exists "lowongan: hapus" on public.lowongan;
create policy "lowongan: hapus"
  on public.lowongan for delete
  using (auth.uid() = pemilik);

-- ---------------------------------------------------------------------------
-- 3. Pencarian radius — dijalankan di database, bukan di HP
-- ---------------------------------------------------------------------------
-- Mengembalikan lowongan aktif dalam radius meter dari satu titik, lengkap
-- dengan jaraknya, terurut dari yang terdekat. ST_DWithin pada kolom geography
-- memakai index GiST di atas, jadi ia tidak memindai seluruh tabel.
create or replace function public.lowongan_dekat(
  p_lat double precision,
  p_lng double precision,
  p_radius_m double precision default 5000,
  p_limit int default 200
)
returns table (
  id uuid, posisi text, perusahaan text, kategori text, tipe text,
  gaji_min bigint, gaji_max bigint, lat double precision, lng double precision,
  alamat text, deskripsi text, syarat text[], terverifikasi boolean,
  diverifikasi_pada date, dibuat_pada timestamptz, jarak_m double precision
)
language sql
stable
as $$
  select l.id, l.posisi, l.perusahaan, l.kategori, l.tipe,
         l.gaji_min, l.gaji_max, l.lat, l.lng,
         l.alamat, l.deskripsi, l.syarat, l.terverifikasi,
         l.diverifikasi_pada, l.dibuat_pada,
         extensions.ST_Distance(l.geog, extensions.ST_MakePoint(p_lng, p_lat)::geography) as jarak_m
  from public.lowongan l
  where l.aktif
    and extensions.ST_DWithin(
          l.geog, extensions.ST_MakePoint(p_lng, p_lat)::geography, p_radius_m)
  order by jarak_m
  limit least(p_limit, 500);
$$;

grant execute on function public.lowongan_dekat(
  double precision, double precision, double precision, int) to anon, authenticated;
