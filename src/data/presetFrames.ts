import { FramePreset } from '../types';

/**
 * Clean neutral frame overlay with transparent photo area (No specific artwork design)
 */
export const MAIN_EVENT_FRAME_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="100%" height="100%">
  <!-- Clean Transparent Frame Overlay with subtle border framing guide -->
  <rect x="0" y="0" width="1000" height="1000" fill="none" stroke="#38bdf8" stroke-width="8" opacity="0.3" rx="24" />
</svg>`;

export const PRESET_FRAMES: FramePreset[] = [
  {
    id: 'clean-frame',
    nameBn: 'ক্লিন ফ্রেম',
    nameEn: 'Clean Neutral Frame',
    descriptionBn: 'কোনো আর্টওয়ার্ক ছাড়া সাধারণ ফটো ফ্রেম ক্যানভাস',
    descriptionEn: 'Clean photo frame canvas without pre-rendered artwork',
    category: 'custom',
    svgContent: MAIN_EVENT_FRAME_SVG,
    aspectRatio: '1:1',
  }
];
