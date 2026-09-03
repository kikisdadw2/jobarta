import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";

/* Peta kecil di detail lowongan — SENGAJA mati semua interaksinya.
 * Yang dibutuhkan pengguna di sini cuma "di mana kira-kira", bukan alat
 * jelajah kedua; peta yang bisa digeser di tengah halaman justru menculik
 * gulir jempol dan membuat orang kehilangan konteks. */
const ikon = L.divIcon({
  className: "pin",
  html: `<svg width="32" height="32" viewBox="0 0 24 30" aria-hidden="true">
    <path d="M12 29c0 0-9-10.2-9-16.2A9 9 0 0 1 21 12.8C21 18.8 12 29 12 29Z"
          fill="var(--color-accent)" stroke="#F7F6F2" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="3.4" fill="#F7F6F2"/>
  </svg>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

/* Leaflet menghitung posisi tile dari ukuran kontainer SAAT peta dibuat.
 * Di detail lowongan kontainer itu berubah lebar sesudahnya — panel beralih ke
 * dua kolom di 1440px, dan bottom sheet berubah tinggi di 375px — sehingga
 * pusat peta meleset dan pin terlihat menggeser ke tepi, kadang sampai
 * memperlihatkan laut alih-alih alamatnya.
 *
 * `invalidateSize` memberi tahu Leaflet ukurannya berubah. ResizeObserver
 * membuatnya otomatis alih-alih menebak dengan setTimeout — ukuran bisa berubah
 * kapan saja, bukan cuma sekali sesudah mount. */
function IkutiUkuran({ lat, lng }) {
  const map = useMap();

  useEffect(() => {
    const wadah = map.getContainer();
    const pengamat = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
      map.setView([lat, lng], map.getZoom(), { animate: false });
    });
    pengamat.observe(wadah);
    return () => pengamat.disconnect();
  }, [map, lat, lng]);

  return null;
}

export default function PetaKecil({ lat, lng, nama }) {
  return (
    <div className="peta-kecil">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        attributionControl={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <Marker position={[lat, lng]} icon={ikon} alt={`Lokasi ${nama}`} />
        <IkutiUkuran lat={lat} lng={lng} />
      </MapContainer>
    </div>
  );
}
