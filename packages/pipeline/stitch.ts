import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export type StitchOptions = {
  /** Absolute paths to scene .mp4 files, in concat order. */
  scenePaths: string[];
  /** Absolute path for the master output .mp4. */
  outputPath: string;
  /** If true, re-encode (libx264/aac). Otherwise stream-copy (-c copy). */
  reencode?: boolean;
  /** Override FFmpeg binary; defaults to env FFMPEG_PATH or "ffmpeg" on PATH. */
  ffmpegPath?: string;
  /** Where to write the temporary concat list. Defaults next to output. */
  workDir?: string;
  /** Optional log sink. Defaults to console. */
  log?: (line: string) => void;
};

export type StitchResult = {
  outputPath: string;
  ffmpegArgs: string[];
};

/**
 * Stitch ordered scene videos into a single episode file using FFmpeg's concat demuxer.
 *
 * Pure-ish: takes absolute paths, runs ffmpeg, returns the output path. No manifest knowledge.
 */
export async function stitchEpisode(opts: StitchOptions): Promise<StitchResult> {
  if (opts.scenePaths.length === 0) {
    throw new Error("stitchEpisode: scenePaths must be non-empty");
  }
  for (const p of opts.scenePaths) {
    if (!existsSync(p)) {
      throw new Error(`stitchEpisode: missing scene file: ${p}`);
    }
  }

  const outDir = path.dirname(opts.outputPath);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const workDir = opts.workDir ?? outDir;
  const listPath = path.join(workDir, ".ffmpeg-concat-list.txt");
  const listBody = opts.scenePaths
    .map((p) => `file ${escapeConcatPath(p)}`)
    .join("\n");
  writeFileSync(listPath, listBody, "utf8");

  const args = buildFfmpegArgs({
    listPath,
    outputPath: opts.outputPath,
    reencode: opts.reencode === true,
  });
  const ffmpeg = opts.ffmpegPath ?? process.env.FFMPEG_PATH?.trim() ?? "ffmpeg";

  const log = opts.log ?? ((l) => console.log(l));
  log(`Running: ${ffmpeg} ${args.join(" ")}`);

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(ffmpeg, args, { stdio: "inherit" });
    proc.on("error", reject);
    proc.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });

  return { outputPath: opts.outputPath, ffmpegArgs: args };
}

function buildFfmpegArgs(o: {
  listPath: string;
  outputPath: string;
  reencode: boolean;
}): string[] {
  const base = ["-y", "-f", "concat", "-safe", "0", "-i", o.listPath];
  if (o.reencode) {
    return [
      ...base,
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "20",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart",
      o.outputPath,
    ];
  }
  return [...base, "-c", "copy", o.outputPath];
}

function escapeConcatPath(absPath: string): string {
  const normalized = absPath.replace(/\\/g, "/");
  const escaped = normalized.replace(/'/g, "'\\''");
  return `'${escaped}'`;
}
