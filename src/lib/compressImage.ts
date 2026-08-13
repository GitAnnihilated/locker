/**
 * Client-side resize + re-encode before upload — the actual storage-saving
 * lever for images (a phone photo can be 4-8MB; this typically gets it
 * under 500KB with no visible quality loss for a certificate/achievement
 * photo). Runs in the browser via <canvas>, so the smaller bytes are what
 * actually gets uploaded, not compressed after the fact. PDFs and other
 * non-image files pass through untouched — there's no equivalent easy win
 * for those in the browser.
 */
export async function compressImage(
  file: File,
  { maxDimension = 1600, quality = 0.82 }: { maxDimension?: number; quality?: number } = {},
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file; // animated GIFs would lose their animation if redrawn to canvas
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file; // no canvas support — upload the original rather than fail

  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  if (!blob || blob.size >= file.size) return file; // only use it if it's actually smaller

  const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], newName, { type: "image/webp" });
}
