/* Compress an image File to JPEG at medium-low quality, max 1080px wide */
export function compressImage(file, { maxPx = 1080, quality = 0.55 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/* Compress multiple files, return array of base64 strings */
export async function compressImages(files) {
  const results = [];
  for (const file of files) {
    try {
      results.push(await compressImage(file));
    } catch {
      /* skip unreadable files */
    }
  }
  return results;
}
