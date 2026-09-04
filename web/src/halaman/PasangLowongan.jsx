import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import NavPerusahaan from "../komponen-ui/NavPerusahaan";
import PetaPilih from "../components/PetaPilih";
import { KATEGORI, TIPE_KERJA } from "../data/lowongan";
import { tambahLowongan, perbaruiLowongan, cariLowonganku } from "../lib/lowonganku";
import { bacaPerusahaan } from "../lib/perusahaan";

/* Form pasang lowongan — layar inti sisi employer.
 *
 * Dua keputusan yang menentukan bentuk layar ini:
 *
 * 1. GAJI WAJIB DIISI. Di papan lowongan lain ia opsional, dan hasilnya
 *    "gaji nego" di mana-mana — persis keluhan yang paling sering muncul dari
 *    pencari kerja harian. JOBARTA menukar sedikit gesekan bagi employer
 *    dengan kepercayaan bagi seeker. Kalau memang belum pasti, yang dipakai
 *    adalah rentang, bukan kekosongan.
 * 2. LOKASI DIPILIH DI PETA, bukan diketik. Seluruh produk ini adalah peta;
 *    lowongan tanpa titik yang benar tidak punya tempat di dalamnya.
 */
const KOSONG = {
  posisi: "",
  kategori: "",
  tipe: "",
  gajiMin: "",
  gajiMax: "",
  alamat: "",
  lat: null,
  lng: null,
  deskripsi: "",
  syarat: "",
};

/* Validasi mengembalikan pesan per-field supaya galat muncul DI SEBELAH
 * kolomnya, bukan sebagai satu daftar di atas form yang memaksa orang
 * mencocokkan sendiri mana yang salah. */
function periksa(f) {
  const g = {};
  if (!f.posisi.trim()) g.posisi = "Tulis nama pekerjaannya, misalnya “Kasir Minimarket”.";
  if (!f.kategori) g.kategori = "Pilih satu kategori.";
  if (!f.tipe) g.tipe = "Pilih tipe kerjanya.";

  const min = Number(f.gajiMin);
  const max = Number(f.gajiMax);
  if (!f.gajiMin) g.gajiMin = "Isi gaji minimum. Lowongan tanpa gaji jarang dilamar.";
  else if (min < 1000000) g.gajiMin = "Sepertinya kurang satu nol — tulis jumlah per bulan.";
  if (f.gajiMax && max < min) g.gajiMax = "Gaji maksimum tidak boleh di bawah minimum.";

  if (!f.alamat.trim()) g.alamat = "Tulis alamat tempat kerjanya.";
  if (f.lat == null) g.lokasi = "Ketuk peta untuk menandai lokasinya.";
  if (f.deskripsi.trim().length < 30)
    g.deskripsi = "Jelaskan sedikit lebih panjang — apa yang dikerjakan sehari-hari?";
  return g;
}

export default function PasangLowongan() {
  const navigate = useNavigate();
  const { id } = useParams();
  const perusahaan = bacaPerusahaan();

  const [form, setForm] = useState({ ...KOSONG });
  const [galat, setGalat] = useState({});
  const [dicoba, setDicoba] = useState(false);
  const [mengirim, setMengirim] = useState(false);
  const [galatKirim, setGalatKirim] = useState(null);

  /* Mode edit memuat lowongan lama dari server. Ia tidak bisa lagi jadi nilai
   * awal useState seperti dulu, karena pembacaannya kini menyeberangi
   * jaringan. */
  useEffect(() => {
    if (!id) return;
    let batal = false;
    cariLowonganku(id).then((lama) => {
      if (batal || !lama) return;
      setForm({
        ...KOSONG,
        ...lama,
        gajiMin: lama.gajiMin ?? "",
        gajiMax: lama.gajiMax ?? "",
        syarat: (lama.syarat || []).join("\n"),
      });
    });
    return () => { batal = true; };
  }, [id]);

  function ubah(patch) {
    setForm((f) => {
      const baru = { ...f, ...patch };
      // Setelah percobaan kirim pertama, galat diperbarui sambil mengetik —
      // sebelum itu tidak, supaya kolom kosong tidak memerah saat baru dibuka.
      if (dicoba) setGalat(periksa(baru));
      return baru;
    });
  }

  async function kirim(e) {
    e.preventDefault();
    setDicoba(true);
    const g = periksa(form);
    setGalat(g);
    if (Object.keys(g).length > 0) {
      document.querySelector(".field__bantu--salah")?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
      return;
    }

    const isi = {
      posisi: form.posisi.trim(),
      perusahaan: perusahaan.nama || "Perusahaan saya",
      kategori: form.kategori,
      tipe: form.tipe,
      gajiMin: Number(form.gajiMin),
      gajiMax: form.gajiMax ? Number(form.gajiMax) : Number(form.gajiMin),
      lat: form.lat,
      lng: form.lng,
      alamat: form.alamat.trim(),
      deskripsi: form.deskripsi.trim(),
      // Satu syarat per baris: cara paling murah memasukkan daftar lewat HP.
      syarat: form.syarat.split("\n").map((s) => s.trim()).filter(Boolean),
    };

    /* Navigasi HANYA setelah server mengonfirmasi. Kalau dipindah lebih dulu,
     * employer melihat "Lowongan kamu sudah tayang" padahal simpanannya gagal
     * — dan dasbor yang memuat ulang dari server akan tampak kosong. */
    setMengirim(true);
    setGalatKirim(null);
    try {
      if (id) await perbaruiLowongan(id, isi);
      else await tambahLowongan(isi);
      navigate("/perusahaan?baru=1");
    } catch {
      setGalatKirim("Lowongan belum tersimpan. Periksa koneksi lalu coba lagi.");
      setMengirim(false);
    }
  }

  return (
    <div className="halaman">
      <NavPerusahaan />

      <main className="seksi halaman-perusahaan">
        <Link to="/perusahaan" className="tautan-kembali">
          &larr; Kembali ke dasbor
        </Link>
        <h1 className="seksi__judul">{id ? "Ubah lowongan" : "Pasang lowongan"}</h1>

        {perusahaan.status !== "terverifikasi" && (
          <p className="kotak-info">
            <strong>Perusahaan kamu belum terverifikasi.</strong> Lowongan ini tetap
            tayang di peta, tapi tanpa badge terverifikasi &mdash; dan pencari kerja
            melihat catatan itu di halaman detailnya.{" "}
            <Link to="/perusahaan/verifikasi">Ajukan verifikasi</Link>
          </p>
        )}

        <form className="form-pasang" onSubmit={kirim} noValidate>
          <div className="field">
            <label htmlFor="posisi">Nama pekerjaan</label>
            <input
              id="posisi"
              value={form.posisi}
              className={galat.posisi ? "salah" : ""}
              placeholder="Kasir Minimarket"
              onChange={(e) => ubah({ posisi: e.target.value })}
            />
            {galat.posisi && <p className="field__bantu field__bantu--salah">{galat.posisi}</p>}
          </div>

          <div className="form-pasang__dua">
            <div className="field">
              <label htmlFor="kategori">Kategori</label>
              <select
                id="kategori"
                value={form.kategori}
                className={galat.kategori ? "salah" : ""}
                onChange={(e) => ubah({ kategori: e.target.value })}
              >
                <option value="">Pilih kategori&hellip;</option>
                {KATEGORI.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              {galat.kategori && <p className="field__bantu field__bantu--salah">{galat.kategori}</p>}
            </div>

            <div className="field">
              <label htmlFor="tipe">Tipe kerja</label>
              <select
                id="tipe"
                value={form.tipe}
                className={galat.tipe ? "salah" : ""}
                onChange={(e) => ubah({ tipe: e.target.value })}
              >
                <option value="">Pilih tipe&hellip;</option>
                {TIPE_KERJA.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {galat.tipe && <p className="field__bantu field__bantu--salah">{galat.tipe}</p>}
            </div>
          </div>

          <fieldset className="form-pasang__gaji">
            <legend>Gaji per bulan</legend>
            <p className="field__bantu">
              Wajib diisi. Lowongan yang menyebut angka dilamar jauh lebih sering
              daripada yang menulis &ldquo;gaji nego&rdquo;.
            </p>
            <div className="form-pasang__dua">
              <div className="field">
                <label htmlFor="gajiMin">Minimum</label>
                <input
                  id="gajiMin"
                  type="number"
                  inputMode="numeric"
                  value={form.gajiMin}
                  className={galat.gajiMin ? "salah" : ""}
                  placeholder="4500000"
                  onChange={(e) => ubah({ gajiMin: e.target.value })}
                />
                {galat.gajiMin && <p className="field__bantu field__bantu--salah">{galat.gajiMin}</p>}
              </div>
              <div className="field">
                <label htmlFor="gajiMax">
                  Maksimum <span className="field__opsional">opsional</span>
                </label>
                <input
                  id="gajiMax"
                  type="number"
                  inputMode="numeric"
                  value={form.gajiMax}
                  className={galat.gajiMax ? "salah" : ""}
                  placeholder="5200000"
                  onChange={(e) => ubah({ gajiMax: e.target.value })}
                />
                {galat.gajiMax && <p className="field__bantu field__bantu--salah">{galat.gajiMax}</p>}
              </div>
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor="alamat">Alamat tempat kerja</label>
            <input
              id="alamat"
              value={form.alamat}
              className={galat.alamat ? "salah" : ""}
              placeholder="Jl. Kemayoran Gempol, Kemayoran, Jakarta Pusat"
              onChange={(e) => ubah({ alamat: e.target.value })}
            />
            {galat.alamat && <p className="field__bantu field__bantu--salah">{galat.alamat}</p>}
          </div>

          <div className="field">
            <label htmlFor="titik-peta">Titik di peta</label>
            <p className="field__bantu" id="titik-peta">
              Ketuk peta di lokasi tempat kerjanya. Pin bisa digeser kalau meleset.
            </p>
            <PetaPilih
              lat={form.lat}
              lng={form.lng}
              onPilih={(lat, lng) => ubah({ lat, lng })}
            />
            {form.lat != null && (
              <p className="field__bantu field__bantu--benar" role="status">
                Lokasi ditandai. Pencari kerja akan melihat lowongan ini muncul di sana.
              </p>
            )}
            {galat.lokasi && <p className="field__bantu field__bantu--salah">{galat.lokasi}</p>}
          </div>

          <div className="field">
            <label htmlFor="deskripsi">Apa yang dikerjakan?</label>
            <textarea
              id="deskripsi"
              rows={4}
              value={form.deskripsi}
              className={galat.deskripsi ? "salah" : ""}
              placeholder="Melayani pembayaran pelanggan, menjaga kerapian rak, dan mencatat stok harian. Shift pagi atau sore."
              onChange={(e) => ubah({ deskripsi: e.target.value })}
            />
            {galat.deskripsi && <p className="field__bantu field__bantu--salah">{galat.deskripsi}</p>}
          </div>

          <div className="field">
            <label htmlFor="syarat">
              Syarat <span className="field__opsional">satu per baris</span>
            </label>
            <textarea
              id="syarat"
              rows={3}
              value={form.syarat}
              placeholder={"Lulusan SMA/SMK\nTeliti menghitung uang\nBersedia shift"}
              onChange={(e) => ubah({ syarat: e.target.value })}
            />
          </div>

          {galatKirim && (
            <p className="catatan catatan--rusak" role="alert">
              {galatKirim}
            </p>
          )}

          <div className="tumpuk">
            {/* Dinonaktifkan selama pengiriman: tanpa ini, ketukan ganda di
                koneksi lambat memasang dua lowongan yang sama. */}
            <button
              type="submit"
              className="tombol tombol--primary tombol--penuh tombol--besar"
              disabled={mengirim}
            >
              {mengirim
                ? "Menyimpan…"
                : id
                  ? "Simpan perubahan"
                  : "Pasang lowongan"}
            </button>
            <button
              type="button"
              className="tombol tombol--sekunder tombol--penuh"
              onClick={() => navigate("/perusahaan")}
            >
              Batal
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
