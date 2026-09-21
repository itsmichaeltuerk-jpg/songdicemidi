import { noteToMidi, midiToNote, parseChordName, ParsedChord } from './chordParser';
import { ChordEvent, BassEvent, DrumEvent, PadEvent, MelodyEvent, SongArrangement } from '../types/music';

export interface VoicingOptions {
  style: 'fingerpicked' | 'ballad_arpeggio' | 'neo_soul' | 'pop_pulse' | 'cinematic_spread' | 'lofi_chill';
  energy: 'dynamic_arc' | 'stripped_intimate' | 'high_energy';
  humanize: boolean;
  strumSpreadMs: number;
}

/**
 * Finds the smoothest inversion and voicing of a chord relative to a previous voicing.
 * Minimizes total semitone distance of inner voices while keeping notes within optimal piano range (C3 - G5).
 */
export function getSmoothedVoicing(
  currentChordName: string,
  previousMidiNotes: number[] | null = null,
  targetCenterMidi = 65 // ~F4
): { notes: string[]; midiNotes: number[]; lhNotes: string[]; rhNotes: string[] } {
  const parsed = parseChordName(currentChordName, 4);
  const rootMidi = noteToMidi(`${parsed.root}3`);

  // Left Hand: Root + Fifth (or Root + Tenth for wide open voicing)
  const lhRoot = rootMidi - 12; // Octave 2
  const lhFifth = lhRoot + 7;
  const lhNotes = [midiToNote(lhRoot), midiToNote(lhFifth)];

  // Right Hand: 3rd, 5th, 7th/9th/root in octave 4-5
  const rawRhIntervals = parsed.midiNotes.map((m) => m % 12);
  
  // Generate possible inversions for RH (3-4 notes)
  const candidates: number[][] = [];

  for (let octave = 3; octave <= 5; octave++) {
    const baseOct = (octave + 1) * 12;
    for (let inv = 0; inv < rawRhIntervals.length; inv++) {
      const voicingNotes: number[] = [];
      for (let i = 0; i < rawRhIntervals.length; i++) {
        const interval = rawRhIntervals[(i + inv) % rawRhIntervals.length];
        let noteM = baseOct + interval;
        if (voicingNotes.length > 0 && noteM <= voicingNotes[voicingNotes.length - 1]) {
          noteM += 12;
        }
        voicingNotes.push(noteM);
      }
      // Keep within comfortable piano treble clef (C4 to A5, midi 60 to 81)
      const avg = voicingNotes.reduce((a, b) => a + b, 0) / voicingNotes.length;
      if (avg >= 58 && avg <= 78) {
        candidates.push(voicingNotes);
      }
    }
  }

  let bestVoicing: number[] = candidates[0] || parsed.midiNotes;

  if (previousMidiNotes && previousMidiNotes.length > 0 && candidates.length > 0) {
    let minDistance = Infinity;
    for (const cand of candidates) {
      // Calculate voice leading distance
      let dist = 0;
      for (let i = 0; i < Math.min(cand.length, previousMidiNotes.length); i++) {
        dist += Math.abs(cand[i] - previousMidiNotes[i]);
      }
      // Penalty for drifting far from center
      const centerDist = Math.abs(cand.reduce((a, b) => a + b, 0) / cand.length - targetCenterMidi);
      const totalScore = dist + centerDist * 0.5;

      if (totalScore < minDistance) {
        minDistance = totalScore;
        bestVoicing = cand;
      }
    }
  }

  const rhNotes = bestVoicing.map((m) => midiToNote(m));
  const fullMidi = [...lhNotes.map((n) => noteToMidi(n)), ...bestVoicing];
  const fullNotes = fullMidi.map((m) => midiToNote(m));

  return {
    notes: fullNotes,
    midiNotes: fullMidi,
    lhNotes,
    rhNotes,
  };
}

/**
 * Returns dynamic energy level (0.0 to 1.0) based on song section and dynamic curve.
 */
export function getSectionEnergy(
  sectionName: string,
  bar: number,
  totalBars: number,
  mode: 'dynamic_arc' | 'stripped_intimate' | 'high_energy' = 'dynamic_arc'
): { energy: number; isChorus: boolean; isBuild: boolean; isIntro: boolean; isBridge: boolean } {
  const s = sectionName.toLowerCase();
  const isIntro = s.includes('intro');
  const isVerse = s.includes('verse');
  const isPreChorus = s.includes('pre') || s.includes('build');
  const isChorus = s.includes('chorus') || s.includes('hook') || s.includes('drop');
  const isBridge = s.includes('bridge') || s.includes('breakdown');
  const isOutro = s.includes('outro') || s.includes('ending');

  if (mode === 'stripped_intimate') {
    return { energy: isChorus ? 0.6 : 0.35, isChorus, isBuild: isPreChorus, isIntro, isBridge };
  }

  if (mode === 'high_energy') {
    return { energy: isIntro ? 0.6 : 0.9, isChorus, isBuild: isPreChorus, isIntro, isBridge };
  }

  // Dynamic Arc
  let energy = 0.5;
  if (isIntro) energy = 0.3;
  else if (isVerse) energy = 0.45;
  else if (isPreChorus) energy = 0.7;
  else if (isChorus) energy = 0.95;
  else if (isBridge) energy = 0.55;
  else if (isOutro) energy = 0.4;

  return { energy, isChorus, isBuild: isPreChorus, isIntro, isBridge };
}

/**
 * Calculates a smooth bass approach note (diatonic or chromatic leading tone) to land on the next bar's root.
 */
export function getApproachNote(currentMidi: number, nextMidi: number): number {
  if (nextMidi > currentMidi) {
    // Leading tone from below (half step or whole step below target)
    return nextMidi - 1; // Chromatic approach
  } else if (nextMidi < currentMidi) {
    // Approach from above
    return nextMidi + 1; // Half step above
  }
  return currentMidi + 7; // Dominant fifth approach if same root
}
