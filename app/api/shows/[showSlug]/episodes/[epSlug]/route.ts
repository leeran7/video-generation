import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { characters, episodes } from "@/lib/db/schema";
import { getShowAccess } from "@/lib/auth/show-access";

type Patch = {
  title?: string;
  brief?: string | null;
  tags?: string[] | null;
  focusCharacterSlug?: string | null;
  lockStatus?: string;
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ showSlug: string; epSlug: string }> }
) {
  const { showSlug, epSlug } = await params;

  const access = await getShowAccess(showSlug);
  if (!access) {
    return NextResponse.json({ error: "Show not found" }, { status: 404 });
  }
  if (!access.canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let patch: Patch;
  try {
    patch = (await req.json()) as Patch;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const showId = access.show.id;

  const [ep] = await db
    .select({ id: episodes.id })
    .from(episodes)
    .where(and(eq(episodes.showId, showId), eq(episodes.slug, epSlug)))
    .limit(1);
  if (!ep) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = { updatedAt: sql`now()` };

  if (typeof patch.title === "string") {
    if (patch.title.trim().length === 0) {
      return NextResponse.json(
        { error: "title cannot be empty" },
        { status: 400 }
      );
    }
    update.title = patch.title.trim();
  }
  if (patch.brief !== undefined) {
    update.brief =
      typeof patch.brief === "string" ? patch.brief.trim() || null : null;
  }
  if (patch.tags !== undefined) {
    if (patch.tags === null) {
      update.tags = null;
    } else if (
      Array.isArray(patch.tags) &&
      patch.tags.every((t) => typeof t === "string")
    ) {
      update.tags = patch.tags.map((t) => t.trim()).filter(Boolean);
    } else {
      return NextResponse.json(
        { error: "tags must be string[] | null" },
        { status: 400 }
      );
    }
  }
  if (patch.focusCharacterSlug !== undefined) {
    if (patch.focusCharacterSlug === null || patch.focusCharacterSlug === "") {
      update.focusCharacterId = null;
    } else {
      const [ch] = await db
        .select({ id: characters.id })
        .from(characters)
        .where(
          and(
            eq(characters.showId, showId),
            eq(characters.slug, patch.focusCharacterSlug)
          )
        )
        .limit(1);
      if (!ch) {
        return NextResponse.json(
          { error: "focusCharacterSlug not found" },
          { status: 400 }
        );
      }
      update.focusCharacterId = ch.id;
    }
  }
  if (typeof patch.lockStatus === "string") {
    update.lockStatus = patch.lockStatus;
  }

  await db.update(episodes).set(update).where(eq(episodes.id, ep.id));

  return NextResponse.json({ ok: true });
}
