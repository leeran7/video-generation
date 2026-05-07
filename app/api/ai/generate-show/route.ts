import { NextResponse } from "next/server";
import OpenAI from "openai";

import { toUserFacingError } from "@/lib/ai/error";
import { getCurrentUserId } from "@/lib/auth/show-access";
import { GENRES, TONES, PLATFORMS } from "@/app/shows/new/wizard/types";
import { DESIGN_STYLES } from "@/lib/design-styles";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { hint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 503 });
  }

  const styleList = DESIGN_STYLES.map((s) => `"${s.id}"`).join(", ");
  const hint = body.hint?.trim();

  const prompt = `You are a creative director building a complete animated series concept for a short-form platform (episodes under 3 minutes).

${hint ? `The creator's idea: "${hint}"` : "Invent a completely original show concept."}

Generate a full show concept. Respond with JSON only matching this exact shape:

{
  "title": "Show title (1–4 punchy words)",
  "logline": "1–2 sentences: protagonist, want, obstacle",
  "genres": ["genre1", "genre2"],
  "tones": ["tone1", "tone2", "tone3"],
  "videoScope": "series",
  "episodeSeconds": 90,
  "totalEpisodes": 12,
  "platform": "YouTube",
  "settingDescription": "2–3 sentences describing the world/setting",
  "worldRules": "3–5 sentences: the rules, logic, and physics of this world",
  "visualStyle": "2–3 sentences on art direction, color palette, lighting",
  "thematicFocus": "2–3 sentences on the deeper themes and questions",
  "designStyleId": "one-of-the-style-ids",
  "castCount": 5,
  "characters": [
    {
      "name": "Full Name",
      "codename": "Alias",
      "type": "hero",
      "role": "role in story",
      "ability": "power or defining trait",
      "brief": "1–2 sentences on who they are, what they want, what they fear"
    }
  ]
}

Constraints:
- genres: 1–3 items from: ${GENRES.join(", ")}
- tones: 2–4 items from: ${TONES.join(", ")}
- platform: one of: ${PLATFORMS.join(", ")}
- designStyleId: one of: ${styleList}
- videoScope: "single" for a standalone video, "series" for multiple episodes
- episodeSeconds: between 30 and 180 (pick what fits the concept)
- totalEpisodes: 4–48, only relevant when videoScope is "series"
- characters: exactly castCount entries; include a mix of heroes, at least one antagonist, supporting as needed
- type field on each character must be exactly "hero", "antagonist", or "supporting"
- Do NOT include an "id" field on characters`;

  try {
    const openai = new OpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(raw) as Record<string, unknown>;

    // Validate and sanitize
    const validGenres = ((result.genres as string[]) ?? []).filter((g) => GENRES.includes(g));
    const validTones = ((result.tones as string[]) ?? []).filter((t) => TONES.includes(t));
    const validPlatform = PLATFORMS.includes(result.platform as string)
      ? (result.platform as string)
      : "YouTube";
    const validStyleId = DESIGN_STYLES.find((s) => s.id === result.designStyleId)?.id ?? "animated-series";
    const episodeSeconds = Math.max(30, Math.min(180, Number(result.episodeSeconds) || 90));
    const castCount = Math.max(2, Math.min(8, Number(result.castCount) || 5));

    const characters = ((result.characters as Record<string, unknown>[]) ?? [])
      .slice(0, castCount)
      .map((c) => ({
        name: String(c.name ?? ""),
        codename: String(c.codename ?? ""),
        type: (["hero", "antagonist", "supporting"].includes(c.type as string)
          ? c.type
          : "hero") as "hero" | "antagonist" | "supporting",
        role: String(c.role ?? ""),
        ability: String(c.ability ?? ""),
        brief: String(c.brief ?? ""),
      }));

    const videoScope = result.videoScope === "single" ? "single" : "series";

    return NextResponse.json({
      title: String(result.title ?? ""),
      logline: String(result.logline ?? ""),
      genres: validGenres,
      tones: validTones,
      videoScope,
      episodeSeconds,
      totalEpisodes: Math.max(4, Math.min(48, Number(result.totalEpisodes) || 12)),
      platform: validPlatform,
      settingDescription: String(result.settingDescription ?? ""),
      worldRules: String(result.worldRules ?? ""),
      visualStyle: String(result.visualStyle ?? ""),
      thematicFocus: String(result.thematicFocus ?? ""),
      designStyleId: validStyleId,
      castCount,
      characters,
    });
  } catch (err) {
    const message = toUserFacingError(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
