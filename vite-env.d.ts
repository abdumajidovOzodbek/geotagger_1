declare module '*.css';

declare module 'piexifjs' {
  export const load: (data: string) => any;
  export const dump: (exifObj: any) => string;
  export const insert: (exifStr: string, jpegStr: string) => string;
  export const ImageIFD: any;
  export const ExifIFD: any;
  export const GPSIFD: any;
}

declare module 'file-saver';