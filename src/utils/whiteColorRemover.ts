/**
 * Utility to scan an image and convert white/near-white pixels to transparent alpha cutout.
 * This turns any white area in a frame background into a transparent window where
 * the user's photo shows through.
 */
export function removeWhiteColorFromImage(imageSrc: string, threshold = 235): Promise<string> {
  return new Promise((resolve) => {
    if (!imageSrc) {
      resolve(imageSrc);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 1000;
        canvas.height = img.naturalHeight || img.height || 1000;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Loop through RGBA pixels
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Check if pixel is white or near-white
          if (r >= threshold && g >= threshold && b >= threshold) {
            data[i + 3] = 0; // Make Alpha channel 0 (Fully Transparent Cutout)
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Error removing white background color:', err);
        resolve(imageSrc);
      }
    };

    img.onerror = () => {
      resolve(imageSrc);
    };

    img.src = imageSrc;
  });
}
