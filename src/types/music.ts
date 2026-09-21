export interface DieFace {
  id: string;
  label: string;
  sublabel?: string;
  description: string;
  value: string;
  tag?: string;
}

export type DieCategory =
  | 'key_mode'
  | 'tempo_feel'
  | 'structure'
  | 'chords'
  | 'chord_rhythm'
  | 'bass'
  | 'drums'
  | 'melody_contour'
  | 'energy'
  | 'genre_vibe'
  | 'time_sig'
  | 'density'
  | 'hook_type';

export interface DieConfig {
  id: DieCategory;
  name: string;
  shortName: string;
  iconName: string;
  color: string;
  isLocked: boolean;
  selectedFaceIndex: number;
  faces: DieFace[];
  isOptional?: boolean;
  enabled?: boolean;
}

export interface ChordEvent {
  bar: number; // 1-indexed
  beat: number; // 1-indexed (e.g. 1, 2, 2.5, 3)
  chord: string; // e.g. "Am", "Fmaj7", "C/E", "G7"
  roman: string; // e.g. "i", "VI", "I", "V"
  duration_beats: number; // e.g. 4, 2, 1
  inversion?: string; // "root", "1st", "2nd"
  voicing?: string; // "close", "open", "drop-2", "spread"
  notes: string[]; // e.g. ["A3", "C4", "E4"]
  velocity?: number; // 0-127
}

export interface MelodyEvent {
  bar: number;
  beat: number;
  note: string; // e.g. "E4", "G4", "A4"
  midi: number; // MIDI note number 0-127 (e.g. 64)
  duration_beats: number; // e.g. 0.5, 1, 2
  lyric_placeholder?: string; // e.g. "oh", "take me", "stay"
  velocity?: number;
}

export interface BassEvent {
  bar: number;
  beat: number;
  note: string; // e.g. "A1", "F2", "C2"
  midi: number;
  duration_beats: number;
  velocity?: number;
  articulation?: 'sustain' | 'staccato' | 'slide' | 'ghost';
}

export interface DrumEvent {
  bar: number;
  beat: number;
  piece: 'kick' | 'snare' | 'hat' | 'open_hat' | 'clap' | 'rim' | 'tom' | 'crash' | 'shaker';
  velocity: number;
  midi_note?: number; // GM Drum note e.g. 36 for kick
}

export interface PadEvent {
  bar: number;
  beat: number;
  notes: string[];
  midi_notes: number[];
  duration_beats: number;
  velocity: number;
}

export interface SongArrangement {
  id: string;
  seedCode: string;
  createdAt: number;
  title_working: string;
  logline: string;
  key: string; // e.g. "A minor"
  mode: string; // e.g. "Aeolian"
  bpm: number;
  time_signature: string; // "4/4", "3/4", "6/8"
  swing: number; // 0.0 - 0.3
  form: string[]; // ["Intro 4", "Verse 8", "Chorus 8", "Outro 4"]
  bars_total: number;
  chords: ChordEvent[];
  melody: MelodyEvent[];
  bass: BassEvent[];
  drums: DrumEvent[];
  pad: PadEvent[];
  arrangement_notes: string;
  hook_reason: string;
  next_moves: string[];
  producer_brief?: string;
  sourceType: 'dice_roll' | 'chord_tab' | 'refinement';
  sourceTab?: string;
}

export interface TrackMixerChannel {
  id: 'melody' | 'chords' | 'pad' | 'bass' | 'drums';
  name: string;
  icon?: string;
  volume: number; // 0.0 to 1.2
  pan: number; // -1.0 (left) to 1.0 (right)
  mute: boolean;
  muted?: boolean;
  solo: boolean;
  color: string;
}


export interface VibeModifiers {
  darkness: number; // 0 to 100
  catchiness: number; // 0 to 100
  complexity: number; // 0 to 100
  space: number; // 0 to 100 (amount of silence / breath)
}

export interface PianoChordPreset {
  id: string;
  title: string;
  artist: string;
  genre: string;
  originalKey: string;
  bpm: number;
  timeSignature: string;
  tabText: string;
  description: string;
}
