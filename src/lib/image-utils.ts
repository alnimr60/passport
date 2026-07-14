
/**
 * Scales an image to ensure it fits within Firestore's 1MB limit 
 * while maintaining quality.
 */
export function resizeImage(base64Str: string, maxWidth = 1000, maxHeight = 1000): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions maintain aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // If it's a stamp/badge, we prefer PNG to keep transparency
      // Otherwise JPEG is more efficient
      const isTransparent = base64Str.startsWith('data:image/png');
      resolve(canvas.toDataURL(isTransparent ? 'image/png' : 'image/jpeg', 0.8));
    };
  });
}

/**
 * Specifically designed for stamps/badges. Removes white/light backgrounds 
 * by sampling corners and white levels, applying transparency with smooth feathering.
 */
export function removeBackgroundAndResize(
  base64Str: string,
  maxWidth = 400,
  maxHeight = 400
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Sample corner pixels to estimate background
        const corners = [
          { r: data[0], g: data[1], b: data[2], a: data[3] }, // top-left
          { r: data[(width - 1) * 4], g: data[((width - 1) * 4) + 1], b: data[((width - 1) * 4) + 2], a: data[((width - 1) * 4) + 3] }, // top-right
          { r: data[(height - 1) * width * 4], g: data[((height - 1) * width * 4) + 1], b: data[((height - 1) * width * 4) + 2], a: data[((height - 1) * width * 4) + 3] }, // bottom-left
          { r: data[((height * width) - 1) * 4], g: data[(((height * width) - 1) * 4) + 1], b: data[(((height * width) - 1) * 4) + 2], a: data[(((height * width) - 1) * 4) + 3] } // bottom-right
        ];

        // Average non-transparent corners to get background color
        let avgR = 0, avgG = 0, avgB = 0, validCorners = 0;
        for (const c of corners) {
          if (c.a > 50) {
            avgR += c.r;
            avgG += c.g;
            avgB += c.b;
            validCorners++;
          }
        }

        if (validCorners > 0) {
          avgR /= validCorners;
          avgG /= validCorners;
          avgB /= validCorners;
        } else {
          avgR = 255;
          avgG = 255;
          avgB = 255;
        }

        // Calculate background luminance
        const bgLuminance = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;

        // Process every pixel
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a === 0) continue;

          // Distance to the sampled corner background
          const distToBg = Math.sqrt(
            Math.pow(r - avgR, 2) +
            Math.pow(g - avgG, 2) +
            Math.pow(b - avgB, 2)
          );

          // Distance to absolute white
          const distToWhite = Math.sqrt(
            Math.pow(r - 255, 2) +
            Math.pow(g - 255, 2) +
            Math.pow(b - 255, 2)
          );

          // Thresholds
          const isLightBg = bgLuminance > 100;
          const threshold = isLightBg ? 70 : 45;

          if ((isLightBg && distToBg < threshold) || distToWhite < 70) {
            const minMatchedDist = Math.min(distToBg, distToWhite);
            if (minMatchedDist < threshold - 15) {
              data[i + 3] = 0; // Make fully transparent
            } else {
              // Smooth feathering edge
              const ratio = (minMatchedDist - (threshold - 15)) / 15;
              data[i + 3] = Math.floor(a * ratio);
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
      } catch (err) {
        console.error("Error removing background from stamp:", err);
      }

      // Stamps are always PNG to preserve transparency
      resolve(canvas.toDataURL('image/png', 0.95));
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

