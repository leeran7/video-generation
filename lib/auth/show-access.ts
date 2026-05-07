import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { shows } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

export type ShowAccess = {
  show: {
    id: string;
    slug: string;
    title: string;
    creatorId: string | null;
    seriesBible: Record<string, unknown> | null;
  };
  userId: string | null;
  canEdit: boolean;
};

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getShowAccess(
  showSlug: string
): Promise<ShowAccess | null> {
  const [rowResult, userId] = await Promise.all([
    db
      .select({
        id: shows.id,
        slug: shows.slug,
        title: shows.title,
        creatorId: shows.creatorId,
        seriesBible: shows.seriesBible,
      })
      .from(shows)
      .where(eq(shows.slug, showSlug))
      .limit(1),
    getCurrentUserId(),
  ]);
  const row = rowResult[0];
  if (!row) return null;
  const canEdit = !!userId && row.creatorId === userId;
  return { show: row, userId, canEdit };
}
