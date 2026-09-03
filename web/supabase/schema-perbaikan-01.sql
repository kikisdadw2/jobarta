-- JOBARTA — perbaikan 01: trigger updated_at salah kolom
--
-- Jalankan di SQL Editor. Aman diulang.
--
-- Masalah: tabel `lowongan` dan `lamaran` memakai kolom `diperbarui_pada`,
-- tapi triggernya memakai `sentuh_updated_at()` milik tabel `profiles` yang
-- menulis ke `new.updated_at`. Akibatnya SETIAP UPDATE ke kedua tabel gagal
-- dengan 42703 — termasuk menutup lowongan dan mengubah status pelamar.
--
-- Gejalanya tidak muncul saat insert/select/delete, jadi mudah lolos.

create or replace function public.sentuh_diperbarui_pada()
returns trigger language plpgsql as $$
begin
  new.diperbarui_pada = now();
  return new;
end;
$$;

drop trigger if exists lowongan_updated_at on public.lowongan;
create trigger lowongan_diperbarui_pada
  before update on public.lowongan
  for each row execute function public.sentuh_diperbarui_pada();

drop trigger if exists lamaran_updated_at on public.lamaran;
create trigger lamaran_diperbarui_pada
  before update on public.lamaran
  for each row execute function public.sentuh_diperbarui_pada();
