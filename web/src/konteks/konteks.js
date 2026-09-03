import { createContext } from "react";

/* Konteks auth berdiri di berkasnya sendiri.
 *
 * Alasannya bukan gaya: Fast Refresh Vite berhenti bekerja pada berkas yang
 * mencampur komponen dengan ekspor lain. Kalau ia mati, setiap penyimpanan
 * memuat ulang halaman penuh — dan sesi yang sedang diuji ikut kereset,
 * tepat pada bagian yang paling sering diulang saat mengerjakan auth. */
export const KonteksAuth = createContext(null);
