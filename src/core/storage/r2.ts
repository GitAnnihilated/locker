import { S3Client } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 — S3-compatible object storage for actual file bytes.
 * Postgres (Supabase) only ever stores a URL string pointing here; see
 * core/storage/actions.ts. Chosen over Supabase's own Storage bucket for
 * two reasons that matter as the school grows: a 10GB free tier instead
 * of ~1GB, and zero egress fees — a certificate photo or resource file
 * gets *viewed* far more often than it's uploaded, and R2 doesn't charge
 * for that repeated read traffic the way most object storage does.
 *
 * Reuse a single client across hot-reloads in dev / serverless invocations
 * in prod, same pattern as core/db/client.ts.
 */
const globalForR2 = globalThis as unknown as { r2Client?: S3Client };

/**
 * Built lazily (only when an upload is actually attempted), not at module
 * load — this file is imported by a client component's server action
 * reference, so eagerly throwing here on missing env vars would break the
 * build/every page render, not just the upload feature, before R2 is
 * even configured.
 */
export function getR2Client(): S3Client {
  if (globalForR2.r2Client) return globalForR2.r2Client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "File uploads aren't set up yet — an admin needs to add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL (see .env.example).",
    );
  }
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  if (process.env.NODE_ENV !== "production") globalForR2.r2Client = client;
  return client;
}

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "";
/** Public base URL for reading an uploaded object back (R2 public bucket domain, or a custom domain in front of it). */
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";
