"use server";

import { requireUser } from "@/core/auth/session";
import { handleActionError } from "@/lib/actionError";
import { getSupabaseServiceClient, STORAGE_BUCKET } from "./supabase";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB — generous for a compressed image or a normal PDF, not for video
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

/**
 * Returns a short-lived signed upload URL/token — the browser uploads the
 * file bytes directly to Supabase Storage (see FileUploadInput.tsx's
 * uploadToSignedUrl call), never through this server, so a large upload
 * doesn't tie up a server function the whole time. Postgres only ever
 * stores the resulting public URL (see any *Url column across the schema:
 * Achievement.certificateUrl, GroupResource.url, ClassResource.url, …) —
 * this is the "real upload storage" those columns were always meant for.
 */
export async function createUploadUrl(
  formData: FormData,
): Promise<{ error: string } | { bucket: string; path: string; token: string; publicUrl: string }> {
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
    const path = `uploads/${user.id}/${crypto.randomUUID()}.${ext}`;

    const client = getSupabaseServiceClient();
    const { data, error } = await client.storage.from(STORAGE_BUCKET).createSignedUploadUrl(path);
    if (error) throw new Error(error.message);

    const { data: publicData } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);

    return { bucket: STORAGE_BUCKET, path, token: data.token, publicUrl: publicData.publicUrl };
  } catch (e) {
    return handleActionError(e);
  }
}
