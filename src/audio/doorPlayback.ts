import { DRUM_MIDI } from './voices.ts';

/** Map songdicemidi drum pieces onto Door GM midi so Hear uses Door kits. */
export const DRUM_PIECE_MIDI: Record<string, number> = {
  kick: DRUM_MIDI.kick,
  snare: DRUM_MIDI.snare,
  hat: DRUM_MIDI.hatClosed,
  open_hat: DRUM_MIDI.hatOpen,
  clap: DRUM_MIDI.clap,
  rim: DRUM_MIDI.rim,
  tom: DRUM_MIDI.snare,
  crash: DRUM_MIDI.crash,
  shaker: DRUM_MIDI.hatClosed,
};

export function drumPieceMidi(piece: string, fallback?: number): number {
  return DRUM_PIECE_MIDI[piece] ?? fallback ?? DRUM_MIDI.hatClosed;
}

export const AI_MISSED_TOAST = 'AI missed — rolled locally';
export const AI_GENERATING_LABEL = 'Landing a take…';

export type ProduceSource = 'ai' | 'local';

export function landProduceOrLocal<T>(
  produced: T | null | undefined,
  localFallback: T | (() => T),
): { arrangement: T; missed: boolean; source: ProduceSource } {
  if (produced) {
    return { arrangement: produced, missed: false, source: 'ai' };
  }
  const local = typeof localFallback === 'function' ? (localFallback as () => T)() : localFallback;
  return { arrangement: local, missed: true, source: 'local' };
}

export const COLLAPSED_LANES = ['melody', 'chords', 'pad', 'bass', 'drums'] as const;
export type CollapsedLane = (typeof COLLAPSED_LANES)[number];
export const COLLAPSED_LANE_H = 28;

export function collapsedNoteTop(midi: number, laneIndex: number, laneH = COLLAPSED_LANE_H): number {
  const pc = ((midi % 12) + 12) % 12;
  const offset = (pc / 12) * (laneH * 0.55);
  return laneIndex * laneH + laneH * 0.7 - offset;
}

export function seekBeatFromClick(xFrac: number, barsTotal: number, beatsPerBar = 4): number {
  const total = Math.max(1, barsTotal) * beatsPerBar;
  const x = Math.max(0, Math.min(0.999, xFrac));
  return x * total;
}
