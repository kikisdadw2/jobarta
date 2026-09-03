-- JOBARTA — skema lamaran
--
-- Cara pakai: Supabase → SQL Editor → tempel → Run. Aman diulang.
-- Jalankan SETELAH schema.sql dan schema-lowongan.sql.
--
-- Ini bagian yang menutup lingkaran produk: sebelum tabel ini ada, lamaran
-- hanya tersimpan di perangkat pelamar, sehingga employer selamanya melihat
-- nol pelamar berapa pun orang yang melamar.

-- ---------------------------------------------------------------------------
-- 1. Tabel
-- ---------------------------------------------------------------------------
create table if not exists public.lamaran (
  id uuid primary key default gen_random_uuid(),

  -- FK ke `profiles`, bukan langsung ke auth.users. Dua alasan: PostgREST
  -- butuh relasi ini untuk menyisipkan data pelamar dalam satu permintaan,
  -- dan profil memang identitas yang dilihat employer.
  pelamar uuid not null references public.profiles on delete cascade,
  lowongan_id uuid not null references public.lowongan on delete cascade,

  status text not null default 'terkirim'
    check (status in ('terkirim','dilihat','diproses','ditolak','diterima')),

  dilamar_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now(),

  -- Satu orang satu lamaran per lowongan. Dijaga database, bukan klien:
  -- pemeriksaan di klien kalah oleh dua ketukan cepat di koneksi lambat.
  unique (pelamar, lowongan_id)
);

create index if not exists lamaran_lowongan_idx on public.lamaran (lowongan_id);
create index if not exists lamaran_pelamar_idx on public.lamaran (pelamar);

create or replace function public.sentuh_diperbarui_pada()
returns trigger language plpgsql as $$
begin
  new.diperbarui_pada = now();
  return new;
end;
$$;

drop trigger if exists lamaran_updated_at on public.lamaran;
drop trigger if exists lamaran_diperbarui_pada on public.lamaran;
create trigger lamaran_diperbarui_pada
  before update on public.lamaran
  for each row execute function public.sentuh_diperbarui_pada();

-- ---------------------------------------------------------------------------
-- 2. RLS
-- ---------------------------------------------------------------------------
alter table public.lamaran enable row level security;

-- Baca: pelamar melihat lamarannya sendiri; employer melihat lamaran yang
-- masuk ke lowongan MILIKNYA saja.
drop policy if exists "lamaran: baca" on public.lamaran;
create policy "lamaran: baca"
  on public.lamaran for select
  using (
    auth.uid() = pelamar
    or exists (
      select 1 from public.lowongan lo
      where lo.id = lamaran.lowongan_id and lo.pemilik = auth.uid()
    )
  );

-- Melamar: hanya untuk diri sendiri, dan hanya ke lowongan yang masih tayang.
-- Syarat kedua penting: tanpa itu orang bisa melamar lewat API ke lowongan
-- yang sudah ditutup, yang tidak pernah mungkin lewat antarmuka.
drop policy if exists "lamaran: kirim" on public.lamaran;
create policy "lamaran: kirim"
  on public.lamaran for insert
  with check (
    auth.uid() = pelamar
    and exists (
      select 1 from public.lowongan lo
      where lo.id = lowongan_id and lo.aktif
    )
  );

-- Batalkan: hanya pelamarnya.
drop policy if exists "lamaran: batalkan" on public.lamaran;
create policy "lamaran: batalkan"
  on public.lamaran for delete
  using (auth.uid() = pelamar);

-- Ubah status: hanya EMPLOYER pemilik lowongan. Pelamar sengaja tidak boleh —
-- kalau boleh, siapa pun bisa menandai lamarannya sendiri "diterima".
drop policy if exists "lamaran: ubah status" on public.lamaran;
create policy "lamaran: ubah status"
  on public.lamaran for update
  using (
    exists (
      select 1 from public.lowongan lo
      where lo.id = lamaran.lowongan_id and lo.pemilik = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.lowongan lo
      where lo.id = lamaran.lowongan_id and lo.pemilik = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Employer boleh melihat profil orang yang melamar kepadanya
-- ---------------------------------------------------------------------------
-- Sampai sekarang `profiles` hanya bisa dibaca pemiliknya, jadi dasbor employer
-- akan menampilkan daftar lamaran tanpa nama siapa pun.
--
-- Alternatif yang SENGAJA TIDAK dipakai: menyalin nama pelamar ke baris lamaran
-- saat melamar. Salinan itu dikirim klien, jadi seorang pelamar bisa mengaku
-- bernama orang lain. Memberi izin baca yang sempit lebih aman — dan aksesnya
-- berakhir sendiri saat lamaran dibatalkan atau lowongannya dihapus.
--
-- Yang terbuka HANYA profil yang benar-benar melamar ke lowongan milik pembaca.
drop policy if exists "profil pelamar: baca oleh employer" on public.profiles;
create policy "profil pelamar: baca oleh employer"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.lamaran la
      join public.lowongan lo on lo.id = la.lowongan_id
      where la.pelamar = profiles.id and lo.pemilik = auth.uid()
    )
  );
