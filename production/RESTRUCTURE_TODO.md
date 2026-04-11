# Season 1 Restructure: 12×30min → ~48×7min YouTube episodes

## Done
- [x] Update `show.json` — 7-min format, story arcs concept
- [x] Update `Season 1/season.json` — arc structure, format block, new episode numbering

## Remaining
- [x] Update `production/season-1-beats.json` — runtimeAssumptionMinutes 30→7, add `split` metadata to all 12 entries
- [x] Update `production/series-bible.json` — change "episodes" to "arcs" in pacingNotes (locked field)
- [x] Update `production/roadmap.json` — "12 episodes" → "12 story arcs (~48 episodes)"
- [x] Split S1E01 script into 4 files (scenes 1–6, 7–9, 10–12, 13–17)
- [x] Mark original `s01e01-signal-lost.md` as split
- [x] Update `CLAUDE.md` — add 7-min format rule
- [x] Update `.claude/commands/write-script.md` — runtime 30→7, scenes 18–22→3–6
- [x] Regenerate manifests for 4 new scripts
- [x] Verify: dry-run manifest + generate, pnpm build
