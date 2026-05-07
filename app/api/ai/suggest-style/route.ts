import { NextResponse } from "next/server";
import OpenAI from "openai";

import { toUserFacingError } from "@/lib/ai/error";
import { getCurrentUserId } from "@/lib/auth/show-access";
import { DESIGN_STYLES } from "@/lib/design-styles";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title?: string;
    logline?: string;
    genres?: string[];
    tones?: string[];
    audience?: string;
    settingDescription?: string;
    visualStyle?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 503 });
  }

  const styleList = DESIGN_STYLES.map(
    (s) => `- "${s.id}": ${s.label}`
  ).join("\n");

  const prompt = `You are a visual development consultant for animated series.

A creator is building a show with the following details:
- Title: ${body.title || "Unknown"}
- Logline: ${body.logline || "Not provided"}
- Genres: ${body.genres?.join(", ") || "Not specified"}
- Tones: ${body.tones?.join(", ") || "Not specified"}
- Audience: ${body.audience || "Not specified"}
- Setting: ${body.settingDescription || "Not provided"}
- Visual direction notes: ${body.visualStyle || "None"}

Available art styles:
${styleList}

Based on the show's concept, tone, genre, and audience, recommend the single best art style for generating character design sheets. Consider:
- Genre conventions (e.g. action + teen audience → anime or comic book)
- Tone alignment (dark/gritty → noir or concept art; whimsical → chibi or retro cartoon)
- Production context (animated series or flat vector for clean broadcast look; cyberpunk for dystopian sci-fi)
- Audience expectations

Respond with JSON only:
{
  "styleId": "<one of the style IDs above>",
  "reason": "<one concise sentence explaining why this style fits the show>"
}`;

  try {
    const openai = new OpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(raw) as { styleId?: string; reason?: string };

    const validId = DESIGN_STYLES.find((s) => s.id === result.styleId)?.id;
    if (!validId) {
      return NextResponse.json(
        { error: "AI returned an unrecognized style ID" },
        { status: 500 }
      );
    }

    return NextResponse.json({ styleId: validId, reason: result.reason ?? "" });
  } catch (err) {
    const message = toUserFacingError(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
