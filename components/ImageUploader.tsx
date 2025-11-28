import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      validateAndPass(event.target.files[0]);
    }
  };

  const validateAndPass = (file: File) => {
    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      onImageSelected(file);
    } else {
      alert("Please upload a valid JPG/JPEG image.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPass(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/jpg"
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="bg-slate-100 p-4 rounded-full">
          <Upload className="w-8 h-8 text-slate-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-700">Click or drag image to upload</h3>
          <p className="text-sm text-slate-500 mt-1">Supports JPG/JPEG files only</p>
        </div>
      </div>
    </div>
  );
};
