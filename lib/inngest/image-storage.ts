import { toFile } from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

export const IMAGE_BUCKET = "character-art";

export function getImageStorageClient(): SupabaseClient {
  return createAdminClient();
}

export async function ensureImageBucket(client: SupabaseClient): Promise<void> {
  const { data, error } = await client.storage.getBucket(IMAGE_BUCKET);
  if (data) return;
  if (error && !/not.?found/i.test(error.message)) throw error;
  const { error: createError } = await client.storage.createBucket(
    IMAGE_BUCKET,
    { public: true }
  );
  if (
    createError &&
    !/already exists|duplicate/i.test(createError.message)
  ) {
    throw createError;
  }
}

export async function uploadImage(
  client: SupabaseClient,
  objectPath: string,
  buffer: Buffer
): Promise<string> {
  const { error } = await client.storage
    .from(IMAGE_BUCKET)
    .upload(objectPath, buffer, { contentType: "image/png", upsert: true });
  if (error) throw error;
  const { data } = client.storage
    .from(IMAGE_BUCKET)
    .getPublicUrl(objectPath);
  return data.publicUrl;
}

/**
 * Download public image URLs and return them as OpenAI File objects for use
 * as style references in images.edit calls. Silently skips any URL that fails
 * to download so a missing asset never blocks generation.
 */
export async function loadStyleRefs(
  urls: string[]
): Promise<Awaited<ReturnType<typeof toFile>>[]> {
  const refs: Awaited<ReturnType<typeof toFile>>[] = [];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const filename = url.split("/").pop() ?? "ref.png";
      refs.push(await toFile(buf, filename, { type: "image/png" }));
    } catch {
      // Skip unavailable refs rather than aborting generation.
    }
  }
  return refs;
}
