import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { characters, shows } from "@/lib/db/schema";
import { getCurrentUserId } from "@/lib/auth/show-access";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type DraftCharacter = {
  name: string;
  codename: string;
  type: "hero" | "antagonist" | "supporting";
  role: string;
  ability: string;
  brief: string;
};

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: {
      title: string;
      logline: string;
      genres: string[];
      tones: string[];
      audience: string;
      episodeMinutes: number;
      episodesPerArc: number;
      arcsPerSeason: number;
      contentRating: string;
      platform: string;
      settingDescription: string;
      worldRules: string;
      visualStyle: string;
      thematicFocus: string;
      designStyleId: string;
      draftCharacters: DraftCharacter[];
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Generate a unique slug
    const baseSlug = slugify(body.title) || "show";
    let slug = baseSlug;
    for (let i = 1; ; i++) {
      const [existing] = await db
        .select({ id: shows.id })
        .from(shows)
        .where(eq(shows.slug, slug))
        .limit(1);
      if (!existing) break;
      slug = `${baseSlug}-${i}`;
    }

    const [show] = await db
      .insert(shows)
      .values({
        title: body.title.trim(),
        slug,
        creatorId: userId,
        format: {
          episodeMinutes: body.episodeMinutes,
          episodesPerArc: body.episodesPerArc,
          arcsPerSeason: body.arcsPerSeason,
          contentRating: body.contentRating,
          platform: body.platform,
        },
        seriesBible: {
          premise: body.logline,
          genres: body.genres,
          tones: body.tones,
          audience: body.audience,
          settingDescription: body.settingDescription,
          worldRules: body.worldRules,
          visualStyle: body.visualStyle,
          thematicFocus: body.thematicFocus,
          designStyleId: body.designStyleId,
        },
      })
      .returning({ id: shows.id, slug: shows.slug });

    if (!show) {
      return NextResponse.json(
        { error: "Show insert returned no rows — database may be unavailable." },
        { status: 500 }
      );
    }

    if (body.draftCharacters?.length > 0) {
      let heroIndex = 0;
      const charValues = body.draftCharacters.map((c) => {
        const isHero = c.type === "hero";
        const rosterNum = isHero ? ++heroIndex : null;
        const charSlug =
          slugify(c.codename || c.name) || `character-${heroIndex}`;
        return {
          showId: show.id,
          name: c.name || c.codename,
          slug: charSlug,
          rosterNumber: rosterNum,
          type: c.type,
          lockStatus: "draft",
          data: {
            show: body.title.trim(),
            season: 1,
            rosterNumber: rosterNum,
            codename: (c.codename || c.name).toUpperCase(),
            name: c.name,
            type: c.type,
            role: c.role,
            ability: c.ability,
            brief: c.brief,
            traits: [],
            seasonOneArc: [],
          } as Record<string, unknown>,
        };
      });
      await db.insert(characters).values(charValues);
    }

    return NextResponse.json({ showSlug: show.slug });
  } catch (err) {
    console.error("[POST /api/shows]", err);
    const { toUserFacingError } = await import("@/lib/ai/error");
    return NextResponse.json({ error: toUserFacingError(err) }, { status: 500 });
  }
}
