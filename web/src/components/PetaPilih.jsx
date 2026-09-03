import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

/* Pemilih titik lokasi untuk form pasang lowongan.
 *
 * Kebalikan dari PetaKecil: di sini interaksi justru inti pekerjaannya.
 * Mengetik koordinat lat/lng adalah cara tercepat membuat pemilik warung
 * menyerah — dan satu digit salah menaruh lowongannya di Laut Jawa. Menekan
 * peta tidak bisa salah ketik.
 */
const ikon = L.divIcon({
  className: "pin",
  html: `<svg width="34" height="34" viewBox="0 0 24 30" aria-hidden="true">
    <path d="M12 29c0 0-9-10.2-9-16.2A9 9 0 0 1 21 12.8C21 18.8 12 29 12 29Z"
          fill="var(--color-primary)" stroke="#F7F6F2" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="3.4" fill="#F7F6F2"/>
  </svg>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

/* Pusat Jakarta (Monas). Dipakai saat titik belum dipilih — peta yang terbuka
 * di tengah samudra membuat orang mengira petanya rusak. */
const PUSAT_JAKARTA = [-6.1754, 106.8272];

function Penangkap({ onPilih }) {
  useMapEvents({ click: (e) => onPilih(e.latlng.lat, e.latlng.lng) });
  return null;
}

function IkutiUkuran() {
  const map = useMap();
  useEffect(() => {
    const pengamat = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    pengamat.observe(map.getContainer());
    return () => pengamat.disconnect();
  }, [map]);
  return null;
}

export default function PetaPilih({ lat, lng, onPilih }) {
  const ada = lat != null && lng != null;
  return (
    <div className="peta-pilih">
      <MapContainer
        center={ada ? [lat, lng] : PUSAT_JAKARTA}
        zoom={ada ? 15 : 12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {ada && (
          <Marker
            position={[lat, lng]}
            icon={ikon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const p = e.target.getLatLng();
                onPilih(p.lat, p.lng);
              },
            }}
            alt="Titik lokasi lowongan"
          />
        )}
        <Penangkap onPilih={onPilih} />
        <IkutiUkuran />
      </MapContainer>
      {!ada && (
        <p className="peta-pilih__ajak">Ketuk peta untuk menandai lokasi kerjanya</p>
      )}
    </div>
  );
}
