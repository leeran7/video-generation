import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { shows } from "@/lib/db/schema";
import { getCurrentUserId } from "@/lib/auth/show-access";
import { toUserFacingError } from "@/lib/ai/error";

export async function GET(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug")?.trim() ?? "";

    if (!slug) {
      return NextResponse.json({ available: false, error: "No slug provided" }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: shows.id })
      .from(shows)
      .where(eq(shows.slug, slug))
      .limit(1);

    return NextResponse.json({ available: !existing });
  } catch (err) {
    console.error("[GET /api/shows/check-slug]", err);
    return NextResponse.json({ error: toUserFacingError(err) }, { status: 500 });
  }
}
