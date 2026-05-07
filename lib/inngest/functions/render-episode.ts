import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import RunwayML from "@runwayml/sdk";
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { episodes, jobs, scenes } from "@/lib/db/schema";
import { syncScenesFromScript } from "@/lib/episodes/sync-scenes-from-script";
import { inngest } from "@/lib/inngest/client";
import {
  downloadFromBucket,
  ensureEpisodeBucket,
  getStorageClient,
  publicUrlToObjectPath,
  uploadVideo,
} from "@/lib/inngest/storage";
import {
  RunwaySceneError,
  downloadVideo,
  generateScene,
  generationBlockToInput,
} from "@/packages/pipeline/runway";
import { stitchEpisode } from "@/packages/pipeline/stitch";

export const renderEpisode = inngest.createFunction(
  {
    id: "render-episode",
    retries: 0,
    triggers: [{ event: "episode/render.requested" }],
    onFailure: async ({ event, error }) => {
      const original = (event.data as { event?: { data?: unknown } }).event;
      const data = (original?.data ?? {}) as {
        jobId?: string;
        episodeId?: string;
      };
      const { jobId, episodeId } = data;
      const message =
        (error as Error)?.message ?? String(error);

      if (jobId) {
        await db
          .update(jobs)
          .set({
            status: "failed",
            error: message,
            completedAt: sql`now()`,
          })
          .where(eq(jobs.id, jobId));
      }

      if (episodeId) {
        await db
          .update(scenes)
          .set({
            status: "failed",
            error: sql`COALESCE(${scenes.error}, ${message})`,
            updatedAt: sql`now()`,
          })
          .where(
            sql`${scenes.episodeId} = ${episodeId} AND ${scenes.status} IN ('pending', 'generating')`
          );
      }
    },
  },
  async ({ event, step }) => {
    const { jobId, episodeId, sceneIds: rawSceneIds } = event.data as {
      jobId: string;
      episodeId: string;
      sceneIds?: string[];
    };

    const sceneIdSelection =
      Array.isArray(rawSceneIds) && rawSceneIds.length > 0
        ? new Set(
            rawSceneIds.filter(
              (id): id is string => typeof id === "string" && id.length > 0
            )
          )
        : null;

    if (!process.env.RUNWAYML_API_SECRET) {
      throw new Error(
        "RUNWAYML_API_SECRET not set — cannot generate scenes. Set it in .env to render."
      );
    }

    await step.run("mark-running", async () => {
      await db
        .update(jobs)
        .set({ status: "running", startedAt: sql`now()` })
        .where(eq(jobs.id, jobId));
    });

    // 1. Load the episode + script
    const episode = await step.run("load-episode", async () => {
      const [row] = await db
        .select()
        .from(episodes)
        .where(eq(episodes.id, episodeId))
        .limit(1);
      if (!row) throw new Error(`Episode ${episodeId} not found`);
      if (!row.scriptContent) {
        throw new Error(`Episode ${episodeId} has no scriptContent — cannot render`);
      }
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        scriptContent: row.scriptContent,
      };
    });

    // 2. Parse the script and upsert scenes
    const sceneRows = await step.run("parse-and-upsert-scenes", async () => {
      const inserted = await syncScenesFromScript(episode);

      const scenesTotal =
        sceneIdSelection?.size ?? inserted.length;

      await db
        .update(jobs)
        .set({
          progress: {
            scenesTotal,
            scenesComplete: 0,
            phase: "generating",
          },
        })
        .where(eq(jobs.id, jobId));

      return inserted;
    });

    const runway = new RunwayML();
    const supabase = getStorageClient();
    await ensureEpisodeBucket(supabase);

    // 3. Fan out per-scene generation in parallel
    const sceneResults = await Promise.all(
      sceneRows.map((s) =>
        step.run(`generate-scene-${s.sceneNumber}`, async () => {
          const [existing] = await db
            .select()
            .from(scenes)
            .where(eq(scenes.id, s.id))
            .limit(1);

          if (sceneIdSelection && !sceneIdSelection.has(s.id)) {
            if (existing?.status === "complete" && existing.videoPath) {
              return {
                sceneNumber: s.sceneNumber,
                videoPath: existing.videoPath,
              };
            }
            return { sceneNumber: s.sceneNumber, videoPath: null };
          }

          // Reuse already-rendered scene
          if (existing?.status === "complete" && existing.videoPath) {
            return {
              sceneNumber: s.sceneNumber,
              videoPath: existing.videoPath,
            };
          }

          // Leave previously-failed scenes alone unless caller explicitly
          // reset them to "pending" via the selective-retry endpoint.
          if (existing?.status === "failed") {
            return { sceneNumber: s.sceneNumber, videoPath: null };
          }

          await db
            .update(scenes)
            .set({ status: "generating", error: null, updatedAt: sql`now()` })
            .where(eq(scenes.id, s.id));

          try {
            const input = generationBlockToInput(
              {
                prompt: s.generationPrompt ?? undefined,
                targetDurationSeconds: s.durationSeconds ?? undefined,
              },
              s.title ?? `Scene ${s.sceneId}`
            );

            const { videoUrl } = await generateScene(input, runway);
            const buf = await downloadVideo(videoUrl);

            const objectPath = `scenes/${episode.slug}/${s.sceneId}.mp4`;
            const publicUrl = await uploadVideo(supabase, objectPath, buf);

            await db
              .update(scenes)
              .set({
                status: "complete",
                videoPath: publicUrl,
                updatedAt: sql`now()`,
              })
              .where(eq(scenes.id, s.id));

            return { sceneNumber: s.sceneNumber, videoPath: publicUrl };
          } catch (err) {
            // Mark this scene failed but don't reject the run — let the rest
            // of the fan-out finish so the user can retry just the failures.
            const msg =
              err instanceof RunwaySceneError
                ? err.message
                : (err as Error).message;
            await db
              .update(scenes)
              .set({
                status: "failed",
                error: msg,
                updatedAt: sql`now()`,
              })
              .where(eq(scenes.id, s.id));
            return { sceneNumber: s.sceneNumber, videoPath: null };
          }
        })
      )
    );

    const completed = sceneResults.filter(
      (r): r is { sceneNumber: number; videoPath: string } =>
        r.videoPath !== null
    );
    const incomplete = sceneResults.length - completed.length;
    const allComplete = incomplete === 0;

    // 4. Stitch — only when every scene has a videoPath. Partial runs (some
    // failures) skip stitching; the user can retry the failures and we'll
    // stitch on the next successful pass.
    const masterUrl = allComplete
      ? await step.run("stitch-master", async () => {
          await db
            .update(jobs)
            .set({
              progress: {
                scenesTotal: sceneRows.length,
                scenesComplete: completed.length,
                phase: "stitching",
              },
            })
            .where(eq(jobs.id, jobId));

          const workDir = path.join(
            tmpdir(),
            `nova-${episode.slug}-${Date.now()}`
          );
          mkdirSync(workDir, { recursive: true });

          const ordered = [...completed].sort(
            (a, b) => a.sceneNumber - b.sceneNumber
          );
          const localPaths: string[] = [];

          for (const r of ordered) {
            const objectPath = publicUrlToObjectPath(r.videoPath);
            if (!objectPath) {
              throw new Error(
                `Could not resolve object path from URL: ${r.videoPath}`
              );
            }
            const buf = await downloadFromBucket(supabase, objectPath);
            const local = path.join(
              workDir,
              `scene-${String(r.sceneNumber).padStart(2, "0")}.mp4`
            );
            writeFileSync(local, buf);
            localPaths.push(local);
          }

          const masterLocal = path.join(
            workDir,
            `${episode.slug}-master.mp4`
          );
          await stitchEpisode({
            scenePaths: localPaths,
            outputPath: masterLocal,
            reencode: true,
          });

          const { readFileSync } = await import("node:fs");
          const masterBuf = readFileSync(masterLocal);
          const masterObjectPath = `masters/${episode.slug}.mp4`;
          const masterPublicUrl = await uploadVideo(
            supabase,
            masterObjectPath,
            masterBuf
          );

          await db
            .update(episodes)
            .set({
              masterVideoPath: masterPublicUrl,
              updatedAt: sql`now()`,
            })
            .where(eq(episodes.id, episode.id));

          return masterPublicUrl;
        })
      : null;

    // 5. Mark job complete. Lifecycle is "complete" either way — the UI
    // surfaces failures via scene-level state.
    await step.run("mark-complete", async () => {
      await db
        .update(jobs)
        .set({
          status: "complete",
          completedAt: sql`now()`,
          progress: {
            scenesTotal: sceneRows.length,
            scenesComplete: completed.length,
            phase: allComplete ? "complete" : "incomplete",
            ...(allComplete ? {} : { incomplete }),
          },
          result: {
            masterUrl,
            episodeId: episode.id,
            ...(allComplete ? {} : { incomplete }),
          },
        })
        .where(eq(jobs.id, jobId));
    });

    return { jobId, episodeId, masterUrl };
  }
);
