import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import Supercluster from "supercluster";

const PUSAT_JAKARTA = [-6.1944, 106.8229];

/**
 * Pin dibedakan BENTUK + IKON, bukan warna saja — syarat aksesibilitas:
 * warna NEVER jadi satu-satunya penanda makna.
 *   terverifikasi : pin tetesan bergaris solid + centang
 *   belum         : pin tetesan bergaris putus + tanda tanya
 *   kluster       : LINGKARAN berangka — bentuknya beda dari pin tunggal
 * Pin terpilih diperbesar dan diberi cincin, dan pin yang sedang disorot dari
 * daftar diberi cincin tipis — keduanya terbaca tanpa membedakan warna.
 */
function ikonPin(terverifikasi, terpilih, disorot) {
  const isi = terverifikasi ? "var(--color-accent)" : "var(--color-warning)";
  const ukuran = terpilih ? 42 : disorot ? 38 : 32;
  const tanda = terverifikasi
    ? '<path d="M8 12.5l2.5 2.5L16 9" fill="none" stroke="#F7F6F2" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
    : '<text x="12" y="16" text-anchor="middle" font-size="11" font-family="sans-serif" font-weight="700" fill="#F7F6F2">?</text>';
  const cincin =
    terpilih || disorot
      ? `<circle cx="12" cy="12" r="11.4" fill="none" stroke="var(--color-primary)" stroke-width="${terpilih ? 2.4 : 1.6}"/>`
      : "";

  return L.divIcon({
    className: "pin",
    html: `<svg width="${ukuran}" height="${ukuran}" viewBox="0 0 24 30" aria-hidden="true">
      ${cincin}
      <path d="M12 29c0 0-9-10.2-9-16.2A9 9 0 0 1 21 12.8C21 18.8 12 29 12 29Z"
            fill="${isi}" stroke="#F7F6F2" stroke-width="1.5"
            stroke-dasharray="${terverifikasi ? "0" : "3 2"}"/>
      ${tanda}
    </svg>`,
    iconSize: [ukuran, ukuran],
    iconAnchor: [ukuran / 2, ukuran],
  });
}

/** Kluster = lingkaran + ANGKA. Ukurannya ikut jumlah, tapi angkanya yang
 *  memikul makna — pembaca layar dan mata yang tidak membedakan warna sama
 *  saja terbantu. */
function ikonKluster(jumlah, disorot) {
  const d = jumlah < 10 ? 38 : jumlah < 50 ? 46 : 54;
  return L.divIcon({
    className: "pin",
    html: `<svg width="${d}" height="${d}" viewBox="0 0 54 54" aria-hidden="true">
      ${disorot ? '<circle cx="27" cy="27" r="26" fill="none" stroke="var(--color-foreground)" stroke-width="2.5"/>' : ""}
      <circle cx="27" cy="27" r="24" fill="var(--color-primary)" stroke="#F7F6F2" stroke-width="3"/>
      <text x="27" y="34" text-anchor="middle" font-family="system-ui, sans-serif"
            font-size="19" font-weight="700" fill="#F7F6F2">${jumlah}</text>
    </svg>`,
    iconSize: [d, d],
    iconAnchor: [d / 2, d / 2],
  });
}

/** Menggeser peta ke lowongan yang dipilih dari daftar — sinkronisasi dua arah. */
function IkutiPilihan({ terpilih }) {
  const map = useMap();
  useEffect(() => {
    if (!terpilih) return;
    map.flyTo([terpilih.lat, terpilih.lng], Math.max(map.getZoom(), 14), {
      duration: 0.6,
    });
  }, [terpilih, map]);
  return null;
}

/**
 * Lapisan pin dengan clustering.
 *
 * Kenapa clustering perlu: 30 pin di Jakarta sudah saling menimpa di zoom 11,
 * dan target pilot ratusan lowongan. Tanpa ini pengguna melihat gumpalan pin
 * yang tidak bisa ditekan satu per satu.
 *
 * Query dibatasi ke bounding box viewport — bukan menarik seluruh Jakarta tiap
 * geseran. Itu juga bentuk yang sama dengan query PostGIS nanti.
 */
function LapisanPin({ daftar, terpilih, disorot, onPilih }) {
  const [tampilan, setTampilan] = useState(null);
  const map = useMap();

  const indeks = useMemo(() => {
    const sc = new Supercluster({ radius: 64, maxZoom: 16 });
    sc.load(
      daftar.map((l) => ({
        type: "Feature",
        properties: { id: l.id, data: l },
        geometry: { type: "Point", coordinates: [l.lng, l.lat] },
      }))
    );
    return sc;
  }, [daftar]);

  const hitung = () => {
    const b = map.getBounds();
    setTampilan(
      indeks.getClusters(
        [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
        Math.round(map.getZoom())
      )
    );
  };

  useEffect(hitung, [indeks, map]);
  useMapEvents({ moveend: hitung, zoomend: hitung });

  if (!tampilan) return null;

  /* Kalau lowongan yang di-hover sedang berada DI DALAM kluster, klusternya
     yang menyala — kalau tidak, sorotan dari daftar seolah tidak berfungsi
     setiap kali pin-nya sedang menggumpal. */
  let klusterDisorot = null;
  if (disorot) {
    for (const f of tampilan) {
      if (!f.properties.cluster) continue;
      const isi = indeks.getLeaves(f.id, 1000);
      if (isi.some((d) => d.properties.id === disorot)) {
        klusterDisorot = f.id;
        break;
      }
    }
  }

  return tampilan.map((f) => {
    const [lng, lat] = f.geometry.coordinates;

    if (f.properties.cluster) {
      const jumlah = f.properties.point_count;
      return (
        <Marker
          key={`c${f.id}`}
          position={[lat, lng]}
          icon={ikonKluster(jumlah, klusterDisorot === f.id)}
          keyboard={true}
          alt={`${jumlah} lowongan di area ini — buka untuk memperbesar`}
          title={`${jumlah} lowongan — klik untuk memperbesar`}
          eventHandlers={{
            click: () => {
              // Menekan kluster memperbesar sampai ia pecah, bukan sekadar
              // zoom satu tingkat yang bisa membuatnya tetap menggumpal.
              const z = Math.min(indeks.getClusterExpansionZoom(f.id), 17);
              map.flyTo([lat, lng], z, { duration: 0.5 });
            },
          }}
        />
      );
    }

    const l = f.properties.data;
    return (
      <Marker
        key={l.id}
        position={[lat, lng]}
        icon={ikonPin(l.terverifikasi, terpilih?.id === l.id, disorot === l.id)}
        eventHandlers={{ click: () => onPilih(l) }}
        keyboard={true}
        alt={`${l.posisi} di ${l.perusahaan}`}
        title={`${l.posisi} — ${l.perusahaan}`}
      />
    );
  });
}

/** Titik "kamu di sini".
 *
 * Bentuknya SENGAJA berbeda dari dua penanda lain supaya tidak perlu
 * membedakan warna: lowongan memakai pin tetesan, kluster memakai lingkaran
 * BERANGKA, dan titik ini lingkaran kecil polos bercincin putih dengan halo.
 * Ia juga satu-satunya penanda yang tidak bisa diklik — ia menyatakan posisi,
 * bukan menawarkan aksi.
 */
function ikonSaya() {
  return L.divIcon({
    className: "titik-saya",
    html: `<span class="titik-saya__halo" aria-hidden="true"></span>
           <span class="titik-saya__inti" aria-hidden="true"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

/** Menaruh titik posisi pengguna dan menggeser peta ke sana saat pertama didapat. */
function TitikSaya({ posisi }) {
  const map = useMap();
  const sudahPindah = useRef(false);

  useEffect(() => {
    if (!posisi) {
      // Lokasi dicabut: izinkan geseran otomatis lagi kalau nanti diminta ulang.
      sudahPindah.current = false;
      return;
    }
    if (sudahPindah.current) return;
    sudahPindah.current = true;

    /* Hanya sekali. Menggeser peta tiap kali koordinat diperbarui akan
       merebut kembali peta dari tangan orang yang sedang menggesernya. */
    const diam = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const zoom = Math.max(map.getZoom(), 14);

    /* 🔴 Di bawah 900px bottom sheet MENUTUPI separuh bawah peta, sedangkan
       peta sendiri setinggi layar penuh di belakangnya. Menaruh titik di pusat
       peta berarti menaruhnya persis di balik sheet — pengguna menekan "Lokasi
       saya", peta bergerak, dan tidak ada apa pun yang terlihat berubah.
       Jadi pusatnya digeser ke selatan sebanyak separuh tinggi sheet, supaya
       titiknya mendarat di tengah bagian peta yang BENAR-BENAR terlihat. */
    const panel = document.querySelector(".panel");
    const petaKotak = map.getContainer().getBoundingClientRect();
    const panelKotak = panel?.getBoundingClientRect();
    const tertutup =
      panelKotak && panelKotak.top < petaKotak.bottom && panelKotak.left < petaKotak.right
        ? Math.max(0, petaKotak.bottom - panelKotak.top)
        : 0;

    let tujuan = L.latLng(posisi.lat, posisi.lng);
    if (tertutup > 0) {
      const titik = map.project(tujuan, zoom);
      titik.y += tertutup / 2;
      tujuan = map.unproject(titik, zoom);
    }

    if (diam) map.setView(tujuan, zoom);
    else map.flyTo(tujuan, zoom, { duration: 0.8 });
  }, [posisi, map]);

  if (!posisi) return null;

  return (
    <Marker
      position={[posisi.lat, posisi.lng]}
      icon={ikonSaya()}
      interactive={false}
      keyboard={false}
      alt="Lokasi kamu sekarang"
      title="Lokasi kamu sekarang"
      zIndexOffset={1000}
    />
  );
}

export default function PetaLowongan({ daftar, terpilih, disorot, onPilih, posisiSaya }) {
  return (
    <MapContainer
      center={PUSAT_JAKARTA}
      zoom={11}
      className="peta"
      zoomControl={true}
      scrollWheelZoom={true}
    >
      {/* Atribusi ODbL wajib terlihat — syarat lisensi OpenStreetMap. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <LapisanPin daftar={daftar} terpilih={terpilih} disorot={disorot} onPilih={onPilih} />
      <IkutiPilihan terpilih={terpilih} />
      <TitikSaya posisi={posisiSaya} />
    </MapContainer>
  );
}
