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

// Component to handle map center updates (flyTo)
// Only reacts to changes in centerLat/centerLng, NOT lat/lng (marker pos)
const MapController = ({ centerLat, centerLng }: { centerLat: number, centerLng: number }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo([centerLat, centerLng], map.getZoom());
  }, [centerLat, centerLng, map]);

  return null;
};

// Component to handle map clicks
const MapClickEvent = ({ onPositionChange }: { onPositionChange: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to invalidate size on fullscreen toggle
const ResizeHandler = ({ isFullscreen }: { isFullscreen: boolean }) => {
  const map = useMap();
  useEffect(() => {
    // Invalidate immediately to catch the size change
    map.invalidateSize();
    
    // Invalidate again after a short tick to ensure the browser has repainted the fixed container
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isFullscreen, map]);
  return null;
};

// Component for the draggable marker
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
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[lat, lng]}
      ref={markerRef}
    >
      <Popup>
        <span>
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

  // Determine container classes based on fullscreen state
  // We remove 'relative' when fixed to avoid conflicts, and use high z-index
  const containerClass = isFullscreen 
    ? 'fixed inset-0 z-[5000] h-screen w-screen bg-slate-900' 
    : 'relative h-full w-full bg-slate-100';

  return (
    <div className={containerClass}>
      <MapContainer 
        center={[centerLat, centerLng]} 
        zoom={13} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        {/* Esri World Imagery (Satellite) */}
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        {/* Labels */}
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

      {/* Custom Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[5001]">
        <button
          onClick={toggleFullscreen}
          className="bg-white p-2 rounded-lg shadow-md hover:bg-slate-50 text-slate-700 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
        </button>
        <button
          onClick={onRecenterRequest}
          className="bg-white p-2 rounded-lg shadow-md hover:bg-slate-50 text-slate-700 transition-colors"
          title="Center map on marker"
        >
          <Crosshair className="w-6 h-6" />
        </button>
      </div>

      {/* Info Overlay */}
      <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-200 text-xs text-slate-600 z-[5001] max-w-[200px] pointer-events-none select-none">
        <p className="font-semibold mb-1">Satellite Mode</p>
        <ul className="list-disc pl-3 space-y-1">
          <li>Click map to move pin</li>
          <li>Drag pin to adjust</li>
          <li>Map won't jump on click</li>
        </ul>
      </div>
    </div>
  );
};