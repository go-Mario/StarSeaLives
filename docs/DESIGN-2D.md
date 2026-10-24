# Ordinary Lives — 2D Redesign: from a reading quiz to a game

> Method: learn what 2D players love → reverse-engineer the features → conceive → practice, one piece at a time.
> Space is the *differentiator*; fun is the *requirement*. A space skin on a boring loop is still boring.

## 1. What 2D players actually love (reverse-engineered)

| Principle | Seen in | What it means for us |
|---|---|---|
| **The player's mind produces the answer** | Obra Dinn, Case of the Golden Idol | You form a hypothesis from evidence; the game confirms *your* reasoning. The joy is "I worked it out," not "I clicked the right option." |
| **Clues are tangible & cross-referenceable** | Obra Dinn, Outer Wilds | A fact in one record links to a fact in another. Spotting the link yourself is the payoff. |
| **Immediate, earned feedback ("juice")** | Celeste, Hades, Dead Cells | Every correct action gets sound + motion + light. The confirmation *feels* like the mechanic. |
| **The verb is the fiction** | Papers Please (inspect), Obra Dinn (freeze a moment) | The core action *is* the job, not a menu in front of it. |
| **Escalating stakes / a reason to continue** | FTL, Into the Breach, Slay the Spire | Each solved piece raises tension or opens new ground. |
| **Discovery & surprise** | Outer Wilds, Vampire Survivors | Learning one fact recontextualizes the world. |
| **Mastery / flow** | Celeste, Cuphead | You get measurably better; the challenge respects you. |

## 2. Honest diagnosis of the current build

The writing is genuinely strong (see content.js) — but the *game* is a **reading-comprehension quiz**:

- Every act: read 2 records → pick 1 of 3 pre-written inferences → continue.
- The "correct" inference is chosen by data, not by the player's reasoning. A lucky guess feels identical to insight.
- Clues are read as prose, never *manipulated or connected*.
- Confirmation is a stamp, but it doesn't confirm any *reasoning*.
- The verb ("read, then pick") is not a satisfying, job-like action.
- Act 0 even reads like a to-do list ("还差 1 份材料 / 完成本幕调查 / 检索站内记录").

Result: the story can't land because nothing the player *does* is fun. Presence is low (static rooms, basic synth), so good prose floats in an empty room.

## 3. The redesign: deduction as the player's own connection, space-forward

**Core verb: LINK THE RECORDS.** The station keeps everything in logs — hatch codes, berth numbers, timestamps, signal delays, batch counts. The player's job is to find the thread that ties two records together and *physically connect it*. That connection is the deduction. It is:
- **Reasoning** — the player spots the shared fact (M-13, 03:17:20, Berth Nine, thirteen, the signal delay).
- **Tangible & spatial** — you drag/tap a token in one record onto its match in another.
- **Space-native** — the tokens ARE station/orbital data; "signal delay" and orbital timing become real mechanics, not flavor text.
- **Juicy** — the correct link draws a line, the records lock, a resolving chime plays, the reveal unlocks.
- **Escalating** — later acts chain more links, add distractors, and use light-delay/orbit timing so connections require actual thought.

The archive search (act 0) is already a weak version of this (type the shared code). We promote it to the signature interaction and generalize it.

**Stakes & agency stay:** after the link, the human choice (a/b) and its ripple across the 50 years remain the emotional spine. We stop gating the story behind homework — reading is discovery, deduction is a satisfying connect, the choice is the heart.

## 4. Phased plan (build bit by bit, test each phase)

- **Phase 1 (this pass) — make the deduction feel like connecting evidence, and give the world air.**
  - Reframe the deduction as *evidence → meaning*: an evidence chip (what the records show) sits above the conclusions; confirming is framed as linking them.
  - Juice the confirmation: a distinct "insight" chord, the evidence chip links to the chosen conclusion, the stamp lands, others recede.
  - Richer audio presence: reverb/depth, a low station "air" hum, a sparse emotional motif so moments land.
- **Phase 2 — the real LINK mechanic.** Tangible tokens in records; connect the true pair; wrong links are soft "not quite," no punishment. Correct link → reveal. Replaces the MCQ where data allows.
- **Phase 3 — variety & space mechanics.** Different verbs per act (align a timeline, triangulate a signal with light-delay, reassemble a route), escalating chains, so six acts never feel identical.
- **Phase 4 — presence.** Living scenes (light breath, idle character, environmental motion), more expressive portraits, scene reactions to your deductions.
- **Phase 5 — juice pass.** Screen response, transitions, and sound on *every* action, tuned to game-feel.

Each phase: `tools/build.py` → full `lives-browser.js` + `audit.js` green → commit → push.
