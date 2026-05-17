
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
