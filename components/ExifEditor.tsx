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

  // Sync local state with parent state when it changes (e.g. from map drag)
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
      // Small delay to allow UI to update
      await new Promise(r => setTimeout(r, 100));
      
      const newJpegBase64 = embedExifData(image.previewUrl, image.metadata, currentGps);
      
      // Convert base64 to Blob for download
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
      alert("Failed to write EXIF data. Please try another image.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      // Handle potential ESM/CJS interop differences with file-saver
      const saveFile = (FileSaver as any).saveAs || FileSaver;
      saveFile(downloadUrl, `geotagged-${image.file.name}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Hash className="w-5 h-5 text-blue-500" />
          Image Metadata
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-slate-500 flex items-center gap-1"><Camera className="w-3 h-3" /> Make/Model</span>
            <span className="font-medium text-slate-800 truncate">
              {image.metadata.make || 'Unknown'} / {image.metadata.model || 'Unknown'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date Taken</span>
            <span className="font-medium text-slate-800">
              {image.metadata.dateTimeOriginal || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-500" />
          Geolocation Data
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={localLat}
                onChange={(e) => setLocalLat(e.target.value)}
                onBlur={handleManualChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={localLng}
                onChange={(e) => setLocalLng(e.target.value)}
                onBlur={handleManualChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Altitude (Meters)</label>
            <input
              type="number"
              step="0.1"
              value={localAlt}
              onChange={(e) => setLocalAlt(e.target.value)}
              onBlur={handleManualChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            {!downloadUrl ? (
              <button
                onClick={handleSaveExif}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
              >
                {isSaving ? 'Processing...' : (
                  <>
                    <Save className="w-4 h-4" />
                    Write EXIF Tags
                  </>
                )}
              </button>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-3 border border-green-200 text-center">
                  ✅ Image processed successfully!
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDownloadUrl(null)}
                    className="flex-1 py-3 px-4 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                  >
                    Edit More
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-[2] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-green-500/30"
                  >
                    <Download className="w-4 h-4" />
                    Download Photo
                  </button>
                </div>
              </div>
            )}
            <p className="text-xs text-center text-slate-400 mt-2">
              All processing happens in your browser. No files are uploaded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};