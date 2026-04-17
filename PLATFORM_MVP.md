# Platform MVP Plan

Transform Nova Force from a single-show, CLI-driven repo into a web-based authoring + rendering tool. This MVP is the stepping stone toward a multi-tenant "create your own AI TV show" platform, but the MVP itself is **single user, single show (Nova Force), local or single deploy**.

Target: 4–6 weeks solo with AI assist.

## Goal

Render a full Nova Force episode — edit script, generate manifest, kick off Runway, stitch, preview — without opening a terminal.

## Explicit scope cuts (NOT in MVP)

- No multi-tenancy, workspaces, or user signup.
- No billing, quotas, usage metering.
- No provider abstraction — Runway only, hardcoded.
- No collaboration, version history, undo.
- No public hosting / onboarding flow / empty-state tutorials.
- No support for creating new shows in the UI — Nova Force is seed data.

If it does not move Nova Force from CLI to web UI, it is out of scope.

## Architecture

| Layer | Choice | Rationale |
|---|---|---|
| App framework | Next.js (replaces current Vite app in `src/`) | API routes + UI in one tree; easy deploy |
| DB | SQLite + Drizzle ORM | Zero infra, one-file backup, upgrade to Postgres later |
| Jobs | Inngest (fallback: BullMQ + Redis) | Long Runway jobs need retries + progress, not request/response |
| Assets | Local `production/assets/` served by Next; S3 later | Defer cloud storage |
| Pipeline code | Extracted from `scripts/pipeline/` into `packages/pipeline/` | Same logic, callable from jobs and CLIs |
| Auth | Single env-var password / localhost-only | Anything else is scope creep |
| Editor | CodeMirror or Monaco for script markdown | Script editing is the highest-value surface |

## Milestones

### Week 1 — Foundation & pipeline extraction

- [ ] Scaffold Next.js app; migrate `CharacterCard` + roster rendering.
- [ ] Extract `scripts/pipeline/*.ts` into `packages/pipeline/` as pure functions:
  - `generateManifest(scriptPath, opts)`
  - `generateScene(manifest, sceneIndex, opts)`
  - `stitchEpisode(manifest, opts)`
  - `validateManifest(manifest)`
- [ ] Inputs passed in — no `process.argv`, no hardcoded paths.
- [ ] Keep CLI wrappers so `pnpm pipeline:*` commands still work.
- **Done when:** web app renders roster; pipeline library imports and runs from a test script.

### Week 2 — Data layer & read-only UI

- [ ] Drizzle schema: `shows`, `characters`, `locations`, `episodes`, `scenes`, `jobs`, `assets`.
- [ ] Importer: Nova Force JSON (`characters/`, `production/`, `Season 1/`) → SQLite.
- [ ] Read-only pages:
  - `/show` — series bible summary
  - `/characters` — roster grid
  - `/characters/[slug]` — detail view
  - `/locations` — registry list
  - `/episodes` — season grid
  - `/episodes/[slug]` — episode detail + scene list + script preview
- **Done when:** every current JSON is viewable in the UI, sourced from DB.

### Week 3 — Authoring (edit in the browser)

- [ ] Character editor — form driven, validates against `Character` contract, saves to DB.
- [ ] Location editor — same pattern.
- [ ] Episode workspace — title/focus/brief/tags editable; scene list editor.
- [ ] Script markdown editor (CodeMirror/Monaco) with save + dirty-state indicator.
- [ ] Write-back to JSON files on save (keeps single-source-of-truth lint happy), OR flip DB to canonical and update lint hook.
- **Done when:** you edit Nova Force content in the browser instead of VS Code.

### Week 4 — Job queue & pipeline wiring

- [ ] Stand up Inngest (local dev server + one deployed endpoint).
- [ ] Workflows:
  - `manifest.generate` — regenerate manifest from script
  - `episode.render` — fan out per-scene Runway generation → stitch
  - `assets.conceptBoard` — concept board generation for characters/locations
- [ ] API routes to enqueue jobs from the UI.
- [ ] Job progress persisted to `jobs` table; SSE or polling to UI.
- **Done when:** clicking "Render episode" produces the same `.mp4` as the CLI does today.

### Week 5 — Render console & polish

- [ ] `/episodes/[slug]/render` page:
  - Live progress per scene
  - Runway cost tallied so far
  - Retry-failed-scenes button
  - Final video preview inline
- [ ] Asset browser with thumbnails (concept boards, character portraits, scene clips).
- [ ] Error surfaces — Runway API errors shown in UI, not just logs.
- [ ] Single-user auth gate (env-var password, middleware).
- **Done when:** you have not touched a CLI in a week.

### Week 6 — Buffer / harden

- [ ] Fix everything week 5 surfaced.
- [ ] One deploy target working end-to-end (Vercel + Inngest Cloud, or self-hosted Fly/Railway).
- [ ] README for future-self on how to run it.

## Risks

- **FFmpeg in serverless.** Vercel functions cannot run long FFmpeg jobs. Plan on a small worker (Fly.io / Railway / local machine) from week 1 — do not discover this in week 5.
- **Runway job duration.** Scene generation takes minutes. Use Inngest step functions with sleep/poll; do not hold HTTP connections open.
- **Schema drift.** JSON schemas in `production/pipeline/schema/` are the existing contract. Generate Drizzle types from them, or use Zod as the shared contract so UI forms, DB, and pipeline agree.
- **Scope creep via "while I'm here."** The authoring UI is the trap. Ship ugly forms in week 3; polish is v2.
- **Single-source-of-truth lint.** `scripts/lint-content.ts` runs on JSON edits via PostToolUse hook. Decide early whether DB or JSON is canonical; if DB, disable/rewrite the lint.

## Post-MVP (deferred, do not start)

These are the v2+ items that turn the MVP into a platform:

1. Multi-tenancy — `workspaces` table, scoped queries everywhere.
2. Auth proper — Clerk / Auth.js with OAuth.
3. Billing — Stripe metering on Runway minutes, TTS chars, LLM tokens.
4. Provider abstraction — `VideoProvider`, `VoiceProvider`, `MusicProvider`, `ImageProvider` interfaces; users pick per-show.
5. Create-a-show flow — empty state, show setup wizard, AI-generated bible scaffolding.
6. Collaboration — multiple users per show, presence, comments.
7. Version history — episode and character revisions, diff view, rollback.
8. Asset CDN — S3/R2, signed URLs.
9. Public hosting — onboarding, docs, support.

## Definition of done

Every box in weeks 1–6 checked, plus: you render an episode end-to-end through the browser and the result matches (or exceeds) the current CLI output.
