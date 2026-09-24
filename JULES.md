# Jules task: dice-first UI facelift

Closes #2.

SongDiceMIDI already has roll, seed, and arrangement. Make it feel like a real product: one clear workflow, dice-first UI, facelift for songdicemidi.vercel.app.

No API changes. No server changes. No env changes.

## Golden path

ROLL -> SEE ARRANGEMENT -> PLAY -> ROLL AGAIN

- Single hero action: ROLL
- After roll, arrangement blocks render immediately: Intro / Verse / Chorus / Bridge / Outro
- Roll Again keeps musical context (locked dice stay, not a full reset)
- Empty state: "Roll the dice to start your song"
- Default landing tab is Dice Studio, not YouTube

## Dice-first UI

- Large tactile dice built for mobile tapping
- Tap a die to lock; re-roll keeps locked faces
- Seed visible, copyable, synced to URL `?seed=` so a roll is shareable
- Live arrangement visualizer: blocks build left-to-right as you roll
- Studio dark theme: charcoal + accent so the audio visualizer pops
- One-handed Android: thumb-reachable controls, no required scroll for the golden path

## MVP focus

Keep: dice logic, seed determinism, arrangement, `audio/` playback, MIDI export.

Hide non-MVP panels (YouTube arranger, tab editor, vocal booth, refinement, extra workbench) behind `VITE_EXPERIMENTAL=false`. Do not delete them.

## Files

- `src/App.tsx` — golden path
- `src/components/` — dice, arrangement, controls facelift
- `src/index.css` — studio theme + mobile polish
- `src/audio/` — no logic change

## Test

1. Open preview
2. Tap ROLL — arrangement appears instantly
3. ROLL AGAIN x3 — coherent, not a full reset
4. Lock a die → re-roll → locked die stays
5. URL `?seed=` opens the same song in a clean session
6. Download .mid plays in a generic player
