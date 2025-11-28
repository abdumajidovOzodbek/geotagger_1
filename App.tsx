import React, { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { MapView } from './components/MapView';
import { ExifEditor } from './components/ExifEditor';
import { UploadedImage, GPSData } from './types';
import { parseExifData } from './utils/geoUtils';
import { Map as MapIcon, RotateCcw, Lock, MapPin } from 'lucide-react';

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
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManualGpsChange = (newGps: GPSData) => {
    setCurrentGps(newGps);
    setMapCenter(newGps);
  };

  const handleMapInteraction = (lat: number, lng: number) => {
    setCurrentGps(prev => ({ ...prev, lat, lng }));
  };

  const handleRecenter = () => {
    setMapCenter(currentGps);
  };

  const resetApp = () => {
    setImage(null);
    setCurrentGps(DEFAULT_GPS);
    setMapCenter(DEFAULT_GPS);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-black text-white selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-50 flex-none">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapIcon className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold tracking-tight text-white">
              GeoTagger <span className="text-zinc-500">Tashkent</span>
            </h1>
          </div>
          <div className="text-sm font-medium text-blue-400 uppercase tracking-wider">
            Tashkent Edition
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
        
        {/* Left Sidebar: Controls */}
        <div className="flex-1 lg:flex-none w-full lg:w-[480px] min-h-0 bg-black border-r border-zinc-800 overflow-y-auto custom-scrollbar p-8 z-10 flex flex-col gap-8 order-1 lg:order-1">
          
          {!image ? (
            <div className="flex-1 flex flex-col justify-center animate-in fade-in duration-500">
              <div className="mb-10">
                <h2 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Add Location to Photos</h2>
                <p className="text-zinc-400 text-lg leading-relaxed">Easily edit, remove, or add GPS coordinates to your JPEG images directly in the browser.</p>
              </div>

              <ImageUploader onImageSelected={handleImageSelect} />
              
              <div className="mt-12 space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="bg-zinc-900 p-2 rounded-lg">
                    <Lock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">100% Private</h3>
                    <p className="text-sm text-zinc-500 mt-1">Photos are processed locally. They never leave your device.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="bg-zinc-900 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Tashkent Map</h3>
                    <p className="text-sm text-zinc-500 mt-1">Integrated high-resolution satellite imagery.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <h3 className="text-xl font-bold text-white">Editor</h3>
                <button 
                  onClick={resetApp}
                  className="text-xs font-medium text-zinc-500 hover:text-white flex items-center gap-2 transition-colors uppercase tracking-wider bg-zinc-900 px-3 py-1.5 rounded-md"
                >
                  <RotateCcw className="w-3 h-3" /> Start Over
                </button>
              </div>

              {/* Thumbnail */}
              <div className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl shrink-0 group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <img 
                  src={image.previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-contain relative z-10" 
                />
              </div>

              <ExifEditor 
                image={image} 
                currentGps={currentGps} 
                onGpsChange={handleManualGpsChange} 
              />
            </>
          )}

          <div className="mt-auto pt-6 border-t border-zinc-900">
            <p className="text-xs text-zinc-600 text-center font-mono">
              GeoTagger Pro v1.0 • Client-side Processing
            </p>
          </div>
        </div>

        {/* Right Content: Map */}
        <div className="flex-none lg:flex-1 h-[40vh] lg:h-full relative bg-zinc-900 border-t lg:border-t-0 border-zinc-800 order-2 lg:order-2">
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