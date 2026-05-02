import { Inngest } from "inngest";

export type EpisodeRenderRequested = {
  name: "episode/render.requested";
  data: {
    jobId: string;
    episodeId: string;
  };
};

export type SceneGenerateRequested = {
  name: "scene/generate.requested";
  data: {
    jobId: string;
    sceneId: string;
  };
};

export type NovaEvent = EpisodeRenderRequested | SceneGenerateRequested;

export const inngest = new Inngest({
  id: "nova-force",
  isDev: process.env.NODE_ENV !== "production",
});
