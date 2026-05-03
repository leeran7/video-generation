import RunwayML, {
  APIError,
  AuthenticationError,
  PermissionDeniedError,
  RateLimitError,
  TaskFailedError,
} from "@runwayml/sdk";
import type { TaskRetrieveResponse } from "@runwayml/sdk/resources/tasks";

import type { GenerationBlock } from "./types";

export type RunwayRatio = "1280:720" | "720:1280";

export type GenerateSceneInput = {
  promptText: string;
  imageRef?: string;
  ratio?: RunwayRatio;
  /** 2–10 seconds, clamped to that range. */
  duration?: number;
  seed?: number;
  /** Runway model id. Defaults to "gen4.5". */
  model?: string;
  /** Wait timeout in ms. Defaults to 10 minutes. */
  timeoutMs?: number;
};

export type GenerateSceneResult = {
  videoUrl: string;
  task: TaskRetrieveResponse.Succeeded;
};

export class RunwaySceneError extends Error {
  constructor(
    message: string,
    public readonly failureCode?: string
  ) {
    super(message);
    this.name = "RunwaySceneError";
  }
}

export function toRunwayRatio(aspectRatio: string | undefined): RunwayRatio {
  if (!aspectRatio) return "1280:720";
  const portrait = ["9:16", "720:1280", "portrait"];
  if (portrait.includes(aspectRatio.toLowerCase())) return "720:1280";
  return "1280:720";
}

export function clampDuration(target: number | undefined): number {
  if (!target) return 10;
  return Math.max(2, Math.min(10, Math.round(target)));
}

/**
 * Build a {@link GenerateSceneInput} from a manifest scene's generation block.
 * Falls back to sane defaults; caller is expected to supply a sensible promptText fallback.
 */
export function generationBlockToInput(
  gen: GenerationBlock | undefined,
  fallbackPrompt: string
): GenerateSceneInput {
  return {
    promptText: gen?.prompt ?? gen?.promptSummary ?? fallbackPrompt,
    imageRef: gen?.imageRef,
    ratio: toRunwayRatio(gen?.aspectRatio),
    duration: clampDuration(gen?.targetDurationSeconds),
    seed: gen?.seed,
    model: gen?.model ?? "gen4.5",
  };
}

/**
 * Run a single Runway generation (text-to-video or image-to-video) and wait for completion.
 * Caller is responsible for downloading the resulting video URL.
 */
export async function generateScene(
  input: GenerateSceneInput,
  client: RunwayML
): Promise<GenerateSceneResult> {
  const ratio = input.ratio ?? "1280:720";
  const duration = clampDuration(input.duration);
  const model = input.model ?? "gen4.5";
  const timeout = input.timeoutMs ?? 10 * 60 * 1000;

  try {
    let task: TaskRetrieveResponse.Succeeded;
    if (input.imageRef) {
      const imgModel: "gen4.5" | "gen4_turbo" =
        model === "gen4_turbo" ? "gen4_turbo" : "gen4.5";
      task = await client.imageToVideo
        .create({
          model: imgModel,
          promptImage: input.imageRef,
          promptText: input.promptText,
          ratio,
          duration,
          ...(input.seed != null && { seed: input.seed }),
        })
        .waitForTaskOutput({ timeout });
    } else {
      // textToVideo's gen4 overload only accepts "gen4.5"; veo models use a
      // separate signature. Stick to gen4.5 here.
      task = await client.textToVideo
        .create({
          model: "gen4.5",
          promptText: input.promptText,
          ratio,
          duration,
          ...(input.seed != null && { seed: input.seed }),
        })
        .waitForTaskOutput({ timeout });
    }

    const videoUrl = task.output[0];
    if (!videoUrl) {
      throw new RunwaySceneError("Task succeeded but returned no output URL");
    }

    return { videoUrl, task };
  } catch (err) {
    throw translateRunwayError(err);
  }
}

/**
 * Convert a raw SDK error into a `RunwaySceneError` with a human-readable
 * message. Surfaces credits/auth/rate-limit issues as named failure codes so
 * the UI can show a targeted message and CTA.
 */
function translateRunwayError(err: unknown): RunwaySceneError {
  if (err instanceof RunwaySceneError) return err;

  if (err instanceof TaskFailedError) {
    const details = err.taskDetails as { failure?: string; failureCode?: string };
    return new RunwaySceneError(
      details.failure ?? "Runway generation failed",
      details.failureCode
    );
  }

  if (err instanceof APIError) {
    const body = (err as APIError & { error?: { error?: string } }).error;
    const apiMessage = body?.error ?? err.message ?? "Runway API error";

    if (
      err instanceof AuthenticationError ||
      err instanceof PermissionDeniedError
    ) {
      return new RunwaySceneError(
        "Runway rejected the API key (authentication failed).",
        "auth_failed"
      );
    }

    if (err instanceof RateLimitError) {
      return new RunwaySceneError(
        "Runway rate limit hit — try again in a minute.",
        "rate_limited"
      );
    }

    if (/credit/i.test(apiMessage)) {
      return new RunwaySceneError(
        "Runway account has no credits left. Top up at https://app.runwayml.com/billing and retry.",
        "insufficient_credits"
      );
    }

    return new RunwaySceneError(`Runway: ${apiMessage}`, `http_${err.status}`);
  }

  return new RunwaySceneError(
    (err as Error)?.message ?? "Unknown Runway error"
  );
}

/**
 * Download a remote URL into a Buffer. Caller decides where to persist it.
 */
export async function downloadVideo(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}
