# Platform MVP Plan

Transform Nova Force from a single-show, CLI-driven repo into a web-based authoring + rendering tool. This MVP is the stepping stone toward a multi-tenant "create your own AI TV show" platform, but the MVP itself is **single user, single show (Nova Force), single deploy**.

Target: 4–6 weeks solo with AI assist.

## Goal

Render a full Nova Force episode — edit script, generate manifest, kick off Runway, stitch, preview — without opening a terminal.

## Explicit scope cuts (NOT in MVP)

- No multi-tenancy, workspaces, or user signup flow.
- No billing, quotas, usage metering.
- No provider abstraction — Runway only, hardcoded.
- No collaboration, version history, undo.
- No public hosting / onboarding flow / empty-state tutorials.
- No support for creating new shows in the UI — Nova Force is seed data.

If it does not move Nova Force from CLI to web UI, it is out of scope.

---

## Architecture

| Layer | Choice | Rationale |
|---|---|---|
| App framework | **Next.js 15** (App Router) | API routes + React UI in one tree; Vercel-native deploy; replaces current Vite app |
| Database | **Supabase Postgres** | Managed Postgres free tier (500 MB); no SQLite→Postgres migration later; realtime subscriptions built in |
| ORM | **Drizzle ORM** | Lightweight, no generated client, strong TypeScript inference, SQL-like syntax, first-class Postgres support |
| Auth | **Supabase Auth** | Email + OAuth out of the box; middleware integration with Next.js; row-level security option for future multi-tenancy |
| Storage | **Supabase Storage** | S3-compatible buckets for character designs, concept boards, scene clips, and final episode videos; signed URLs; no local asset serving |
| Jobs | **Inngest** | Step functions with sleep/poll for long-running Runway jobs; fan-out for parallel scene generation; local dev server; Vercel-native |
| Pipeline | Extracted into `packages/pipeline/` | Same logic as current `scripts/pipeline/`, callable from Inngest jobs and CLI wrappers |
| Editor | **CodeMirror 6** | Lightweight (~130 KB), clean React integration via `@uiw/react-codemirror`, markdown mode + custom extensions, no SSR issues |

### Why these choices

**Supabase over SQLite:** The original plan used SQLite to avoid infrastructure. But Supabase's free tier gives us Postgres + auth + storage + realtime with zero ops. Starting with Postgres means no migration pain when scaling to multi-tenant. The DB is the canonical data store — JSON files become seed data for the initial import.

**Drizzle over Prisma:** Prisma generates a heavy client and has cold-start penalties on serverless. Drizzle infers types directly from the schema (no `prisma generate` step), produces thinner queries, and its SQL-like API makes complex joins readable. At this scale performance is identical, but Drizzle's developer ergonomics are better for a solo dev.

**Inngest over BullMQ:** BullMQ requires a Redis instance — more infra to manage. Inngest runs as a serverless function on Vercel with a local dev server for testing. Its step-function model maps perfectly to the episode render workflow: fan out scene generation → wait → stitch.

**CodeMirror 6 over Monaco:** Monaco is VS Code's full editor (~4 MB). CodeMirror 6 is modular and ~130 KB for markdown editing. For writing episode scripts (not code), CodeMirror is the right weight class. No SSR headaches — it lazy-loads cleanly with `next/dynamic`.

---

## Project structure

```
nova/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout + Supabase provider
│   ├── page.tsx                  # Dashboard / show overview
│   ├── login/
│   │   └── page.tsx              # Supabase Auth UI
│   ├── characters/
│   │   ├── page.tsx              # Roster grid
│   │   └── [slug]/
│   │       └── page.tsx          # Character detail + editor
│   ├── locations/
│   │   ├── page.tsx              # Location registry
│   │   └── [slug]/
│   │       └── page.tsx          # Location detail + editor
│   ├── episodes/
│   │   ├── page.tsx              # Season grid
│   │   └── [slug]/
│   │       ├── page.tsx          # Episode detail + scene list
│   │       ├── script/
│   │       │   └── page.tsx      # Script editor (CodeMirror)
│   │       └── render/
│   │           └── page.tsx      # Render console + progress
│   ├── assets/
│   │   └── page.tsx              # Asset browser (images, clips, videos)
│   └── api/
│       ├── inngest/
│       │   └── route.ts          # Inngest webhook endpoint
│       ├── characters/
│       │   └── route.ts          # CRUD
│       ├── locations/
│       │   └── route.ts          # CRUD
│       ├── episodes/
│       │   ├── route.ts          # CRUD
│       │   └── [slug]/
│       │       ├── manifest/
│       │       │   └── route.ts  # POST: generate manifest from script
│       │       └── render/
│       │           └── route.ts  # POST: enqueue episode render job
│       └── jobs/
│           └── [id]/
│               └── route.ts      # GET: job status + progress
├── components/
│   ├── ui/                       # Shared UI primitives
│   ├── character-card.tsx        # Migrated from current src/
│   ├── script-editor.tsx         # CodeMirror wrapper
│   ├── scene-list.tsx            # Draggable scene ordering
│   ├── render-progress.tsx       # Live job progress display
│   └── asset-thumbnail.tsx       # Image/video preview card
├── lib/
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema definitions
│   │   ├── client.ts             # Drizzle + Supabase Postgres connection
│   │   └── seed.ts               # Import Nova Force JSON → Postgres
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client
│   │   └── middleware.ts         # Auth middleware
│   └── inngest/
│       ├── client.ts             # Inngest client instance
│       └── functions/
│           ├── generate-manifest.ts
│           ├── render-episode.ts  # Fan-out scenes → stitch
│           ├── generate-scene.ts  # Single Runway scene
│           ├── stitch-episode.ts  # FFmpeg concat
│           └── generate-image.ts  # OpenAI character/location image
├── packages/
│   └── pipeline/                 # Extracted pipeline logic (pure functions)
│       ├── manifest.ts           # generateManifest(), validateManifest()
│       ├── runway.ts             # generateScene(), pollGeneration()
│       ├── stitch.ts             # stitchEpisode()
│       ├── image.ts              # generateImage(), loadStyleRefs()
│       └── types.ts              # Shared types (Manifest, Scene, etc.)
├── scripts/
│   └── pipeline/                 # CLI wrappers (kept for terminal use)
│       ├── generate-manifest.ts  # Thin wrapper → packages/pipeline
│       ├── generate-scenes.ts
│       ├── stitch-episode.ts
│       └── generate-images.ts
├── supabase/
│   └── migrations/               # Supabase migration files
├── drizzle.config.ts
├── next.config.ts
└── package.json
```

---

## Database schema

```sql
-- Core content tables (seeded from existing JSON files)

shows
  id              uuid PK default gen_random_uuid()
  title           text not null                          -- "NOVA FORCE"
  slug            text unique not null                   -- "nova-force"
  format          jsonb                                  -- episode length, arc structure
  series_bible    jsonb                                  -- world rules, tone, visual language
  created_at      timestamptz default now()
  updated_at      timestamptz default now()

characters
  id              uuid PK default gen_random_uuid()
  show_id         uuid FK → shows.id
  name            text not null                          -- "Surge"
  real_name       text                                   -- "Marcus Valdez"
  slug            text not null                          -- "surge"
  roster_number   int
  type            text                                   -- "hero" | "antagonist"
  affiliation     text                                   -- "Nova Force" | "Lattice"
  data            jsonb not null                         -- full character JSON (powers, arc, etc.)
  design_sheet    text                                   -- Supabase Storage path
  lock_status     text default 'draft'                   -- "draft" | "locked"
  created_at      timestamptz default now()
  updated_at      timestamptz default now()
  UNIQUE(show_id, slug)

locations
  id              uuid PK default gen_random_uuid()
  show_id         uuid FK → shows.id
  name            text not null                          -- "Glasshook Pier"
  slug            text not null                          -- "glasshook-pier"
  district        text                                   -- "Lowline" | "Meridian Central"
  data            jsonb not null                         -- full location JSON
  concept_board   text                                   -- Supabase Storage path
  created_at      timestamptz default now()
  updated_at      timestamptz default now()
  UNIQUE(show_id, slug)

episodes
  id              uuid PK default gen_random_uuid()
  show_id         uuid FK → shows.id
  season          int not null default 1
  arc             int                                    -- arc number within season
  episode_number  int not null                           -- episode number within season
  title           text not null                          -- "The Pulse"
  slug            text not null                          -- "s01e01-the-pulse"
  focus_character uuid FK → characters.id
  brief           text                                   -- one-line summary
  tags            text[]                                 -- ["origin", "action", "surge"]
  script_content  text                                   -- full markdown script
  runtime_seconds int
  lock_status     text default 'draft'
  created_at      timestamptz default now()
  updated_at      timestamptz default now()
  UNIQUE(show_id, slug)

scenes
  id              uuid PK default gen_random_uuid()
  episode_id      uuid FK → episodes.id
  scene_number    int not null
  location_id     uuid FK → locations.id
  title           text                                   -- "Dawn on the pier"
  duration_seconds int
  script_block    text                                   -- scene's portion of the script
  generation_prompt text                                 -- Runway prompt
  video_path      text                                   -- Supabase Storage path
  status          text default 'pending'                 -- pending | generating | complete | failed
  created_at      timestamptz default now()
  updated_at      timestamptz default now()
  UNIQUE(episode_id, scene_number)

jobs
  id              uuid PK default gen_random_uuid()
  type            text not null                          -- "episode.render" | "scene.generate" | "image.generate" | "manifest.generate"
  status          text default 'pending'                 -- pending | running | complete | failed
  episode_id      uuid FK → episodes.id (nullable)
  scene_id        uuid FK → scenes.id (nullable)
  inngest_run_id  text                                   -- Inngest's external run ID
  progress        jsonb default '{}'                     -- { scenesComplete: 3, scenesTotal: 6 }
  result          jsonb                                  -- output data on completion
  error           text                                   -- error message on failure
  started_at      timestamptz
  completed_at    timestamptz
  created_at      timestamptz default now()

assets
  id              uuid PK default gen_random_uuid()
  show_id         uuid FK → shows.id
  type            text not null                          -- "character_design" | "concept_board" | "scene_clip" | "episode_video" | "style_reference"
  name            text not null
  storage_path    text not null                          -- Supabase Storage bucket path
  file_size       int                                    -- bytes
  mime_type       text                                   -- "image/png" | "video/mp4"
  metadata        jsonb default '{}'                     -- dimensions, duration, generation prompt, etc.
  character_id    uuid FK → characters.id (nullable)
  location_id     uuid FK → locations.id (nullable)
  episode_id      uuid FK → episodes.id (nullable)
  created_at      timestamptz default now()
```

### JSON → Postgres migration strategy

The `data` column on `characters` and `locations` stores the full original JSON as JSONB. Frequently queried fields (name, slug, type, affiliation) are promoted to real columns for indexing and filtering. Everything else stays in the JSONB blob and is accessed via `data->>'fieldName'` when needed.

The seed script (`lib/db/seed.ts`) reads from `characters/*.json`, `characters/antagonists/*.json`, `production/locations.json`, `production/season-1-beats.json`, and `Season 1/season.json` to populate the database. After seeding, the DB is canonical — JSON files are no longer the source of truth.

---

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/characters` | List all characters (filterable by type) |
| GET/PUT | `/api/characters/[slug]` | Get or update a character |
| GET | `/api/locations` | List all locations |
| GET/PUT | `/api/locations/[slug]` | Get or update a location |
| GET | `/api/episodes` | List episodes (filterable by season, arc) |
| GET/PUT | `/api/episodes/[slug]` | Get or update episode metadata |
| GET/PUT | `/api/episodes/[slug]/script` | Get or save script markdown |
| POST | `/api/episodes/[slug]/manifest` | Generate manifest from current script |
| POST | `/api/episodes/[slug]/render` | Enqueue full episode render (Inngest) |
| POST | `/api/episodes/[slug]/scenes/[num]/render` | Re-render a single scene |
| GET | `/api/jobs/[id]` | Poll job status + progress |
| GET | `/api/assets` | List assets (filterable by type) |
| POST | `/api/inngest` | Inngest webhook receiver |

---

## Inngest job flows

### Episode render workflow

```
POST /api/episodes/s01e01-the-pulse/render
  → creates job record (status: pending)
  → sends inngest event: "episode/render.requested"

Inngest function: render-episode
  step 1: generate manifest from script
  step 2: fan out — for each scene in parallel:
    → send "scene/generate.requested"
    → Runway API: create generation
    → poll Runway every 10s until complete
    → upload .mp4 to Supabase Storage
    → update scene row (status: complete, video_path)
    → update job progress ({ scenesComplete: N, scenesTotal: M })
  step 3: wait for all scenes complete
  step 4: stitch episode
    → download all scene clips
    → FFmpeg concat → master .mp4
    → upload to Supabase Storage
  step 5: update job (status: complete), update episode
```

### Image generation workflow

```
POST /api/characters/[slug]/generate-image  (or locations)
  → sends inngest event: "image/generate.requested"

Inngest function: generate-image
  step 1: load style references from Supabase Storage
  step 2: call OpenAI gpt-image-1 with style refs + prompt
  step 3: upload result to Supabase Storage
  step 4: update character/location row with asset path
```

### Progress → UI

Jobs table is polled from the render console page every 2 seconds via `GET /api/jobs/[id]`. The `progress` JSONB column carries structured data:

```json
{
  "scenesTotal": 6,
  "scenesComplete": 3,
  "scenesFailed": 0,
  "currentScene": "scene-04",
  "phase": "generating"  // "generating" | "stitching" | "uploading"
}
```

Future upgrade: replace polling with Supabase Realtime subscription on the `jobs` table for instant updates.

---

## Milestones

### Week 1 — Foundation

- [ ] Scaffold Next.js 15 app (App Router) in project root; remove Vite config.
- [ ] Set up Supabase project (Postgres + Auth + Storage buckets).
- [ ] Configure Drizzle ORM with Supabase Postgres connection string.
- [ ] Define Drizzle schema (`lib/db/schema.ts`) for all tables above.
- [ ] Run initial migration via `drizzle-kit push`.
- [ ] Build seed script: import all Nova Force JSON into Postgres.
- [ ] Set up Supabase Auth with email login; protect all routes via middleware.
- [ ] Migrate `CharacterCard` component from `src/` to `components/`.
- [ ] Extract `scripts/pipeline/*.ts` into `packages/pipeline/` as pure functions:
  - `generateManifest(scriptContent, opts)` — no file I/O, takes string input
  - `generateScene(prompt, opts)` — Runway API call, returns Buffer
  - `stitchEpisode(scenePaths, outputPath)` — FFmpeg concat
  - `validateManifest(manifest)` — schema validation
- [ ] Keep CLI wrappers in `scripts/pipeline/` that call the extracted functions.
- **Done when:** `pnpm dev` serves Next.js app with auth gate; seed script populates DB; CLI pipeline commands still work.

### Week 2 — Read-only UI

- [ ] `/` — Dashboard: show title, season progress, quick stats.
- [ ] `/characters` — Roster grid using migrated `CharacterCard`.
- [ ] `/characters/[slug]` — Character detail: design sheet image, powers, arc, all JSON fields rendered.
- [ ] `/locations` — Location registry with concept board thumbnails.
- [ ] `/locations/[slug]` — Location detail with full data.
- [ ] `/episodes` — Season grid grouped by arc, showing status badges.
- [ ] `/episodes/[slug]` — Episode detail: metadata, scene list, script preview.
- [ ] `/assets` — Asset browser: grid of all images/videos with type filters.
- [ ] All images served from Supabase Storage with signed URLs.
- **Done when:** every piece of Nova Force data is viewable in the browser, sourced from Postgres.

### Week 3 — Authoring

- [ ] Character editor: form-driven, validates against `Character` type contract, saves to DB.
- [ ] Location editor: same pattern.
- [ ] Episode metadata editor: title, focus, brief, tags.
- [ ] Script editor page (`/episodes/[slug]/script`):
  - CodeMirror 6 with markdown mode.
  - Auto-save with dirty-state indicator.
  - Character name autocomplete (pulled from DB).
  - Location slug autocomplete.
  - Side-by-side markdown preview.
- [ ] Scene list editor: reorder scenes, edit duration/prompt per scene.
- **Done when:** you author and edit Nova Force content in the browser — no VS Code needed for creative work.

### Week 4 — Pipeline integration

- [ ] Set up Inngest (local dev server + Vercel endpoint at `/api/inngest`).
- [ ] Implement Inngest functions:
  - `generate-manifest` — parse script → scene list.
  - `render-episode` — fan-out scene generation → stitch.
  - `generate-scene` — single Runway API call with polling.
  - `stitch-episode` — download scene clips → FFmpeg → upload master.
  - `generate-image` — OpenAI image generation with style references.
- [ ] API routes to enqueue jobs from UI.
- [ ] Jobs table tracking with progress updates.
- [ ] Upload all generated assets to Supabase Storage.
- **Done when:** clicking "Render episode" in the UI produces the same `.mp4` as the CLI.

### Week 5 — Render console & polish

- [ ] `/episodes/[slug]/render` page:
  - Per-scene progress bars with status badges.
  - Live job polling (2s interval).
  - Retry-failed-scenes button.
  - Final video preview inline (HTML5 `<video>`).
  - Runway cost estimate display.
- [ ] Image generation UI: "Generate design" button on character/location detail pages.
- [ ] Error surfaces: Runway/OpenAI API errors shown in UI with actionable messages.
- [ ] Toast notifications for job completion/failure.
- **Done when:** full episode render flow works end-to-end without touching a terminal.

### Week 6 — Deploy & harden

- [ ] Deploy to Vercel (Next.js + Inngest Cloud).
- [ ] FFmpeg worker: if Vercel function limits hit, set up a small Fly.io worker for stitch jobs.
- [ ] Environment variable management: `RUNWAY_API_KEY`, `OPENAI_API_KEY`, Supabase keys.
- [ ] Error monitoring (Vercel's built-in or Sentry free tier).
- [ ] Fix everything week 5 surfaced.
- [ ] Verify: render Episode 1 "The Pulse" end-to-end through the browser.

---

## Risks

| Risk | Mitigation |
|---|---|
| **FFmpeg in serverless** | Vercel functions have a 60s timeout (300s on Pro). Stitching a 7-min episode may exceed this. Plan for a Fly.io worker from week 4 — do not discover this in week 6. |
| **Runway job duration** | Scene generation takes 1–5 minutes. Inngest step functions handle this with sleep/poll. Never hold an HTTP connection open for generation. |
| **Supabase Storage limits** | Free tier: 1 GB storage, 2 GB bandwidth. Episode videos are ~200 MB each. Monitor usage; upgrade to Pro ($25/mo) when needed. |
| **Schema drift** | Drizzle schema is the contract. Use Zod schemas derived from Drizzle types for API validation and form validation — one source of truth for data shape. |
| **Scope creep** | The authoring UI (week 3) is the trap. Ship functional forms, not beautiful ones. Polish is post-MVP. |
| **JSON → DB migration** | The seed script must handle all edge cases in the existing JSON files. Write it early (week 1) and validate that round-tripping (JSON → DB → API → UI) produces correct data. |

---

## Post-MVP (deferred, do not start)

1. **Multi-tenancy** — `workspaces` table, Supabase RLS policies scoped per workspace.
2. **Billing** — Stripe metering on Runway minutes, TTS chars, LLM tokens.
3. **Provider abstraction** — `VideoProvider`, `VoiceProvider`, `MusicProvider`, `ImageProvider` interfaces; users pick per-show.
4. **Create-a-show flow** — empty state, show setup wizard, AI-generated bible scaffolding.
5. **Collaboration** — multiple users per show, Supabase Realtime presence, comments.
6. **Version history** — episode and character revisions, diff view, rollback.
7. **Realtime progress** — replace job polling with Supabase Realtime subscriptions.
8. **Asset CDN** — Supabase Storage + CDN, or migrate to Cloudflare R2 for lower egress costs.
9. **Public hosting** — custom domain, onboarding, docs, support.

---

## Definition of done

Every box in weeks 1–6 checked, plus: you render Episode 1 "The Pulse" end-to-end through the browser and the result matches (or exceeds) the current CLI output.
