# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Nova Force** is a superhero animated series concept — YouTube-first, 7-minute episodes grouped into story arcs (~4 episodes per arc, 12 arcs per season, ~48 episodes per season). This repo has two distinct parts:

1. **Roster app** (`src/`) — a React/Vite web app that renders the team roster as character cards, pulling data from `characters/*.json`.
2. **Production pipeline** (`production/`, `scripts/pipeline/`) — Node.js scripts that validate episode manifests and stitch AI-generated scene files into a master video via FFmpeg.

## Commands

```bash
pnpm dev                   # start Vite dev server
pnpm build                 # type-check + Vite production build
pnpm lint                  # ESLint

# Episode pipeline
pnpm pipeline:manifest -- <path/to/script.md>                 # generate manifest.json from script's scene index
pnpm pipeline:manifest -- --dry-run <path/to/script.md>       # preview without writing
pnpm pipeline:generate -- <path/to/manifest.json>             # generate scene videos via Runway API
pnpm pipeline:generate -- --dry-run <path/to/manifest.json>   # preview without API calls
pnpm pipeline:generate -- --force <path/to/manifest.json>     # regenerate even if files exist
pnpm pipeline:validate -- <path/to/manifest.json>
pnpm pipeline:stitch -- <path/to/manifest.json>
pnpm pipeline:stitch -- --reencode <path/to/manifest.json>   # force re-encode for mixed codecs
```

Pipeline scripts run via `tsx` (no build step needed). FFmpeg must be on `PATH` (or set `FFMPEG_PATH`).

## Architecture

### Roster app (`src/`)

- `characterData.ts` — imports all `characters/*.json` files, exports them as the `Character` interface and `CHARACTERS` array (sorted by `rosterNumber`), and maps roster numbers to accent colors.
- `CharacterCard.tsx` — pure display component; receives a `Character`, its accent color, and index. Uses a CSS custom property `--accent` for per-character theming.
- `App.tsx` — maps `CHARACTERS` through `CharacterCard`.

Character data lives in `characters/*.json` (one file per hero). The `Character` interface in `characterData.ts` is the canonical shape — JSON files must match it.

### Production pipeline (`scripts/pipeline/`)

- `manifest.ts` — shared types and validation logic (`validateManifest`).
- `generate-manifest.ts` — CLI: parses a script markdown file's header and scene index table, generates `manifest.json` with scene entries, durations, and generation hints. The script is the source of truth; the manifest is a build artifact.
- `validate-manifest.ts` — CLI: checks manifest JSON shape and whether scene `.mp4` files exist on disk (exit 2 if files missing, exit 1 on schema/parse errors).
- `stitch-episode.ts` — CLI: reads the manifest, builds an FFmpeg concat list, and runs FFmpeg to produce the master `.mp4`.

Episode manifests live under `production/pipeline/examples/` (and future `episodes/`). The schema is at `production/pipeline/schema/episode-manifest.schema.json`.

### Production content (`production/`)

JSON documents that define the show's creative canon: `series-bible.json`, `season-1-beats.json`, `roadmap.json`, `antagonist-bible.json`, and `Season 1/season.json`. These are source-of-truth for story/character decisions — treat locked sections as immutable.

## Single source of truth rule

Each piece of creative data must live in exactly one file. All other files that need to reference it use a pointer string in the form `"See <path> → <field>"`. Never copy values across files.

| Data | Owner |
|---|---|
| Hero attributes (colors, powers, arc, etc.) | `characters/<name>.json` |
| Antagonist attributes (motivation, methods, episodes) | `characters/antagonists/<name>.json` |
| Episode detail (title, focus, brief, tags, structure) | `production/season-1-beats.json` |
| Season structure (acts, episode ranges) | `Season 1/season.json` |
| Henchmen templates, org structure | `production/antagonist-bible.json` |
| World rules, tone, visual language | `production/series-bible.json` |
| Location/environment registry & asset paths | `production/locations.json` |

When adding new data: find the correct owner above and put it there. If another file needs to reference it, add a pointer — do not duplicate the value.

This is enforced automatically: editing any JSON in `production/`, `characters/`, or `Season 1/` triggers `scripts/lint-content.ts` via a PostToolUse hook. Violations are injected as context so they can be fixed immediately.

To add a new checked field to the lint, add an entry to the `CHECKS` array in `scripts/lint-content.ts`.

## Additional rules

**Lock status:** Before editing any section of a production JSON, check its `lockStatus` field. Sections marked `"locked"` require explicit user approval before changes.

**Character JSON shape:** The `Character` interface in `src/characterData.ts` is the contract for all `characters/*.json` files. Update the interface first if adding new fields, then update the JSON files.

**No creative data in TypeScript:** Character display values (colors, names, etc.) belong in `characters/*.json`. `src/characterData.ts` should only contain the interface definition and utility functions, not hardcoded creative values.

**Episode manifest `scriptPath`:** Always points directly to `production/scripts/<slug>.md`. Never use stub or redirect files as intermediaries.

**Manifest generation:** Episode manifests are derived from scripts, not hand-written. Run `pnpm pipeline:manifest -- <script.md>` to regenerate after editing a script's scene index table. Do not manually edit `manifest.json` scene lists.

**Location tracking:** Every environment/location used in scripts must be registered in `production/locations.json`. This is enforced automatically: editing any script in `production/scripts/` triggers `scripts/lint-locations.ts` via a PostToolUse hook, which reports unregistered locations and locations still needing Runway concept board generation. When adding a new location, add it to `locations.json` with `conceptBoard: false` and empty asset path strings. Set `conceptBoard: true` and fill asset paths once the Runway-generated concept board is ready.

**AI video provider:** Runway (Gen-4) is the locked provider for all scene generation. Manifests include `provider: "runway"` in their generation blocks.

**Fully AI-generated production:** All creative assets (video, voice, music, SFX, character designs, concept boards) are AI-generated. No human contractors, voice actors, or freelancers. Voice uses Runway Gen-4.5 TTS/voice cloning. Music uses AI generation (Suno/Udio). Scripts use AI-assisted writing via `/write-script`. Never suggest hiring, commissioning, or outsourcing creative work.

**Episode format:** Each episode targets ~7 minutes runtime with 3–6 scenes. Episodes are grouped into story arcs (~4 episodes per arc). Each arc maps to one original 30-min episode concept. See `Season 1/season.json` for the arc-to-episode mapping and `show.json` for format details.
