import RunwayML, { TaskFailedError } from "@runwayml/sdk";
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
      task = await client.imageToVideo
        .create({
          model: "gen4.5",
          promptImage: input.imageRef,
          promptText: input.promptText,
          ratio,
          duration,
          ...(input.seed != null && { seed: input.seed }),
        })
        .waitForTaskOutput({ timeout });
    } else {
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

    void model;
    return { videoUrl, task };
  } catch (err) {
    if (err instanceof TaskFailedError) {
      const details = err.taskDetails as { failure?: string; failureCode?: string };
      throw new RunwaySceneError(
        details.failure ?? "Runway generation failed",
        details.failureCode
      );
    }
    throw err;
  }
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
