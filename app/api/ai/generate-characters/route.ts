import { NextResponse } from "next/server";
import OpenAI from "openai";

import { toUserFacingError } from "@/lib/ai/error";
import { getCurrentUserId } from "@/lib/auth/show-access";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured on this server." },
      { status: 503 }
    );
  }

  const { title, logline, genres, worldRules, visualStyle, count } =
    (await req.json()) as {
      title: string;
      logline: string;
      genres: string[];
      worldRules: string;
      visualStyle: string;
      count: number;
    };

  try {
  const openai = new OpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a character designer for TV shows. Create distinct, memorable characters with clear dramatic function. Avoid archetypes — give each character a specific contradiction or wound. Return only valid JSON.",
      },
      {
        role: "user",
        content: `Design ${count} main characters for "${title}", a ${genres.join(" / ")} show.

Premise: ${logline}
World rules: ${worldRules}
Visual style: ${visualStyle}

Requirements:
- Include a mix of heroes, at least one antagonist, and supporting characters
- Each character should have a clear dramatic role AND a personal contradiction
- Names and codenames should fit the genre and world
- Abilities/traits should connect to the themes of the show

Return JSON: { "characters": [ { "name": string, "codename": string, "type": "hero" | "antagonist" | "supporting", "role": string (e.g. "reluctant leader", "wild card", "ideological foil"), "ability": string (power, skill, or defining trait), "brief": string (2–3 sentences: who they are, what they want, what they're afraid of) } ] }`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return NextResponse.json({ error: "No response from AI" }, { status: 500 });
  }

    try {
      return NextResponse.json(JSON.parse(content));
    } catch {
      return NextResponse.json({ error: "AI returned malformed JSON" }, { status: 500 });
    }
  } catch (err) {
    const message = toUserFacingError(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
