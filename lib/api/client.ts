import type { DraftCharacter, WizardState } from "@/app/shows/new/wizard/types";

type VideoScope = "single" | "series";

// ─── Response shapes ─────────────────────────────────────────────────────────

type ConceptResponse = {
  title: string;
  logline: string;
  genres: string[];
  tones: string[];
};

type BibleResponse = {
  worldRules: string;
  visualStyle: string;
  thematicFocus: string;
};

type CharactersResponse = {
  characters: Omit<DraftCharacter, "id">[];
};

type StyleResponse = {
  styleId: string;
  reason?: string;
};

type ShowResponse = Partial<Omit<WizardState, "slug" | "scenesPerEpisode">>;

type JobRow = {
  id: string;
  type: string;
  status: string | null;
  episodeId: string | null;
  progress: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

type SceneRow = {
  id: string;
  sceneNumber: number;
  sceneId: string | null;
  title: string | null;
  status: string | null;
  videoPath: string | null;
  error: string | null;
};

type JobResponse = {
  job: JobRow;
  scenes: SceneRow[];
  masterVideoPath: string | null;
};

// ─── API client ───────────────────────────────────────────────────────────────

export class ApiClient {
  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const text = await res.text();
    let body: Record<string, unknown> = {};
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        if (!res.ok) throw new Error(`Server error (${res.status}): ${text.slice(0, 200)}`);
      }
    }
    if (!res.ok) throw new Error((body.error as string) ?? `HTTP ${res.status}`);
    return body as T;
  }

  private post<T>(url: string, data: unknown): Promise<T> {
    return this.request<T>(url, { method: "POST", body: JSON.stringify(data) });
  }

  private patch<T>(url: string, data: unknown): Promise<T> {
    return this.request<T>(url, { method: "PATCH", body: JSON.stringify(data) });
  }

  private put<T>(url: string, data: unknown): Promise<T> {
    return this.request<T>(url, { method: "PUT", body: JSON.stringify(data) });
  }

  // ─── Auth ───────────────────────────────────────────────────────────────

  checkEmail(email: string) {
    return this.post<{ exists: boolean }>("/api/auth/check-email", { email });
  }

  // ─── Shows ──────────────────────────────────────────────────────────────

  async checkSlug(slug: string): Promise<{ available: boolean }> {
    return this.request(`/api/shows/check-slug?slug=${encodeURIComponent(slug)}`);
  }

  createShow(payload: {
    title: string;
    logline: string;
    genres: string[];
    tones: string[];
    videoScope: VideoScope;
    episodeSeconds: number;
    totalEpisodes: number;
    platform: string;
    settingDescription: string;
    worldRules: string;
    visualStyle: string;
    thematicFocus: string;
    draftCharacters: DraftCharacter[];
    designStyleId: string;
  }) {
    return this.post<{ showSlug: string }>("/api/shows", payload);
  }

  // ─── AI ─────────────────────────────────────────────────────────────────

  generateShow(hint?: string) {
    return this.post<ShowResponse>("/api/ai/generate-show", { hint: hint ?? "" });
  }

  generateConcept(hint?: string) {
    return this.post<ConceptResponse>("/api/ai/generate-concept", { hint: hint ?? "" });
  }

  generateBible(payload: {
    title: string;
    logline: string;
    genres: string[];
    tones: string[];
    audience?: string;
    settingDescription: string;
  }) {
    return this.post<BibleResponse>("/api/ai/generate-bible", payload);
  }

  generateCharacters(payload: {
    title: string;
    logline: string;
    genres: string[];
    worldRules: string;
    visualStyle: string;
    count: number;
  }) {
    return this.post<CharactersResponse>("/api/ai/generate-characters", payload);
  }

  suggestStyle(payload: {
    title: string;
    logline: string;
    genres: string[];
    tones: string[];
    settingDescription: string;
  }) {
    return this.post<StyleResponse>("/api/ai/suggest-style", payload);
  }

  // ─── Characters ─────────────────────────────────────────────────────────

  updateCharacter(
    showSlug: string,
    charSlug: string,
    data: {
      name: string;
      realName: string | null;
      lockStatus: string;
      data: Record<string, unknown>;
    }
  ) {
    return this.patch<void>(`/api/shows/${showSlug}/characters/${charSlug}`, data);
  }

  generateCharacterImage(showSlug: string, charSlug: string, prompt: string) {
    return this.post<{ jobId: string }>(
      `/api/shows/${showSlug}/characters/${charSlug}/generate-image`,
      { prompt }
    );
  }

  // ─── Episodes ───────────────────────────────────────────────────────────

  updateEpisode(
    showSlug: string,
    epSlug: string,
    data: {
      title?: string;
      brief?: string | null;
      tags?: string[];
      focusCharacterSlug?: string | null;
      lockStatus?: string;
    }
  ) {
    return this.patch<void>(`/api/shows/${showSlug}/episodes/${epSlug}`, data);
  }

  saveScript(showSlug: string, epSlug: string, scriptContent: string) {
    return this.put<void>(`/api/shows/${showSlug}/episodes/${epSlug}/script`, {
      scriptContent,
    });
  }

  renderEpisode(showSlug: string, epSlug: string, sceneIds: string[]) {
    return this.post<{ jobId: string }>(
      `/api/shows/${showSlug}/episodes/${epSlug}/render`,
      { sceneIds }
    );
  }

  // ─── Jobs ────────────────────────────────────────────────────────────────

  getJob(jobId: string) {
    return this.request<JobResponse>(`/api/jobs/${jobId}`, { cache: "no-store" } as RequestInit);
  }
}
