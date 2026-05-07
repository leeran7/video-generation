import { NextResponse } from "next/server";
import OpenAI from "openai";

import { toUserFacingError } from "@/lib/ai/error";
import { getCurrentUserId } from "@/lib/auth/show-access";
import { GENRES, TONES } from "@/app/shows/new/wizard/types";

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

  const genreList = GENRES.join(", ");
  const toneList = TONES.join(", ");
  const hint = body.hint?.trim();

  const prompt = `You are a creative director for animated series.

${hint ? `The creator has a partial idea: "${hint}".\n` : "The creator has no idea yet — invent something original.\n"}
Generate a compelling animated series concept. The show should have a distinctive premise that would work as short-form episodes (under 3 minutes each).

Available genres: ${genreList}
Available tones: ${toneList}

Respond with JSON only:
{
  "title": "<punchy show title, 1-4 words>",
  "logline": "<1-2 sentences: who is the protagonist, what do they want, what stands in their way>",
  "genres": ["<genre1>", "<genre2>"],
  "tones": ["<tone1>", "<tone2>", "<tone3>"]
}

Rules:
- genres must be 1-3 items from the available genres list exactly
- tones must be 2-4 items from the available tones list exactly
- logline must be specific and compelling, not generic
- title must not include words like "Chronicles", "Legacy", "Rising", "Origins"`;

  try {
    const openai = new OpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      temperature: 0.95,
      max_tokens: 300,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(raw) as {
      title?: string;
      logline?: string;
      genres?: string[];
      tones?: string[];
    };

    const validGenres = (result.genres ?? []).filter((g) => GENRES.includes(g));
    const validTones = (result.tones ?? []).filter((t) => TONES.includes(t));

    return NextResponse.json({
      title: result.title ?? "",
      logline: result.logline ?? "",
      genres: validGenres,
      tones: validTones,
    });
  } catch (err) {
    const message = toUserFacingError(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
