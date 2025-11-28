export interface GPSData {
  lat: number;
  lng: number;
  altitude?: number;
}

export interface ExifMetadata {
  make?: string;
  model?: string;
  dateTimeOriginal?: string;
  gps?: GPSData;
  rawExifObj?: any; // Keeps the piexifjs object structure
}

export interface UploadedImage {
  file: File;
  previewUrl: string; // Base64 for preview and manipulation
  metadata: ExifMetadata;
}
