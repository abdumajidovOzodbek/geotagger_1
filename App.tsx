import React, { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { MapView } from './components/MapView';
import { ExifEditor } from './components/ExifEditor';
import { UploadedImage, GPSData } from './types';
import { parseExifData } from './utils/geoUtils';
import { Map as MapIcon, RotateCcw } from 'lucide-react';

// Default to Tashkent, Uzbekistan
const DEFAULT_GPS: GPSData = {
  lat: 41.2995,
  lng: 69.2401,
  altitude: 0
};

export default function App() {
  const [image, setImage] = useState<UploadedImage | null>(null);
  
  // currentGps represents where the PIN is
  const [currentGps, setCurrentGps] = useState<GPSData>(DEFAULT_GPS);
  
  // mapCenter represents where the CAMERA looks
  const [mapCenter, setMapCenter] = useState<GPSData>(DEFAULT_GPS);

  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const metadata = parseExifData(result);
        
        setImage({
          file,
          previewUrl: result,
          metadata
        });

        if (metadata.gps && metadata.gps.lat !== 0 && metadata.gps.lng !== 0) {
          // If image has GPS, move pin AND camera
          const newGps = metadata.gps;
          setCurrentGps(newGps);
          setMapCenter(newGps);
        } else {
          // Keep current camera/pin (Tashkent) if no GPS in image
          // Or reset to default if desired. 
          // For now, let's just keep the existing view context or default.
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Called when user types in inputs - move Pin AND Camera
  const handleManualGpsChange = (newGps: GPSData) => {
    setCurrentGps(newGps);
    setMapCenter(newGps);
  };

  // Called when user drags pin or clicks map - move Pin ONLY (Scene does not change position)
  const handleMapInteraction = (lat: number, lng: number) => {
    setCurrentGps(prev => ({ ...prev, lat, lng }));
  };

  // Explicit re-center button action
  const handleRecenter = () => {
    setMapCenter(currentGps);
  };

  const resetApp = () => {
    setImage(null);
    setCurrentGps(DEFAULT_GPS);
    setMapCenter(DEFAULT_GPS);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 flex-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <MapIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              GeoTagger Tashkent
            </h1>
          </div>
          <div className="text-sm font-medium text-slate-500">
            Tashkent Edition
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
        
        {/* Left Sidebar: Controls */}
        <div className="flex-1 lg:flex-none w-full lg:w-[450px] min-h-0 bg-white border-r border-slate-200 overflow-y-auto p-6 z-10 flex flex-col gap-6 shadow-xl shadow-slate-200/50 order-1 lg:order-1">
          
          {!image ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Add Location to Photos</h2>
                <p className="text-slate-500 text-lg">Easily edit GPS data for your JPEG images.</p>
              </div>
              <ImageUploader onImageSelected={handleImageSelect} />
              
              <div className="mt-12 grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <h3 className="font-semibold text-slate-800 mb-1">🔒 100% Private</h3>
                  <p className="text-sm text-slate-500">Photos never leave your device.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <h3 className="font-semibold text-slate-800 mb-1">📍 Tashkent Map</h3>
                  <p className="text-sm text-slate-500">High-res satellite imagery.</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Editor</h3>
                <button 
                  onClick={resetApp}
                  className="text-sm text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Start Over
                </button>
              </div>

              {/* Thumbnail */}
              <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-inner shrink-0">
                <img 
                  src={image.previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-contain" 
                />
              </div>

              <ExifEditor 
                image={image} 
                currentGps={currentGps} 
                onGpsChange={handleManualGpsChange} 
              />
            </>
          )}

          <div className="mt-auto pt-6 text-center">
            <p className="text-xs text-slate-400">
              Built with React, Leaflet & Piexifjs
            </p>
          </div>
        </div>

        {/* Right Content: Map */}
        <div className="flex-none lg:flex-1 h-[40vh] lg:h-full relative bg-slate-900 border-t lg:border-t-0 border-slate-200 order-2 lg:order-2">
          <MapView 
            lat={currentGps.lat} 
            lng={currentGps.lng}
            centerLat={mapCenter.lat}
            centerLng={mapCenter.lng}
            onPositionChange={handleMapInteraction}
            onRecenterRequest={handleRecenter}
          />
        </div>
      </main>
    </div>
  );
}