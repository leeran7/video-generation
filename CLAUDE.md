# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Nova Force** is a superhero animated series concept. This repo has two distinct parts:

1. **Roster app** (`src/`) — a React/Vite web app that renders the team roster as character cards, pulling data from `characters/*.json`.
2. **Production pipeline** (`production/`, `scripts/pipeline/`) — Node.js scripts that validate episode manifests and stitch AI-generated scene files into a master video via FFmpeg.

## Commands

```bash
pnpm dev                   # start Vite dev server
pnpm build                 # type-check + Vite production build
pnpm lint                  # ESLint

# Episode pipeline
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

- `manifest.ts` — shared validation logic (`validateManifest`).
- `validate-manifest.ts` — CLI: checks manifest JSON shape and whether scene `.mp4` files exist on disk (exit 2 if files missing, exit 1 on schema/parse errors).
- `stitch-episode.ts` — CLI: reads the manifest, builds an FFmpeg concat list, and runs FFmpeg to produce the master `.mp4`.

Episode manifests live under `production/pipeline/examples/` (and future `episodes/`). The schema is at `production/pipeline/schema/episode-manifest.schema.json`.

### Production content (`production/`)

JSON documents that define the show's creative canon: `series-bible.json`, `season-1-beats.json`, `roadmap.json`, `antagonist-bible.json`, and `Season 1/season.json`. These are source-of-truth for story/character decisions — treat locked sections as immutable.
