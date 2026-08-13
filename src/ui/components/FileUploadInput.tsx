"use client";

import { useState } from "react";
import { Input } from "./Input";
import { createUploadUrl } from "@/core/storage/actions";
import { compressImage } from "@/lib/compressImage";

/**
 * Uploads directly to R2 from the browser (never through our own server —
 * see createUploadUrl) and writes the resulting public URL into a hidden
 * field named `name`, so the parent <form> submits exactly the same
 * *Url string every existing action already expects (Achievement.
 * certificateUrl/photoUrl, GroupResource.url, ClassResource.url, …) —
 * no action-side changes needed to start using this.
 */
export function FileUploadInput({
  name,
  label,
  accept = "image/*,application/pdf",
  defaultValue,
}: {
  name: string;
  label: string;
  accept?: string;
  defaultValue?: string | null;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setPending(true);
    setError(null);
    try {
      const toUpload = await compressImage(file);

      const fd = new FormData();
      fd.set("fileName", toUpload.name);
      fd.set("contentType", toUpload.type);
      fd.set("size", String(toUpload.size));
      const result = await createUploadUrl(fd);
      if ("error" in result) {
        setError(result.error);
        return;
      }

      const putResponse = await fetch(result.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": toUpload.type },
        body: toUpload,
      });
      if (!putResponse.ok) throw new Error("Upload failed — try again.");

      setUrl(result.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed — try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept={accept}
          disabled={pending}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {pending && <span className="text-xs text-subtle">Uploading…</span>}
      </div>
      {url && !pending && (
        <p className="mt-1 truncate text-xs text-success" title={url}>
          ✓ {label} attached
        </p>
      )}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
