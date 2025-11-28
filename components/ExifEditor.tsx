import React, { useEffect, useState } from 'react';
import { UploadedImage, GPSData } from '../types';
import { MapPin, Calendar, Camera, Hash, Save, Download } from 'lucide-react';
import { embedExifData } from '../utils/geoUtils';
import FileSaver from 'file-saver';

interface ExifEditorProps {
  image: UploadedImage;
  currentGps: GPSData;
  onGpsChange: (gps: GPSData) => void;
}

export const ExifEditor: React.FC<ExifEditorProps> = ({ image, currentGps, onGpsChange }) => {
  const [localLat, setLocalLat] = useState(currentGps.lat.toString());
  const [localLng, setLocalLng] = useState(currentGps.lng.toString());
  const [localAlt, setLocalAlt] = useState(currentGps.altitude?.toString() || "0");
  const [isSaving, setIsSaving] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    setLocalLat(currentGps.lat.toFixed(6));
    setLocalLng(currentGps.lng.toFixed(6));
    if (currentGps.altitude !== undefined) {
      setLocalAlt(currentGps.altitude.toString());
    }
  }, [currentGps]);

  const handleManualChange = () => {
    const lat = parseFloat(localLat);
    const lng = parseFloat(localLng);
    const alt = parseFloat(localAlt);

    if (!isNaN(lat) && !isNaN(lng)) {
      onGpsChange({
        lat,
        lng,
        altitude: isNaN(alt) ? 0 : alt
      });
    }
  };

  const handleSaveExif = async () => {
    setIsSaving(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      
      const newJpegBase64 = embedExifData(image.previewUrl, image.metadata, currentGps);
      const byteCharacters = atob(newJpegBase64.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      
    } catch (error) {
      console.error("Error saving EXIF:", error);
      alert("Failed to write EXIF data.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const saveFile = (FileSaver as any).saveAs || FileSaver;
      saveFile(downloadUrl, `geotagged-${image.file.name}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metadata Card */}
      <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-800">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Hash className="w-4 h-4" />
          Image Metadata
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-zinc-500 flex items-center gap-2 mb-1"><Camera className="w-3 h-3" /> Device</span>
            <span className="font-mono text-white block truncate bg-black/30 p-2 rounded border border-zinc-800">
              {image.metadata.make || 'Unknown'} {image.metadata.model}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 flex items-center gap-2 mb-1"><Calendar className="w-3 h-3" /> Date Taken</span>
            <span className="font-mono text-white block truncate bg-black/30 p-2 rounded border border-zinc-800">
              {image.metadata.dateTimeOriginal || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Geolocation Inputs */}
      <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-800">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-white" />
          Coordinates
        </h2>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-2">LATITUDE</label>
              <input
                type="number"
                step="0.000001"
                value={localLat}
                onChange={(e) => setLocalLat(e.target.value)}
                onBlur={handleManualChange}
                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-lg text-white font-mono text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-2">LONGITUDE</label>
              <input
                type="number"
                step="0.000001"
                value={localLng}
                onChange={(e) => setLocalLng(e.target.value)}
                onBlur={handleManualChange}
                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-lg text-white font-mono text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-2">ALTITUDE (METERS)</label>
            <input
              type="number"
              step="0.1"
              value={localAlt}
              onChange={(e) => setLocalAlt(e.target.value)}
              onBlur={handleManualChange}
              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-lg text-white font-mono text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <div className="pt-6 border-t border-zinc-800 flex flex-col gap-3">
            {!downloadUrl ? (
              <button
                onClick={handleSaveExif}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black font-bold py-3.5 px-4 rounded-lg transition-colors disabled:opacity-50 tracking-tight"
              >
                {isSaving ? 'Processing...' : (
                  <>
                    <Save className="w-4 h-4" />
                    WRITE EXIF TAGS
                  </>
                )}
              </button>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-green-900/30 text-green-400 p-3 rounded-lg text-sm mb-4 border border-green-900/50 text-center font-medium">
                  ✅ Image processed successfully!
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDownloadUrl(null)}
                    className="flex-1 py-3 px-4 rounded-lg border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors text-sm"
                  >
                    Edit More
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-blue-900/20 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    DOWNLOAD
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};