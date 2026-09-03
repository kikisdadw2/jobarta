import { useContext } from "react";
import { KonteksAuth } from "./konteks";

/* Dipisah dari Auth.jsx supaya berkas itu hanya mengekspor komponen —
 * Fast Refresh Vite berhenti bekerja pada berkas yang mencampur komponen
 * dengan ekspor lain, dan yang hilang bukan cuma kenyamanan: setiap
 * penyimpanan memuat ulang halaman penuh dan sesi yang sedang diuji ikut
 * kereset. */
export function useAuth() {
  const nilai = useContext(KonteksAuth);
  if (!nilai) throw new Error("useAuth dipakai di luar <PenyediaAuth>");
  return nilai;
}
