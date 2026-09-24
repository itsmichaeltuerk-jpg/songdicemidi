# songdicemidi

Vite + React + TypeScript studio. Dice roll → arrangement → play → MIDI export.
Live site: songdicemidi.vercel.app. Default branch: `main`.
This repo is the web source of truth for Hear / dice / export. Do not port Door routes or rewrite as a dual app.

## Commands

- `npm install`
- `npm test` (vitest)
- `npm run build`
- `npx tsc --noEmit`

Run test + build + tsc before calling a UI task done.

## Layout

- `src/App.tsx` — shell, tabs, golden path
- `src/components/` — DiceTable, Header, transport/mixer, visualizer, export, YouTube, tab editor
- `src/services/` — dice config, arrangers, midi encoder, youtube
- `src/audio/` — Door voices / mixbus / playback helpers. No engine logic changes unless the task says so.
- `src/types/music.ts` — shared types

Do not invent new top-level folders.

## Product rules

- Golden path: ROLL → see arrangement → PLAY → ROLL AGAIN
- Default landing tab is Dice Studio, not YouTube
- Locked dice survive reroll. Unlocked dice change.
- Seed is identity: visible, copyable, synced to URL `?seed=`
- Empty state copy: "Roll the dice to start your song"
- After a roll, section blocks render immediately (Intro / Verse / Chorus / Bridge / Outro)
- Roll Again keeps musical context (locked faces + current vibe). Not a full factory reset.
- Studio look: dark charcoal + amber accent. Mobile is one-handed / hear-first.

## MVP vs experimental

Keep on the main path: dice, seed, arrangement, `audio/` playback, MIDI export.

Hide behind `VITE_EXPERIMENTAL=false` (do not delete):
YouTube arranger, piano tab editor, vocal booth, refinement bar, extra workbench panels.

## Do not

- Change API routes, server handlers, or env unless the task says so
- Commit secrets or API keys
- Push agent work straight to `main` — use a feature branch and a PR
- Mirror Origin/Door follow-ups blindly

## PR

- Branch off `main` (or the branch named in the task)
- Prefer focused diffs in `App.tsx`, `src/components/`, `src/index.css`
- Title like `feat: dice-first UI facelift`
