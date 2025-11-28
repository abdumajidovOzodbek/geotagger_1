import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

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
      className={`group relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 cursor-pointer ${
        isDragging 
          ? 'border-blue-500 bg-blue-500/10' 
          : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900'
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
      <div className="flex flex-col items-center justify-center gap-5">
        <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white'}`}>
          <Upload className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Click or drag image to upload</h3>
          <p className="text-sm text-zinc-500">Supports JPG/JPEG files only</p>
        </div>
        <div className="mt-2">
           <span className="inline-block px-4 py-2 bg-zinc-800 text-zinc-300 rounded-md text-sm font-medium border border-zinc-700 group-hover:border-zinc-600 transition-colors">
             Choose File
           </span>
        </div>
      </div>
    </div>
  );
};