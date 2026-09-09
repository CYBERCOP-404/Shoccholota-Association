import { PhotoFilter, PhotoTransform } from '../types';

export interface RenderOptions {
  userImageSrc: string;
  svgFrameContent: string;
  transform: PhotoTransform;
  filter: PhotoFilter;
  canvasWidth?: number;
  canvasHeight?: number;
}

/**
 * Renders the photo and frame overlay on a high-resolution 2400x2400 Ultra HD canvas with quality enhancement.
 */
export async function generateFramedImageCanvas({
  userImageSrc,
  svgFrameContent,
  transform,
  filter,
  canvasWidth = 2400, // Auto upgraded to 2400x2400 Ultra-HD resolution
  canvasHeight = 2400,
}: RenderOptions): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Enable high quality image smoothing and sharpening
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Load User Image
  const userImg = await loadImage(userImageSrc);

  // 2. Load Frame Image / SVG Overlay
  let frameImg: HTMLImageElement;
  let tempUrl: string | null = null;

  if (svgFrameContent.trim().startsWith('<svg')) {
    const blob = new Blob([svgFrameContent], { type: 'image/svg+xml;charset=utf-8' });
    tempUrl = URL.createObjectURL(blob);
    frameImg = await loadImage(tempUrl);
  } else {
    frameImg = await loadImage(svgFrameContent);
  }

  // Clear Canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  ctx.save();

  // Create bounding clip box (Overflow Hidden)
  ctx.beginPath();
  ctx.rect(0, 0, canvasWidth, canvasHeight);
  ctx.clip();

  const isPhotoOnTop = transform.layerOrder === 'top';

  const drawFrame = () => {
    ctx.save();
    ctx.filter = 'none';
    ctx.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  };

  const drawUserPhoto = () => {
    ctx.save();
    const filterStr = `brightness(${filter.brightness}%) contrast(${filter.contrast}%) saturate(${filter.saturation}%) sepia(${filter.sepia}%) grayscale(${filter.grayscale}%)`;
    ctx.filter = filterStr;

    // Move origin to center of canvas
    ctx.translate(canvasWidth / 2 + (transform.x * canvasWidth) / 100, canvasHeight / 2 + (transform.y * canvasHeight) / 100);

    // Rotation
    ctx.rotate((transform.rotation * Math.PI) / 180);

    // Scale & Flip
    const scaleX = transform.flipX ? -transform.scale : transform.scale;
    const scaleY = transform.flipY ? -transform.scale : transform.scale;
    ctx.scale(scaleX, scaleY);

    // Draw photo centered
    const aspect = userImg.width / userImg.height;
    let drawW = canvasWidth;
    let drawH = canvasWidth / aspect;

    if (drawH < canvasHeight) {
      drawH = canvasHeight;
      drawW = canvasHeight * aspect;
    }

    ctx.drawImage(userImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  };

  if (isPhotoOnTop) {
    // Frame background first, then User Photo on top
    drawFrame();
    drawUserPhoto();
  } else {
    // User Photo first, then Frame Overlay on top
    drawUserPhoto();
    drawFrame();
  }

  ctx.restore();

  // Clean up temp object URL if created
  if (tempUrl) {
    URL.revokeObjectURL(tempUrl);
  }

  return canvas;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

export async function downloadFramedImage(
  options: RenderOptions,
  filename = 'Shoccholota.png',
  mimeType = 'image/png'
) {
  const canvas = await generateFramedImageCanvas(options);
  const dataUrl = canvas.toDataURL(mimeType, 1.0); // 100% Ultra HD Lossless PNG Quality

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
