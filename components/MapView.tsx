import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Maximize, Minimize, Crosshair } from 'lucide-react';

// Fix for missing default icon in react-leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  lat: number;
  lng: number;
  centerLat: number;
  centerLng: number;
  onPositionChange: (lat: number, lng: number) => void;
  onRecenterRequest: () => void;
}

const MapController = ({ centerLat, centerLng }: { centerLat: number, centerLng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([centerLat, centerLng], map.getZoom());
  }, [centerLat, centerLng, map]);
  return null;
};

const MapClickEvent = ({ onPositionChange }: { onPositionChange: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const ResizeHandler = ({ isFullscreen }: { isFullscreen: boolean }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [isFullscreen, map]);
  return null;
};

const DraggableMarker = ({ lat, lng, onPositionChange }: { lat: number, lng: number, onPositionChange: (lat: number, lng: number) => void }) => {
  const markerRef = useRef<L.Marker>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const newPos = marker.getLatLng();
          onPositionChange(newPos.lat, newPos.lng);
        }
      },
    }),
    [onPositionChange],
  );

  return (
    <Marker draggable={true} eventHandlers={eventHandlers} position={[lat, lng]} ref={markerRef}>
      <Popup className="custom-popup">
        <span className="font-sans font-semibold text-slate-900">
          Selected Location <br /> {lat.toFixed(6)}, {lng.toFixed(6)}
        </span>
      </Popup>
    </Marker>
  );
};

export const MapView: React.FC<MapViewProps> = ({ 
  lat, 
  lng, 
  centerLat, 
  centerLng, 
  onPositionChange,
  onRecenterRequest
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const containerClass = isFullscreen 
    ? 'fixed inset-0 z-[5000] h-screen w-screen bg-black' 
    : 'relative h-full w-full bg-zinc-900';

  return (
    <div className={containerClass}>
      <MapContainer 
        center={[centerLat, centerLng]} 
        zoom={13} 
        style={{ height: "100%", width: "100%", zIndex: 0, background: '#09090b' }}
      >
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <TileLayer
          attribution=''
          url="https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.png"
          opacity={0.7}
        />
        
        <MapController centerLat={centerLat} centerLng={centerLng} />
        <MapClickEvent onPositionChange={onPositionChange} />
        <ResizeHandler isFullscreen={isFullscreen} />
        <DraggableMarker lat={lat} lng={lng} onPositionChange={onPositionChange} />
      </MapContainer>

      {/* Custom Controls Overlay - Dark Theme */}
      <div className="absolute top-6 right-6 flex flex-col gap-3 z-[5001]">
        <button
          onClick={toggleFullscreen}
          className="bg-black/80 backdrop-blur text-white p-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-colors shadow-xl"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
        <button
          onClick={onRecenterRequest}
          className="bg-black/80 backdrop-blur text-white p-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-colors shadow-xl"
          title="Center map on marker"
        >
          <Crosshair className="w-5 h-5" />
        </button>
      </div>

      {/* Info Overlay */}
      <div className="absolute bottom-8 left-8 bg-black/80 backdrop-blur p-4 rounded-xl shadow-2xl border border-zinc-800 text-xs text-zinc-300 z-[5001] max-w-[240px] pointer-events-none select-none">
        <p className="font-bold text-white mb-2 uppercase tracking-widest text-[10px]">Satellite Mode</p>
        <ul className="list-disc pl-3 space-y-1.5 opacity-80">
          <li>Click map to move pin</li>
          <li>Drag pin to adjust</li>
          <li>Coordinates update instantly</li>
        </ul>
      </div>
    </div>
  );
};