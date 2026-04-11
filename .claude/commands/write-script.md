---
description: Write a full Nova Force episode script. Usage: /write-script s01e02 or /write-script s01e02 "Episode Title"
argument-hint: <episode-id> [episode-title]
allowed-tools: [Read, Glob, Grep, Write]
---

# Nova Force — Episode Script Writer

You are writing a production-quality script for the Nova Force animated series. Follow every instruction below precisely before writing a single line of script.

## Arguments

The user invoked this command with: $ARGUMENTS

Parse $ARGUMENTS to extract:
- **episode-id**: e.g. `s01e02` — identifies the season and episode number
- **episode-title** (optional): override or confirm the episode title

If episode-id is missing, ask the user for it before proceeding.

---

## Step 1 — Load repo config (READ ALL OF THESE)

Before writing anything, read the following files in order:

1. **`production/season-1-beats.json`** — find the beat entry matching the episode's story arc. Extract:
   - `title`, `focus`, `fullBrief`, `charactersFeatured`, `antagonistRefs`
   - `structure` (cold open, actOne, actTwo, actThree, tag beats and approximate minute ranges)
   - `split` metadata — check which episode within the arc you are writing and which scenes/beats belong to it
   - `document.runtimeAssumptionMinutes` — **this is the hard runtime target** (currently 7 min)
   - `document.structureNotes` — format constraint

2. **`characters/<name>.json`** for each name in `charactersFeatured` and `antagonistRefs`. Extract:
   - `displayName`, `alias`, `age`, `powersSpec` (costs, limits, visual language)
   - `characterArc`, `voiceAndDialogue`, `wardrobeAndDesign`

3. **`production/antagonist-bible.json`** — if any `antagonistRefs` are present, read the relevant entries.

4. **`production/series-bible.json`** — read:
   - `pitch.tone`
   - `worldRules` (power rules, public knowledge, tech level, legal status)
   - `meridianCity.districts` — for location grounding
   - `visualLanguage` if present

5. **`Season 1/season.json`** — confirm episode slot, story arc, and season arc position.

6. **`production/scripts/s01e01-the-pulse.md`** — read as the format reference for the 7-min episode format. Match its:
   - Header block (written-from, status, runtime target, hero focus, antagonist ref)
   - Cast section format
   - Production notes section
   - Scene header format (### SCENE NN — EXT./INT. LOCATION — TIME)
   - Timestamp notation `*(MM:SS – MM:SS)*`
   - Dialogue formatting
   - Scene index table at the end

---

## Step 2 — Validate runtime before writing

The `runtimeAssumptionMinutes` is a hard constraint (~7 minutes). Plan the scene count and timing before writing:

- A 7-minute episode needs approximately **3–6 scenes** at 1–2.5 minutes each.
- Each episode is one segment of a larger story arc (~4 episodes per arc). The episode should have a clear internal arc (setup → escalation → hook/cliffhanger) while serving the larger arc narrative.
- Use the beat document's `split` metadata to determine which scenes/beats belong to this episode.
- Budget the longest scene (2–2.5 min) for the emotional anchor. Keep transitions tight (0:45–1:00).
- Each episode should end on a strong hook that pulls the viewer into the next episode.

Write out the scene plan (scene number, title, location, estimated runtime) as a brief outline before drafting the script. This is your internal check — if the outline doesn't add up to ~7 minutes, adjust before writing.

---

## Step 3 — Apply series canon (non-negotiable rules)

These come from `series-bible.json → worldRules` and are locked:

- **Every power use has a visible cost.** Reference the character's `powersSpec.costs` exactly — do not invent new costs or remove existing ones.
- **No omniscience.** Lattice/antagonists work through procedure, not magic surveillance. Show the human steps.
- **Humor is a defense mechanism, not a default mode.** Characters joke when stakes get personal. The show does not quip its way through danger.
- **Meridian is a real city with real neighborhoods.** Ground scenes in specific districts. Use `meridianCity.districts` from the bible.
- **Powers do not replace personality.** Fear, shame, and love still drive choices. A character who has powers still makes human mistakes.
- **Legal exposure is story fuel.** Nova Force is not a registered agency. Public power use creates real consequences.

---

## Step 4 — Apply script format rules

Match the s01e01 format exactly:

- **Header block**: `# NOVA FORCE`, then `## Season N, Episode N — "Title"`, then the metadata fields.
- **Cast section**: one line per character, dash-separated, with brief physical/personality descriptor.
- **Production notes**: visual language, location aesthetics, sound design. Pull from the character's `powersSpec.visualLanguage` and the series bible.
- **Act headers**: `# COLD OPEN`, `# ACT I — [TITLE]`, etc. on their own lines with horizontal rules.
- **Scene headers**: `### SCENE NN — EXT./INT. LOCATION — TIME OF DAY` followed by `*(MM:SS – MM:SS)*`
- **Action lines**: prose paragraphs. No camera directions. Describe what the viewer sees, hears, and feels.
- **Dialogue**: character name in bold on its own line, stage direction in italics in parentheses if needed, then the line.
- **Scene index table**: at the end, with columns: Scene ID, Title, Location, Approx. Runtime, Characters.

---

## Step 5 — Write the script

Write the complete script. Do not summarize or abbreviate scenes. Every scene must be fully written out with:
- At least 2–3 paragraphs of action/description
- All dialogue written in full (no "[Marcus and Titan argue about X]" — write the actual lines)
- A clear beginning, middle, and end within the scene
- The emotional beat the scene is meant to land (reference the beat document)

Scenes that the beat document marks as emotional anchors must be the longest and most developed. Do not rush the landing moments.

Write the scene index table at the end once the full script is done.

---

## Output

Write the complete script directly to `production/scripts/<episode-id>-<slug>.md` using the Write tool.

Use the episode title to derive the slug (lowercase, hyphens, e.g. `s01e02-the-aftermath`).

After writing, confirm:
- The scene index runtime totals approximately `runtimeAssumptionMinutes` minutes
- Every featured character's power cost was shown at least once if they used powers
- The antagonist presence matches the beat document's description
- The final image of the episode matches the beat document's final beat
