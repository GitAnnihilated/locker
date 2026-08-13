"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireUser } from "@/core/auth/session";
import { handleActionError } from "@/lib/actionError";
import { getR2Client, R2_BUCKET, R2_PUBLIC_URL } from "./r2";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB — generous for a compressed image or a normal PDF, not for video
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

/**
 * Returns a short-lived presigned PUT URL — the browser uploads the file
 * bytes directly to R2, never through this server, so a large upload
 * doesn't tie up a server function the whole time. Postgres only ever
 * stores the resulting public URL (see any *Url column across the schema:
 * Achievement.certificateUrl, GroupResource.url, ClassResource.url, …) —
 * this is the "real upload storage" those columns were always meant for.
 */
export async function createUploadUrl(
  formData: FormData,
): Promise<{ error: string } | { uploadUrl: string; publicUrl: string }> {
  try {
    const user = await requireUser();

    const fileName = String(formData.get("fileName") ?? "");
    const contentType = String(formData.get("contentType") ?? "");
    const size = Number(formData.get("size") ?? 0);

    if (!fileName) throw new Error("Missing file name");
    if (!ALLOWED_TYPES.has(contentType)) {
      throw new Error("Only images and PDFs can be uploaded here.");
    }
    if (!size || size > MAX_FILE_BYTES) {
      throw new Error(`File is too large — the limit is ${Math.floor(MAX_FILE_BYTES / 1024 / 1024)}MB.`);
    }

    // Scoped under the uploader's own id, with a random suffix so two
    // uploads of "photo.jpg" never collide — never trust the original
    // filename for anything beyond a display hint.
    const ext = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const key = `uploads/${user.id}/${crypto.randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });
    const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 300 });

    return { uploadUrl, publicUrl: `${R2_PUBLIC_URL}/${key}` };
  } catch (e) {
    return handleActionError(e);
  }
}
