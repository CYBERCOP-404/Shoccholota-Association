export interface PhotoTransform {
  x: number; // percentage or px offset
  y: number;
  scale: number; // 0.2 to 3.0
  rotation: number; // 0 to 360 deg
  flipX: boolean;
  flipY: boolean;
  layerOrder?: 'top' | 'bottom'; // Whether photo is drawn on top or behind frame overlay
}

export interface PhotoFilter {
  brightness: number; // 50 to 150 %
  contrast: number; // 50 to 150 %
  saturation: number; // 0 to 200 %
  sepia: number; // 0 to 100 %
  grayscale: number; // 0 to 100 %
}

export interface FramePreset {
  id: string;
  nameBn: string;
  nameEn: string;
  descriptionBn: string;
  descriptionEn: string;
  category: 'celebration' | 'badge' | 'modern' | 'custom';
  svgContent: string; // inline SVG string or data URL
  aspectRatio: '1:1' | '4:5' | '9:16';
  thumbnailUrl?: string;
  isCustom?: boolean;
}

export type Language = 'bn' | 'en';
