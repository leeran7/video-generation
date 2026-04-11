# Nova Force — Next Steps (checklist)

**How to use:** Mark tasks with `[x]` when **completed**; leave `[ ]` when **pending**. In GitHub, VS Code, Obsidian, and many editors you can click the box to toggle.

**Current focus:** **§3 — Visual development & style proof** (design sheets, AI style guide, 60–90s style proof).

**IP note:** Formal **IP registration / locking the IP** (copyright filings, registering the show name and characters as formal assets) is **intentionally deferred** — do not treat those items as blocked work. Revisit **before** wide public release or buyer pitch. See **§2**.

Canonical story data lives in `show.json`, `Season 1/season.json`, `characters/*.json`, **`production/series-bible.json`**, **`production/antagonist-bible.json`**, and **`production/season-1-beats.json`**. Update this file when steps are finished or scope changes.

---

## 1. Show bible & series foundation (do this first)

### Done when

- [x] A single **master bible** (PDF or structured doc) exists that a stranger could use to write or produce without asking you clarifying questions.
- [x] Every rule in it is labeled **locked** vs **draft** so downstream work does not guess.
- [x] The bible explicitly references **Meridian City**, **Nova Force** roster order, and **Season 1** three-act structure from `Season 1/season.json`.
- [x] Antagonist layer exists: **The Architect** + episodic roster + **henchmen templates** (`production/antagonist-bible.json`).
- [x] **12 episode beat sheets** exist (`production/season-1-beats.json`) with act breaks, scene lists, and cliffhangers aligned to `Season 1/season.json`.

### Tasks

#### 1a — Series bible (target: 25–40 pages total or equivalent sections) — **done** (`production/series-bible.json`)

- [x] Logline, tone, audience, comparable shows (for pitch decks only — not on-screen text).
- [x] **World rules:** how powers work, what the public knows, tech level, law enforcement vs heroes.
- [x] **The shadow organization:** name, hierarchy slots (even if some names are TBD), goals, how they recruit/attack.
- [x] **Meridian City:** districts, landmarks, where the team sleeps/hides vs public life.
- [x] **Visual language:** color keys per hero (tie to `signatureColor` in character JSON), aspect ratio, pacing notes for AI animation.

#### 1b — Per-hero bibles (target: ~10 pages each × 5 heroes)

- [x] **Surge** — voice guide, season arc beat sheet, relationships matrix, **powers spec** (limits, failure modes, cost, never on screen).
- [x] **Wraith** — same set of sub-bible items.
- [x] **Titan** — same set of sub-bible items.
- [x] **Glitch** — same set of sub-bible items.
- [x] **Solace** — same set of sub-bible items.

#### 1c — Antagonist bible — **done** (`production/antagonist-bible.json`)

- [x] **The Architect** — full profile aligned with `Season 1/season.json` (motivation, reveal episode, no contradictions with finale).
- [x] **Episodic threat roster (planning minimum):** document **at least 8 named antagonist figures** for Season 1 (mix of one-off operatives, controlled villains, and org leadership), each with: visual hook, role in plot, which episode(s) they appear in, and defeat/escape outcome.
- [x] Henchmen/squad templates so episodes 6+ do not invent generic mooks without rules.

#### 1d — Season 1 beat document — **done** (`production/season-1-beats.json`)

- [x] **12 episodes:** for each episode in `Season 1/season.json`, add a **1–2 page beat sheet** (scene list, act breaks, cliffhanger) — must match `title`, `focus`, and `full_brief` already defined.
- [x] Cross-check **characters_featured** vs cast workload (no hero in a scene without a story reason).

---

## 2. IP protection & legal readiness

> **Deferred — formal IP lock:** Do **not** complete copyright registration, show/character name registration, or other **formal IP lock** steps until you deliberately start that phase. Items marked **(deferred)** below stay **pending** by choice; uncheck or leave `[ ]` until you activate them.

### Done when

- [ ] ⏸ **(deferred)** Copyright registration (or your counsel’s equivalent recommendation) is **filed or scheduled** for: show title, bible, and character pack — **skip until you activate §2b**.
- [ ] ~~Work-for-hire / collaboration templates~~ — N/A (fully AI-generated production).
- [ ] A simple **IP log** exists (spreadsheet is fine): asset name, creator, date, rights status.

### Tasks

#### 2a — Can do before formal IP lock (recommended)

- [ ] Store **source files** and **dated exports** of bibles and design sheets in a locked folder or repo tag.
- [ ] Start a simple **IP log** spreadsheet (tracks what exists, generation tool used, date — does not require registration).

#### 2b — Deferred — formal IP lock (do when you choose to activate)

- [ ] ⏸ **(deferred)** Copyright registration (or counsel’s equivalent) **filed or scheduled** for show title, bible, and character pack.
- [ ] ⏸ **(deferred)** Register **Nova Force** and core character names as advised.

---

## 3. Visual development & style proof

### Done when

- [ ] Every hero has **locked design sheets** usable for animation and licensing.
- [ ] An **AI style guide** doc exists (prompts, do/don’t, palette hex codes, reference boards).
- [ ] A **60–90 second style proof** is finished: readable story beat, on-model characters, representative lighting/action.

### Tasks

- [ ] **Character design sheets (5 heroes)**
  - [ ] Per hero: front, side, ¾, back (where needed), **minimum 2 power states** (e.g., Surge charged, Titan absorbing).
  - [ ] **Neutral + expression sheet** (at least 6 expressions per hero for dialogue scenes).
  - [ ] **Silhouette pass** — black fills only; must read at small size (merchandise rule).
- [ ] **Antagonist / org visual kit**
  - [ ] The Architect: design locked **before** episode 9 proof materials.
  - [ ] **Generic org operative** + **elite operative** designs (for repeated use).
- [ ] **Environment concepts (3–5 boards minimum)**
  - [ ] Meridian skyline, a street-level hero location, org/villain interior, Glitch-safehouse or equivalent, finale rooftop or set piece from episode 12 brief.
- [ ] **Pipeline lock**
  - [ ] Choose tools (e.g., concept vs animation) and document **export settings**, frame rate, resolution, and naming convention.
  - [ ] **Character animation file standards:** folder per hero with `design_sheet/`, `turnaround/`, `expressions/`, `power_states/`; same for recurring villains once designed.
- [ ] **Style proof shot list (suggested)**
  - [ ] Cold open establishing shot → hero close-up → power beat → emotional beat → logo/title card sting (if applicable).

---

## 4. Pilot production — Episode 1 (“Signal Lost”)

### Done when

- [ ] A **single exported pilot file** (video) runs from opening to credits with **final** or **near-final** audio and no placeholder title cards unless intentional.
- [ ] Script + storyboard + asset list are **versioned** and match the locked cut.

### Tasks

- [x] **Script:** full screenplay for episode 1 only — scene headings, dialogue, SFX cues; align to `Season 1/season.json` episode 1 `full_brief`. → `production/scripts/s01e01-signal-lost.md` (17 scenes, 30 min)
- [ ] **Storyboard / animatic:** every scene; timing notes for AI generation passes.
- [ ] **Voice generation:** create AI voice profiles for all characters using Runway Gen-4.5 TTS / voice cloning.
- [ ] **Animation generation:** scene-by-scene passes using locked models and style guide; **QC pass** for on-model continuity.
- [ ] **Audio:** temp score OK for internal cuts; **final pilot** needs **mixed** dialogue, SFX, and music bed (or composed sting).
- [ ] **Pilot deliverables checklist**
  - [ ] Master video file(s) + **captions/subtitle file** (even if English only).
  - [ ] **Credits list** aligned with contracts.
  - [ ] **30-second cutdown** for social/pitch (optional but high leverage).

---

## 5. Distribution, audience & monetization strategy

### Done when

- [ ] A **one-page strategy** states primary path: **YouTube-first** vs **pitch-to-streamers-first** vs **hybrid**, with rationale.
- [ ] You have a **timeline** for: pilot drop OR private pitch, and next milestone after that.
- [ ] **Merch/licensing** has a first pass: which SKUs, which character order for reveals.

### Tasks

- [ ] Write **platform decision** with pros/cons (audience ownership, risk, money, creative control).
- [ ] **If public-first:** content calendar for teasers, BTS, character reels (minimum **6 planned posts** through launch window).
- [ ] **If pitch-first:** list **target buyers** (e.g., Netflix Animation, CN, Amazon Kids+, Apple TV+), materials each requires, and submission rules.
- [ ] **Licensing:** list 5–10 potential categories (plush, apparel, pins) and **which hero leads** for wave 1.
- [ ] **Funding:** Patreon / ads / brand deals — pick **one primary** near-term model to test.

---

## 6. Merchandise-ready design (signature silhouette & accessory)

### Done when

- [ ] Each hero has documented: **signature color**, **silhouette readability**, **one iconic accessory or prop** suitable for product.
- [ ] Style guide includes **“do not crop”** rules for faces/logos on mock product templates.

### Tasks

- [ ] Per hero, add to bible or appendix: **plush test** (simplify to 3 shapes), **apparel test** (one graphic that works on black and white tee).
- [ ] **Villain SKUs (optional wave 2):** The Architect iconography only after reveal materials are locked.

---

## 7. Season 1 full production (after pilot + pipeline proven)

### Done when

- [ ] **12 scripts** exist at production quality (not outline-only).
- [ ] **Repeatable pipeline doc** shows how one episode moves from script → boards → VO → animation → mix in **measurable hours/steps**.
- [ ] **Release cadence** is chosen (e.g., weekly) and at least **episode 1–4** can hit that cadence on a dry run.
- [ ] **Finale (episode 12)** has a dedicated **event plan** (launch tactic, not just “finish file”).

### Tasks

- [ ] **AI-assisted scripting:** use `/write-script` command to generate episode scripts from beat sheets.
- [ ] **Per-episode production pack (template)** — duplicate for episodes 2–12:
  - [ ] Script + revision table.
  - [ ] Storyboard PDF + animatic.
  - [ ] **Cast sheet** (who speaks; guest antagonists).
  - [ ] **Asset list:** backgrounds, props, **new character/villain designs** that episode.
  - [ ] **Animation batch list** (scene IDs) + QC sign-off.
  - [ ] Audio session log + final mix export.
- [ ] **Villains & guest cast by episode (planning targets — adjust to scripts)**
  - [ ] Episodes **1–4:** seed org + **minimum 1 unique threat or operative** where the brief implies action (not only abstract “pulse”).
  - [ ] Episode **5:** **at least 1 named episodic villain** (per brief: escapes; may return later).
  - [ ] Episodes **6–8:** org pressure + character focus; **minimum 2 distinct combat/chase set pieces** across the arc (split across eps).
  - [ ] Episode **9:** **The Architect** reveal package (design, VO, music motif locked).
  - [ ] Episodes **10–12:** **finale escalation** — asset list for city-scale stakes + final battle variants.
- [ ] **Character animation library growth**
  - [ ] After pilot: add **run/walk cycles** or **loopable motion clips** per hero as pipeline allows (reduces generation entropy later).
  - [ ] **Org vehicles / tech** — design once, reuse (drones, vans, etc.).
- [ ] **Music:** AI-generate **main theme** + **Architect motif** + **hero sting** library using Suno/Udio for recurring use.
- [ ] **Season finale “cultural moment” plan**
  - [ ] Define **one** intended water-cooler beat (scene, line, or twist); storyboard emphasis and marketing hook.

---

## 8. North-star milestone (18-month horizon)

### Done when

- [ ] **12 episodes** released or delivered per your strategy.
- [ ] **Audience metric** chosen and tracked (subs, views, email list, etc.) with a baseline and a goal.
- [ ] **One standout moment** from the season is documented and used in **sizzle / year-one recap**.

### Tasks

- [ ] Set **numeric goal** for audience (realistic tier + stretch tier).
- [ ] Plan **post-season** asset: best-of trailer, character polls, commentary track, or behind-the-scenes to retain fans between seasons.

---

## 9. Season 1 non-negotiables — what must exist to call the season “done”

Sections 1–8 include strategy and creative work. This section lists **gaps that are easy to skip** but **block a real Season 1 finish** if they are missing. Expand these alongside Section 7.

> **IP note:** §9.D includes chain-of-title and E&O — separate from **§2 deferred registration**; you can still track releases and music docs without “locking” formal IP filings.

### A. Creative lock chain (prevents rework cascades)

#### Done when

- [ ] Every episode has explicit **locks**: script → boards/animatic → picture → sound (dates or version IDs in a single table).
- [ ] **Recurring assets** (heroes, org kit, key locations) are **frozen** after an agreed episode unless a **written exception** lists what changed and why.

#### Tasks

- [ ] Maintain a **one-page lock schedule** (spreadsheet): episode, script version, board lock date, final master filename.
- [ ] **Dependency chart** for Season 1: e.g. **The Architect** voice + design + motif cannot be final in marketing before Episode 9 materials; Episodes **10–12** must follow **Episode 10** fallout in continuity.
- [ ] **Retcon rule:** no beat may contradict `Season 1/season.json` without updating that file and the bible.

### B. Audio for all 12 episodes (not only the pilot)

#### Done when

- [ ] Each episode has a **final mix** (dialogue + music + SFX) that passes your **loudness/peak** rules.
- [ ] **Every music cue** is accounted for: AI-generated or royalty-free with **documentation** stored next to masters.

#### Tasks

- [ ] Define **mix spec** (e.g. integrated loudness target for web delivery, true peak ceiling, stereo vs 5.1 if ever needed).
- [ ] **Season-wide music strategy:** main theme, Architect motif, hero stingers — **cue list** or spreadsheet with **source + AI generation tool** per cue.
- [ ] **Voice regeneration plan:** schedule for missed lines after animatic; **re-generation decision tree** (re-render vs dialogue overlay) if sync fails.
- [ ] **Room tone / ambience** library for Meridian exteriors/interiors — AI-generated or sourced from royalty-free libraries.

### C. Post-production masters & QC (every episode)

#### Done when

- [ ] **Master file** per episode (naming convention + version) exists; **caption/subtitle** file exists for each (at least English).
- [ ] A **QC checklist** is signed off per episode (one owner).

#### Tasks

- [ ] **Deliverable matrix:** resolution, frame rate, codec, filename pattern (e.g. `NovaForce_S01E01_master_v002.mov`).
- [ ] **Subtitles/captions:** SRT or platform-native; **forced narrative** for important off-screen lines.
- [ ] **QC pass** (minimum): black frames, flash frames, audio clicks/pops, L/R balance, misspelled on-screen text, obvious continuity breaks (wrong costume, wrong injury).
- [ ] **End credits** master: one template; **per-episode credit deltas** for guest cast/music; legal lines (©, TM) consistent.

### D. Legal & chain of title (distribution-ready)

#### Done when

- [ ] **AI tool licenses** documented: which tools generated which assets, terms of use for commercial output.
- [ ] **Music:** AI-generated music terms documented; confirm commercial use rights from generation platform.
- [ ] A **chain-of-title folder** exists for buyer/partner due diligence (even if you self-publish).

#### Tasks

- [ ] **AI platform commercial licenses** verified for all tools used (Runway, Suno/Udio, image generators).
- [ ] **Content rating / audience** decision (e.g. TV-Y7 vs teen) — affects writing, platform eligibility, and marketing.

### E. Continuity & story accountability across 12 episodes

#### Done when

- [ ] A **continuity log** tracks series state episode-to-episode (who knows what, injuries, relationships, org exposure).
- [ ] **Architect** presence is **absent or obscured** before Episode 9 per your mystery plan (no accidental spoilers in eps 1–8).

#### Tasks

- [ ] Single **Continuity sheet** columns: episode, day/night timeline if relevant, team roster present, secret knowledge, physical consequences.
- [ ] **Villain/operative roster** tied to scenes: which named antagonists appear where (supports Section 1 and Section 7).

### F. Operations, backups, and failure margin

#### Done when

- [ ] Final masters and **project/source** files for each episode live in **two independent storage locations**.
- [ ] Pipeline assumes **some** AI/regeneration failure — time is reserved in the schedule.

#### Tasks

- [ ] **Backup policy:** what is backed up daily vs on lock; **restore test** once.
- [ ] **Contingency:** e.g. reserve **15–25%** of animation time per episode for **re-generation and QC fixes** (tune after pilot).
- [ ] **Archive policy:** how long you keep intermediate exports (3 months vs forever).

### G. Minimum production counts (define after pilot — but must be defined)

These are **not** optional once you leave the pilot; they prevent mid-season stalls.

#### Done when

- [ ] Post-pilot, you have a **written range** for: **unique backgrounds per episode**, **new character designs per episode**, **new props**, based on Episode 1 actuals.

#### Tasks

- [ ] After pilot lock: **count** BG plates, unique locations, crowd shots — use as baseline for eps 2–12 budgeting.
- [ ] **Org asset reuse plan:** minimum kit (van, drone, uniform, logo) locked before **Episode 6** (full team episode).
- [ ] **Crowd / generic civilian** approach (stock, simplified design, or off-screen) — decide before mass city scenes in 10–12.

---

## Quick reference — source files

| File | Purpose |
|------|---------|
| `show.json` | Show title, format, runtime, setting |
| `Season 1/season.json` | Episodes, acts, villain, briefs |
| `characters/*.json` | Hero canon + powers/role/colors |
| `production/series-bible.json` | Series bible — world, org, Meridian, visual language |
| `production/antagonist-bible.json` | The Architect, episodic roster, henchmen templates |
| `production/season-1-beats.json` | 12 episode beat sheets (acts, scenes, cliffhangers) |
| `production/roadmap.json` | Phases and executive notes |
