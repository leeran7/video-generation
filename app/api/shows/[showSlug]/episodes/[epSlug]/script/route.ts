import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { episodes } from "@/lib/db/schema";
import { syncScenesFromScript } from "@/lib/episodes/sync-scenes-from-script";
import { getShowAccess } from "@/lib/auth/show-access";
import { toUserFacingError } from "@/lib/ai/error";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ showSlug: string; epSlug: string }> }
) {
  try {
    const { showSlug, epSlug } = await params;

    const access = await getShowAccess(showSlug);
    if (!access) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }
    if (!access.canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let scriptContent: string;
    try {
      const body = (await req.json()) as { scriptContent?: unknown };
      if (typeof body?.scriptContent !== "string") {
        return NextResponse.json(
          { error: "scriptContent must be a string" },
          { status: 400 }
        );
      }
      scriptContent = body.scriptContent;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const [ep] = await db
      .select({ id: episodes.id, slug: episodes.slug })
      .from(episodes)
      .where(and(eq(episodes.showId, access.show.id), eq(episodes.slug, epSlug)))
      .limit(1);
    if (!ep) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    await db
      .update(episodes)
      .set({ scriptContent, updatedAt: sql`now()` })
      .where(eq(episodes.id, ep.id));

    let syncWarning: string | null = null;
    try {
      await syncScenesFromScript({ id: ep.id, slug: ep.slug, scriptContent });
    } catch (err) {
      console.error("[PUT .../script] syncScenesFromScript failed:", err);
      syncWarning = "Scene sync failed — scenes may be out of date.";
    }

    return NextResponse.json({ ok: true, syncWarning });
  } catch (err) {
    console.error("[PUT .../script]", err);
    return NextResponse.json({ error: toUserFacingError(err) }, { status: 500 });
  }
}
