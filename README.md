# Nova Force

Nova Force is a YouTube-first AI-animated superhero series. This repo holds the show's creative canon, the page-level UI for the production platform, and the CLI pipeline that turns scripts into rendered episodes.

## Stack

- **Web app:** Next.js 16 (App Router), React 19, TypeScript.
- **Auth:** Supabase (sign-in + middleware redirect).
- **Pipeline:** Node scripts run via `tsx`; FFmpeg for stitching.

## Package manager

This project uses [pnpm](https://pnpm.io/) only (`packageManager` is set in `package.json`).

```bash
pnpm install
pnpm dev      # Next.js dev server
pnpm build    # Next.js production build
pnpm lint     # ESLint via next lint
```

## Episode pipeline

Script → scene videos → stitch. See [`production/pipeline/README.md`](production/pipeline/README.md) and [`production/pipeline/AI_INTEGRATION.md`](production/pipeline/AI_INTEGRATION.md). Common commands:

```bash
pnpm pipeline:manifest -- <script.md>
pnpm pipeline:validate -- <manifest.json>
pnpm pipeline:generate -- <manifest.json>
pnpm pipeline:stitch   -- <manifest.json>
```

FFmpeg must be on `PATH` (or set `FFMPEG_PATH`).

## Project layout

See [`CLAUDE.md`](CLAUDE.md) for the architecture overview, single-source-of-truth rules, and contribution conventions.
