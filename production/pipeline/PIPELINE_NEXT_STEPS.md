# Pipeline next steps — S01E01 end-to-end

Target flow:

```
pnpm pipeline:generate -- production/pipeline/episodes/s01e01/manifest.json
          ↓
   scenes/*.mp4 written to disk (one per scene)
          ↓
pnpm pipeline:validate -- production/pipeline/episodes/s01e01/manifest.json
          ↓
pnpm pipeline:stitch  -- production/pipeline/episodes/s01e01/manifest.json
          ↓
   s01e01-master.mp4  ✓
```

---

## What is already built

### Scripts
- **`scripts/pipeline/validate-manifest.ts`** (`pnpm pipeline:validate`)
  Parses and type-checks the manifest, then reports any missing scene files.
  Exit 0 = schema valid + all files present; exit 2 = files missing; exit 1 = bad JSON or schema error.

- **`scripts/pipeline/stitch-episode.ts`** (`pnpm pipeline:stitch`)
  Reads the manifest, builds an FFmpeg concat list from `scenes[].file` sorted by `order`,
  and writes the final episode MP4. Supports `--reencode` for mixed-codec inputs.

- **`scripts/pipeline/manifest.ts`**
  Shared TypeScript types (`EpisodeManifest`, `SceneEntry`) and `validateManifest()` — used by both scripts above.

### Schema & docs
- **`schema/episode-manifest.schema.json`** — JSON Schema for manifest format.
- **`README.md`** — validate/stitch usage, folder layout, FFmpeg install, quick-test clips.
- **`AI_INTEGRATION.md`** — integration boundary, `generation` field convention, provider options, batch pseudo-code.
- **`.env.example`** — placeholder env var names for API keys.

### Example episode
- **`examples/s01e01-signal-lost/`** — skeleton manifest with 2 placeholder scenes and a partial script outline.
  This is a *prototype* only; it does not reflect the full S01E01 scene list from the beat sheet.

---

## What still needs to be built

### Step 1 — Real S01E01 episode folder and manifest
**File to create:** `production/pipeline/episodes/s01e01/manifest.json`

The example only has 2 scenes. A 30-minute episode needs ~15–25 scenes (roughly 60–120 s each).

Tasks:
- Create `production/pipeline/episodes/s01e01/` as the canonical production folder.
- Copy and expand `examples/s01e01-signal-lost/manifest.json` — one `scenes[]` entry per scene from
  `production/season-1-beats.json` episode 1 beat sheet (scene headings, act breaks).
- Fill in `generation` on every scene: `prompt`, `targetDurationSeconds`, `aspectRatio`, `provider`, `model`.
  Keep secrets out of the manifest; only non-sensitive metadata belongs here.
- Copy / write a full `script.md` aligned to the beat sheet.

### Step 2 — `pipeline:generate` script
**File to create:** `scripts/pipeline/generate-scenes.ts`
**npm script to add:** `"pipeline:generate": "tsx scripts/pipeline/generate-scenes.ts"`

This is the only missing piece that actually calls an AI provider. It bridges the manifest to the validate/stitch tools.

Responsibilities:
1. Parse CLI: `--manifest <path>`, optional `--dry-run`, `--force`.
2. Load and validate the manifest (reuse `validateManifest`).
3. For each scene, in `order`:
   - Resolve the absolute output path from `scene.file`.
   - **Skip** if the file already exists (idempotent; use `--force` to overwrite).
   - Read `scene.generation` to get `prompt`, `provider`, `model`, `targetDurationSeconds`, `aspectRatio`, etc.
   - Submit a generation job to the provider API.
   - Poll (or wait for webhook) until complete.
   - Download the resulting video URL to the exact `scene.file` path.
4. Exit non-zero on any failure so CI does not proceed to stitch.

### Step 3 — One concrete provider adapter
`generate-scenes.ts` needs at least one working implementation. Pick one to start:

| Provider | API style | Good for |
|----------|-----------|----------|
| **Replicate** | Submit job → poll `GET /predictions/{id}` → download URL | Many models, one HTTP pattern; easiest first adapter |
| **Runway** | `POST /v1/image_to_video` or text-to-video; poll status | Official SDK; strong output quality |

Adapter responsibilities (isolated to a single file, e.g. `scripts/pipeline/providers/replicate.ts`):
- Read `REPLICATE_API_TOKEN` (or equivalent) from env — never from the manifest.
- Accept a `generation` object, map fields to the provider's request shape.
- Return a local file path once the download is complete.

Add the chosen env var to `.env.example` and document the model id in `AI_INTEGRATION.md`.

### Step 4 — Validate and stitch (already built — just run it)
Once all `scenes/*.mp4` files are written:

```bash
pnpm pipeline:validate -- production/pipeline/episodes/s01e01/manifest.json
pnpm pipeline:stitch   -- production/pipeline/episodes/s01e01/manifest.json
# → production/pipeline/episodes/s01e01/s01e01-master.mp4
```

If scenes have mixed codecs or resolutions, add `--reencode` (or set `"reencode": true` in the manifest).

---

## Complete run command (once Steps 1–3 are done)

```bash
# 1. Generate all scene videos
pnpm pipeline:generate -- production/pipeline/episodes/s01e01/manifest.json

# 2. Confirm all files present
pnpm pipeline:validate -- production/pipeline/episodes/s01e01/manifest.json

# 3. Stitch into episode master
pnpm pipeline:stitch -- production/pipeline/episodes/s01e01/manifest.json
```

Output: `production/pipeline/episodes/s01e01/s01e01-master.mp4`

---

## Priority order

1. Choose a provider (Replicate vs Runway) and get a test API key.
2. Build the full scene manifest for S01E01 from the beat sheet.
3. Implement `pipeline:generate` with one provider adapter.
4. Do a dry-run (`--dry-run`) to confirm prompts and paths look right before spending credits.
5. Run the full three-command flow above.

---

## Related files

| File | Purpose |
|------|---------|
| `production/pipeline/README.md` | validate/stitch usage and folder layout |
| `production/pipeline/AI_INTEGRATION.md` | Integration boundary, provider table, batch pseudo-code |
| `production/pipeline/schema/episode-manifest.schema.json` | Manifest JSON Schema |
| `production/pipeline/examples/s01e01-signal-lost/manifest.json` | Prototype manifest (2-scene skeleton) |
| `production/season-1-beats.json` | Episode 1 scene list source of truth for building the real manifest |
| `production/pipeline/.env.example` | API key placeholders |
