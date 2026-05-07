import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { characters } from "@/lib/db/schema";
import { getShowAccess } from "@/lib/auth/show-access";
import { toUserFacingError } from "@/lib/ai/error";

type Patch = {
  name?: string;
  realName?: string | null;
  rosterNumber?: number | null;
  affiliation?: string | null;
  lockStatus?: string;
  data?: Record<string, unknown>;
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ showSlug: string; charSlug: string }> }
) {
  try {
    const { showSlug, charSlug } = await params;

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

    const [row] = await db
      .select({ id: characters.id, data: characters.data })
      .from(characters)
      .where(
        and(eq(characters.showId, access.show.id), eq(characters.slug, charSlug))
      )
      .limit(1);
    if (!row) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const update: Record<string, unknown> = { updatedAt: sql`now()` };

    if (typeof patch.name === "string") {
      if (patch.name.trim().length === 0) {
        return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      }
      update.name = patch.name.trim();
    }
    if (patch.realName !== undefined) {
      update.realName =
        typeof patch.realName === "string" ? patch.realName.trim() || null : null;
    }
    if (patch.rosterNumber !== undefined) {
      if (
        patch.rosterNumber === null ||
        (typeof patch.rosterNumber === "number" &&
          Number.isFinite(patch.rosterNumber))
      ) {
        update.rosterNumber =
          patch.rosterNumber === null ? null : Math.round(patch.rosterNumber);
      } else {
        return NextResponse.json(
          { error: "rosterNumber must be number | null" },
          { status: 400 }
        );
      }
    }
    if (patch.affiliation !== undefined) {
      update.affiliation =
        typeof patch.affiliation === "string"
          ? patch.affiliation.trim() || null
          : null;
    }
    if (typeof patch.lockStatus === "string") {
      update.lockStatus = patch.lockStatus;
    }
    if (patch.data !== undefined) {
      if (
        patch.data === null ||
        typeof patch.data !== "object" ||
        Array.isArray(patch.data)
      ) {
        return NextResponse.json({ error: "data must be an object" }, { status: 400 });
      }
      update.data = { ...(row.data ?? {}), ...patch.data };
    }

    await db.update(characters).set(update).where(eq(characters.id, row.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/shows/[showSlug]/characters/[charSlug]]", err);
    return NextResponse.json({ error: toUserFacingError(err) }, { status: 500 });
  }
}
