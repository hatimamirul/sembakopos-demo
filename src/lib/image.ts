export const isSafeImage = (src: string | undefined): src is string => !!src && /^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(src);
export async function compressImage(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Pilih foto JPG, PNG, atau WebP. Format HEIC perlu diubah menjadi JPG.');
  if (file.size > 25 * 1024 * 1024) throw new Error('Foto terlalu besar. Pilih foto di bawah 25 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url; await image.decode();
    const scale = Math.min(1, 600 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Browser tidak dapat mengolah foto.');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.78, 0.6, 0.42]) { const data = canvas.toDataURL('image/webp', quality); if (data.length <= 220000) return data; }
    throw new Error('Foto masih terlalu besar setelah diperkecil. Pilih foto yang lebih sederhana.');
  } catch (e) { throw e instanceof Error ? e : new Error('Foto tidak dapat dibaca. Coba foto lain.'); }
  finally { URL.revokeObjectURL(url); }
}
