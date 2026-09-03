/* Syarat password — SATU SUMBER untuk layar Daftar dan Atur Ulang.
 *
 * Artboard 2b-auth/AturUlang menegaskan: "Syarat kekuatan password ditulis
 * sama persis dengan layar Daftar — susunan dan kata-katanya juga. Aturan yang
 * berubah bunyi di layar berbeda membuat orang mengira dirinya salah."
 * Karena itu daftarnya tinggal di sini, bukan disalin di dua komponen.
 *
 * `uji: null` berarti NASIHAT, bukan aturan yang bisa diperiksa mesin — item
 * itu tidak pernah ditandai "terpenuhi", dan tidak boleh ikut memutuskan
 * apakah tombol simpan aktif. Menandai centang pada hal yang tidak kita
 * periksa adalah kebohongan kecil yang mengajari orang mengabaikan centang.
 */
export const SYARAT_PASSWORD = [
  { id: "panjang", teks: "Minimal 8 karakter", uji: (p) => p.length >= 8 },
  {
    id: "campur",
    teks: "Ada huruf dan angka",
    uji: (p) => /[a-z]/i.test(p) && /\d/.test(p),
  },
  { id: "tebakan", teks: "Bukan tanggal lahir atau nama kamu", uji: null },
];

export function passwordLolos(p) {
  return SYARAT_PASSWORD.every((s) => !s.uji || s.uji(p));
}
