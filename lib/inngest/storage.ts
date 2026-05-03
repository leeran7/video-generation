import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

export const EPISODE_BUCKET = "episode-videos";

export function getStorageClient(): SupabaseClient {
  return createAdminClient();
}

export async function ensureEpisodeBucket(client: SupabaseClient): Promise<void> {
  const { data, error } = await client.storage.getBucket(EPISODE_BUCKET);
  if (data) return;
  if (error && !/not.?found/i.test(error.message)) throw error;
  const { error: createError } = await client.storage.createBucket(
    EPISODE_BUCKET,
    { public: true }
  );
  if (createError && !/already exists|duplicate/i.test(createError.message)) {
    throw createError;
  }
}

export async function uploadVideo(
  client: SupabaseClient,
  objectPath: string,
  buffer: Buffer
): Promise<string> {
  const { error } = await client.storage
    .from(EPISODE_BUCKET)
    .upload(objectPath, buffer, {
      contentType: "video/mp4",
      upsert: true,
    });
  if (error) throw error;
  const { data } = client.storage.from(EPISODE_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

export async function downloadFromBucket(
  client: SupabaseClient,
  objectPath: string
): Promise<Buffer> {
  const { data, error } = await client.storage
    .from(EPISODE_BUCKET)
    .download(objectPath);
  if (error) throw error;
  if (!data) throw new Error(`No data for ${objectPath}`);
  const arrayBuf = await data.arrayBuffer();
  return Buffer.from(arrayBuf);
}

/**
 * Convert a stored public URL back to its bucket object path.
 * (We store full URLs on rows for convenience; downloads need the path.)
 */
export function publicUrlToObjectPath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${EPISODE_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  // Strip query string (signed URLs append `?token=…`) and any URL fragment.
  return publicUrl.slice(idx + marker.length).split(/[?#]/)[0];
}
