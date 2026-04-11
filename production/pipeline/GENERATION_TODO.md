# S1E1 — Generation Pipeline TODO

What remains to go from script → finished episode.

---

## 1. Visual development (blocking everything below)

- [ ] **Pick AI video provider** — Runway, Kling, Veo, Replicate, or other. Decision determines manifest `generation` field schema and batch script implementation.
- [ ] **Character design sheets for Surge** — front/side/¾/back, 2 power states (charged + discharged), 6-expression sheet. Needed for consistent generation across 17 scenes.
- [ ] **Environment concept boards** (minimum 5):
  - [ ] Glasshook Pier — morning coastal light (Scenes 01)
  - [ ] Meridian Central Plaza — glass towers, Spire backdrop (Scenes 02–06)
  - [ ] Parking garage — dim emergency lighting, concrete (Scenes 07, 09)
  - [ ] Lowline neighborhood — older blocks, corner stores, street chairs (Scenes 10–13)
  - [ ] Lattice van / operations center — screens, darkness, coffee rings (Scenes 12, 17)
  - [ ] Fire escape — nighttime city skyline, Spire lighting up (Scenes 15–16)
- [ ] **AI style guide document** — prompt templates, palette hex codes, reference boards, do/don't rules for the chosen provider.
- [ ] **Style proof** — one 60–90 second clip (Scene 01 recommended: Glasshook Pier cold open). Must look right before committing to full generation.

## 2. Manifest enrichment

Once the provider and style are locked:

- [ ] **Expand `generation` blocks** in `manifest.json` — replace `promptSummary` placeholders with full prompts, negative prompts, style refs, aspect ratio, seed values.
- [ ] **Add `provider` and `model` fields** per scene (or as a default at episode level).
- [ ] **Add `imageRef` paths** if using image-to-video workflow (keyframes for character consistency).
- [ ] **Lock resolution/fps/codec** — all scenes must match for `ffmpeg -c copy` stitching. Document in manifest or style guide.

## 3. Build `generate-scenes.ts`

The batch script described in `AI_INTEGRATION.md`:

- [ ] **Implement Runway provider adapter** (Runway Gen-4 API with `RUNWAY_API_TOKEN`).
- [ ] **CLI**: `pnpm pipeline:generate -- <path/to/manifest.json>` with `--dry-run` and `--force` flags.
- [ ] **Idempotent** — skip scenes where the `.mp4` already exists unless `--force`.
- [ ] **Poll/wait** — video APIs take minutes per clip; handle long polls, backoff on rate limits.
- [ ] **Error handling** — exit non-zero on any failure so pipeline doesn't stitch bad episodes.
- [ ] **Auto-update `production/locations.json`** — after generating a concept board or scene, write the asset path back into the matching location entry (`conceptBoardAsset`, `referenceImageAsset`, `runwayStyleRefAsset`) and set `conceptBoard: true`. This closes the loop with `lint-locations.ts` so completed locations stop being flagged.
- [ ] Wire up as `pnpm pipeline:generate` in `package.json`.

## 4. Storyboard / animatic

- [ ] **Timing notes per scene** for generation passes — especially the 7 scenes with dialogue.
- [ ] **Shot breakdown** within longer scenes (Scene 07 is 2:45, Scene 09 is 3:30 — likely need multiple generation passes stitched per scene).
- [ ] **Transition notes** — how scenes connect (hard cut, dissolve, smash cut for Scene 03).

## 5. Audio

- [ ] **Casting & VO** — define budget tier (SAG vs indie); record all dialogue lines.
- [ ] **SFX design**:
  - [ ] Marcus's electricity — two registers (uncontrolled crackle vs controlled hum) per production notes.
  - [ ] Ambient city — sirens, traffic, crowds, battery radio.
  - [ ] Pulse event — pressure feeling, not a traditional explosion sound.
  - [ ] Phone vibrate, text notification sounds.
- [ ] **Music** — temp score or composed sting for:
  - [ ] Cold open / Meridian morning.
  - [ ] Pulse moment.
  - [ ] Parking garage isolation.
  - [ ] Elena wire rescue tension.
  - [ ] Fire escape reflection.
  - [ ] Lattice tag — cold, institutional tone sting.
  - [ ] End card — "the low, clean hum of electricity."

## 6. Assembly & QC

- [ ] Run `pnpm pipeline:validate` — all 17 `.mp4` files present.
- [ ] Run `pnpm pipeline:stitch` — produces `s01e01-signal-lost-master.mp4`.
- [ ] **QC pass**: black frames, flash frames, audio sync, continuity (jacket scorch marks accumulate correctly), on-model character consistency.
- [ ] **Mix**: dialogue + SFX + music → final audio track overlaid on master video.
- [ ] **Captions/subtitles** — SRT file, at least English.
- [ ] **Credits** — aligned with contracts/collaborators.
- [ ] **30-second cutdown** for social/pitch (optional but high leverage).

---

## Pipeline summary

```
script.md                          ← you are here (done)
  ↓ pnpm pipeline:manifest
manifest.json                      ← done (auto-generated)
  ↓ pnpm pipeline:generate         ← TODO: build this
scenes/*.mp4                       ← TODO: generate these
  ↓ pnpm pipeline:validate
  ↓ pnpm pipeline:stitch
s01e01-signal-lost-master.mp4      ← final output
  + audio mix + QC
```
