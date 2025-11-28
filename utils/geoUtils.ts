import piexif from 'piexifjs';
import { GPSData, ExifMetadata } from '../types';

// Convert Decimal to DMS (Degrees, Minutes, Seconds) for EXIF
export const decimalToDms = (decimal: number): number[][] => {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.round((minutesNotTruncated - minutes) * 60 * 10000); // 4 decimal places precision

  return [[degrees, 1], [minutes, 1], [seconds, 10000]];
};

// Convert DMS to Decimal
export const dmsToDecimal = (dms: number[][], ref: string): number => {
  if (!dms || dms.length < 3) return 0;
  
  const deg = dms[0][0] / dms[0][1];
  const min = dms[1][0] / dms[1][1];
  const sec = dms[2][0] / dms[2][1];
  
  let decimal = deg + min / 60 + sec / 3600;
  
  if (ref === 'S' || ref === 'W') {
    decimal = decimal * -1;
  }
  
  return decimal;
};

export const parseExifData = (base64: string): ExifMetadata => {
  let exifObj;
  try {
    exifObj = piexif.load(base64);
  } catch (e) {
    console.error("Failed to parse EXIF", e);
    return { rawExifObj: {} };
  }

  const result: ExifMetadata = {
    rawExifObj: exifObj,
  };

  // 0th IFD
  const zeroIfd = exifObj['0th'];
  if (zeroIfd) {
    if (zeroIfd[piexif.ImageIFD.Make]) result.make = zeroIfd[piexif.ImageIFD.Make];
    if (zeroIfd[piexif.ImageIFD.Model]) result.model = zeroIfd[piexif.ImageIFD.Model];
  }

  // Exif IFD
  const exifIfd = exifObj['Exif'];
  if (exifIfd) {
    if (exifIfd[piexif.ExifIFD.DateTimeOriginal]) {
      result.dateTimeOriginal = exifIfd[piexif.ExifIFD.DateTimeOriginal];
    }
  }

  // GPS IFD
  const gpsIfd = exifObj['GPS'];
  if (gpsIfd) {
    const lat = gpsIfd[piexif.GPSIFD.GPSLatitude];
    const latRef = gpsIfd[piexif.GPSIFD.GPSLatitudeRef];
    const lng = gpsIfd[piexif.GPSIFD.GPSLongitude];
    const lngRef = gpsIfd[piexif.GPSIFD.GPSLongitudeRef];
    const alt = gpsIfd[piexif.GPSIFD.GPSAltitude];
    const altRef = gpsIfd[piexif.GPSIFD.GPSAltitudeRef] || 0; // 0 = Above sea level

    if (lat && latRef && lng && lngRef) {
      const finalLat = dmsToDecimal(lat, latRef);
      const finalLng = dmsToDecimal(lng, lngRef);
      let finalAlt = 0;
      
      if (alt) {
        finalAlt = alt[0] / alt[1];
        if (altRef === 1) finalAlt = -finalAlt; // Below sea level
      }

      result.gps = {
        lat: finalLat,
        lng: finalLng,
        altitude: finalAlt
      };
    }
  }

  return result;
};

export const embedExifData = (originalBase64: string, metadata: ExifMetadata, newGps: GPSData): string => {
  const exifObj = metadata.rawExifObj || { "0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": null };
  
  if (!exifObj["GPS"]) {
    exifObj["GPS"] = {};
  }

  const latDms = decimalToDms(newGps.lat);
  const lngDms = decimalToDms(newGps.lng);
  const latRef = newGps.lat >= 0 ? 'N' : 'S';
  const lngRef = newGps.lng >= 0 ? 'E' : 'W';

  exifObj["GPS"][piexif.GPSIFD.GPSLatitude] = latDms;
  exifObj["GPS"][piexif.GPSIFD.GPSLatitudeRef] = latRef;
  exifObj["GPS"][piexif.GPSIFD.GPSLongitude] = lngDms;
  exifObj["GPS"][piexif.GPSIFD.GPSLongitudeRef] = lngRef;

  if (newGps.altitude !== undefined) {
    const alt = Math.abs(newGps.altitude);
    const altRef = newGps.altitude < 0 ? 1 : 0;
    // Altitude is Rational, e.g., 1205/10
    const altRational = [Math.round(alt * 100), 100];
    
    exifObj["GPS"][piexif.GPSIFD.GPSAltitude] = altRational;
    exifObj["GPS"][piexif.GPSIFD.GPSAltitudeRef] = altRef;
  }

  // Add a version tag if missing (required for some readers)
  if (!exifObj["GPS"][piexif.GPSIFD.GPSVersionID]) {
    exifObj["GPS"][piexif.GPSIFD.GPSVersionID] = [2, 2, 0, 0];
  }

  const exifBytes = piexif.dump(exifObj);
  // piexif.insert works on JPEG strings
  const newJpeg = piexif.insert(exifBytes, originalBase64);
  return newJpeg;
};
