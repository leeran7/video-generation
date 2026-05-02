# Nova Force MVP — Decisions Log

Decisions made by the user across the MVP build sessions, in roughly chronological order. Each entry captures the call, not the implementation detail.

## Scope & migration

- **Tone the PR down to pages-only.** No Tailwind, no styling, no DB infra. Placeholder detail pages, working login.
- **Remove all Vite remnants** after the Next.js migration (eslint config, `dist/`, deps, docs, the legacy `src/` directory).
- **Trim further: delete every placeholder route.** Keep only `/` and `/login`.
- **Rename `middleware.ts` → `proxy.ts`** per Next 16's deprecation notice.
- **Fix the login bug** where `setLoading(false)` was never called on success (try/finally pattern).

## Styling

- **Restore *some* structural CSS** from the deleted Vite-era `App.css`: theme vars, card grid, accent bar, sections, trait pills.
- **Skip the rest** — no CRT overlays, no animations, no Google Fonts.

## Database

- **Read the home page from the DB** instead of importing JSON directly.
- **Use Drizzle** (final answer after reversing course twice — Drizzle → Supabase-direct → Drizzle).
- **Re-seed characters from JSON** after manually clearing the DB.
- **Schema matches the existing Supabase tables** (full PLATFORM_MVP schema), not a minimal hand-rolled one.

## Home page composition

- **One section per show** on the home page.
- **Heroes and antagonists as separate sub-sections** within each show.
- **Slim the antagonist card** — most antagonist JSON fields aren't useful surfaced. Show: name, affiliation chip, episode chips, role-in-plot. Nothing else.
- **Trim long affiliation strings** to the part before any em-dash qualifier (e.g. The Architect, Echo).
- **Antagonists are always red.** Removed the per-affiliation accent logic — single `ANTAGONIST_ACCENT` constant.
- **Role-in-plot text is not episode-prefixed.** Stripped leading "Episode N:" prefixes from the JSON content.

## Image pipeline

- **Generate headshots for heroes and antagonists** via the image pipeline.
- **Upload each headshot to Supabase Storage** (chosen over alternatives — "supabase first").
- **Save the resulting public URL as `imageUrl`** on each character/antagonist JSON.
- **Keep `designSheet` and `imageUrl` distinct** by purpose: `designSheet` is the local on-disk path used by the production pipeline; `imageUrl` is the public CDN URL used by the web app. Currently they reference the same PNG bytes, just at different storage layers.
- **Run the existing one-off `scripts/backfill-headshots.ts`** to upload pre-existing PNGs, rather than fold the same logic into `generate-images.ts` as a `--upload-only` flag. The script self-deletes per its own header instruction once run.
- **Render images on the home page cards** using a plain `<img>` (no `next/image`, no `next.config.ts` remote-pattern config). Square aspect, full card width, above the body content.

## Conventions reaffirmed

- **No styling work uninvited** — when stripping scope, strip styling too.
- **Decisions are reversible** — Drizzle/Supabase-direct flip-flop was fine; the final call sticks.
- **One-off scripts get deleted** after running, per their own headers.
