import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat";

type ImagesResponse = { data?: Array<{ b64_json?: string }> };
type ImageSize = "1024x1024" | "1536x1024" | "1024x1536";
type ImageOpts = { size?: ImageSize; quality?: "standard" | "high" };

export class OpenAIClient {
  private _client: OpenAI | null = null;

  private get client(): OpenAI {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    return (this._client ??= new OpenAI());
  }

  /** Chat completion that enforces JSON output and parses the result. */
  async jsonChat<T = Record<string, unknown>>(
    messages: ChatCompletionMessageParam[],
    opts: { temperature?: number; max_tokens?: number } = {}
  ): Promise<T> {
    const completion = await this.client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages,
      ...opts,
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("AI returned no content");
    return JSON.parse(raw) as T;
  }

  /** Generate an image from a text prompt; returns base64 PNG string. */
  async generateImage(prompt: string, opts: ImageOpts = {}): Promise<string> {
    const result = (await this.client.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: opts.size ?? "1536x1024",
      quality: opts.quality ?? "high",
    } as Parameters<OpenAI["images"]["generate"]>[0])) as ImagesResponse;
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI returned no image data");
    return b64;
  }

  /** Edit an image using style reference files; returns base64 PNG string. */
  async editImage(
    prompt: string,
    images: File | File[],
    opts: ImageOpts = {}
  ): Promise<string> {
    const result = (await this.client.images.edit({
      model: "gpt-image-1",
      image: images,
      prompt,
      n: 1,
      size: opts.size ?? "1536x1024",
      quality: opts.quality ?? "high",
    } as Parameters<OpenAI["images"]["edit"]>[0])) as ImagesResponse;
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI returned no image data");
    return b64;
  }
}
