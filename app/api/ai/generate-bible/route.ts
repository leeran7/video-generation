import { NextResponse } from "next/server";
import { OpenAIClient } from "@/lib/ai/openai";
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

  const { title, logline, genres, tones, settingDescription } =
    (await req.json()) as {
      title: string;
      logline: string;
      genres: string[];
      tones: string[];
      settingDescription: string;
    };

  try {
    const ai = new OpenAIClient();
    const result = await ai.jsonChat([
      {
        role: "system",
        content:
          "You are a creative showrunner writing a series bible. Be specific and evocative — avoid generic descriptions. Return only valid JSON.",
      },
      {
        role: "user",
        content: `Write a series bible for "${title}", a ${genres.join(" / ")} show.

Premise: ${logline}
Tone: ${tones.join(", ")}
Setting: ${settingDescription}

Return JSON with exactly these keys:
- worldRules: How this world works — its physics, rules, and internal logic. What distinguishes it from the real world. What audiences need to accept to enjoy the show. (150–200 words)
- visualStyle: Art direction, color palette, cinematography approach, lighting mood, costume and production design sensibility. (80–100 words)
- thematicFocus: The show's real subject matter beneath the genre surface. Core questions it asks. What it's ultimately about for the characters and the audience. (80–100 words)`,
      },
    ]);
    return NextResponse.json(result);
  } catch (err) {
    const message = toUserFacingError(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
