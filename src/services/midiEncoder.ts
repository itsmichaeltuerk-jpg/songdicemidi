import JSZip from 'jszip';
import { SongArrangement } from '../types/music';

// Variable-Length Quantity (VLQ) helper
function encodeVLQ(value: number): number[] {
  let buffer = value & 0x7f;
  const bytes: number[] = [];
  while ((value >>= 7) > 0) {
    buffer <<= 8;
    buffer |= 0x80;
    buffer += value & 0x7f;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

interface RawMidiEvent {
  tick: number;
  data: number[];
}

export class MidiTrackBuilder {
  private events: RawMidiEvent[] = [];
  public name: string;
  public channel: number;

  constructor(name: string, channel: number = 0) {
    this.name = name;
    this.channel = channel & 0x0f;
  }

  addTrackName(name: string) {
    const bytes = Array.from(name).map((c) => c.charCodeAt(0));
    this.events.push({
      tick: 0,
      data: [0xff, 0x03, bytes.length, ...bytes],
    });
  }

  addTempo(bpm: number, tick: number = 0) {
    const mpqn = Math.round(60000000 / Math.max(20, Math.min(300, bpm)));
    this.events.push({
      tick,
      data: [0xff, 0x51, 0x03, (mpqn >> 16) & 0xff, (mpqn >> 8) & 0xff, mpqn & 0xff],
    });
  }

  addTimeSignature(num: number = 4, den: number = 4, tick: number = 0) {
    const denPow = Math.round(Math.log2(den));
    this.events.push({
      tick,
      data: [0xff, 0x58, 0x04, num, denPow, 24, 8],
    });
  }

  addMarker(text: string, tick: number) {
    const bytes = Array.from(text).map((c) => c.charCodeAt(0));
    this.events.push({
      tick,
      data: [0xff, 0x06, bytes.length, ...bytes],
    });
  }

  addProgramChange(program: number, tick: number = 0) {
    this.events.push({
      tick,
      data: [0xc0 | this.channel, program & 0x7f],
    });
  }

  addNote(pitch: number, startTick: number, durationTicks: number, velocity: number = 100) {
    const p = Math.max(0, Math.min(127, Math.round(pitch)));
    const v = Math.max(1, Math.min(127, Math.round(velocity)));
    const endTick = startTick + Math.max(10, Math.round(durationTicks));

    // Note On
    this.events.push({
      tick: startTick,
      data: [0x90 | this.channel, p, v],
    });

    // Note Off
    this.events.push({
      tick: endTick,
      data: [0x80 | this.channel, p, 0],
    });
  }

  buildTrackChunk(): number[] {
    // Sort events by tick
    this.events.sort((a, b) => a.tick - b.tick);

    const trackData: number[] = [];
    let lastTick = 0;

    for (const ev of this.events) {
      const delta = Math.max(0, ev.tick - lastTick);
      const deltaBytes = encodeVLQ(delta);
      trackData.push(...deltaBytes, ...ev.data);
      lastTick = ev.tick;
    }

    // End of Track Meta Event: Delta 0, FF 2F 00
    trackData.push(0x00, 0xff, 0x2f, 0x00);

    const length = trackData.length;
    return [
      0x4d, 0x54, 0x72, 0x6b, // 'MTrk'
      (length >> 24) & 0xff,
      (length >> 16) & 0xff,
      (length >> 8) & 0xff,
      length & 0xff,
      ...trackData,
    ];
  }
}

export function buildStandardMidiFile(tracks: MidiTrackBuilder[], ppq: number = 480): Uint8Array {
  const numTracks = tracks.length;
  // Type 1 Standard MIDI File
  const header = [
    0x4d, 0x54, 0x68, 0x64, // 'MThd'
    0x00, 0x00, 0x00, 0x06, // Header length = 6
    0x00, 0x01,             // Format 1 (multi-track synchronous)
    (numTracks >> 8) & 0xff,
    numTracks & 0xff,
    (ppq >> 8) & 0xff,
    ppq & 0xff,
  ];

  const fullBytes: number[] = [...header];
  for (const t of tracks) {
    fullBytes.push(...t.buildTrackChunk());
  }

  return new Uint8Array(fullBytes);
}

// GM Drum Note mappings
const GM_DRUM_MAP: Record<string, number> = {
  kick: 36,      // Bass Drum 1
  snare: 38,     // Acoustic Snare
  clap: 39,      // Hand Clap
  rim: 37,       // Side Stick
  hat: 42,       // Closed Hi-Hat
  open_hat: 46,  // Open Hi-Hat
  tom: 45,       // Low Tom
  crash: 49,     // Crash Cymbal 1
  shaker: 70,    // Maracas
};

export function generateChordChartString(song: SongArrangement): string {
  if (!song.chords || song.chords.length === 0) return '| Am | F | C | G |';
  const chordsPerBar: Record<number, string[]> = {};
  for (const c of song.chords) {
    if (!chordsPerBar[c.bar]) chordsPerBar[c.bar] = [];
    chordsPerBar[c.bar].push(c.chord);
  }
  const bars = Object.keys(chordsPerBar).map(Number).sort((a, b) => a - b);
  const segments = bars.map((b) => chordsPerBar[b].join(' '));
  return `| ${segments.join(' | ')} |`;
}

export function generateArrangementMidi(
  song: SongArrangement,
  optionsOrHumanize?: { humanize?: boolean } | boolean
): {
  multitrackMidi: Uint8Array;
  multitrackBlob: Blob;
  stems: { name: string; filename: string; midi: Uint8Array; blob: Blob }[];
} {
  const ppq = 480;
  const humanize =
    typeof optionsOrHumanize === 'boolean'
      ? optionsOrHumanize
      : optionsOrHumanize?.humanize ?? true;

  const getJitter = (maxTicks: number = 10) => {
    if (!humanize) return 0;
    return Math.floor((Math.random() - 0.5) * 2 * maxTicks);
  };
  const getVelJitter = (vel: number, amount: number = 6) => {
    if (!humanize) return vel;
    return Math.max(20, Math.min(127, vel + Math.floor((Math.random() - 0.5) * 2 * amount)));
  };

  // Track 0: Tempo, Markers, Time signature
  const tempoTrack = new MidiTrackBuilder('Conductor', 0);
  tempoTrack.addTrackName(`${song.title_working} (Conductor)`);
  tempoTrack.addTempo(song.bpm, 0);
  const timeSigParts = (song.time_signature || '4/4').split('/');
  const num = parseInt(timeSigParts[0] || '4', 10);
  const den = parseInt(timeSigParts[1] || '4', 10);
  tempoTrack.addTimeSignature(num, den, 0);

  // Markers
  if (song.form && song.form.length > 0) {
    let currentBar = 1;
    for (const section of song.form) {
      const match = section.match(/^(.*?)\s*(\d+)?$/);
      const name = match ? match[1].trim() : section;
      const bars = match && match[2] ? parseInt(match[2], 10) : 4;
      const startTick = (currentBar - 1) * num * ppq;
      tempoTrack.addMarker(name, startTick);
      currentBar += bars;
    }
  }

  // Track 1: Melody Guide (Channel 0 / Ch 1)
  const melodyTrack = new MidiTrackBuilder('Melody Lead', 0);
  melodyTrack.addTrackName('Melody Guide / Vocal Topline');
  melodyTrack.addProgramChange(80, 0); // Lead Synth / Voice Lead

  for (const m of song.melody) {
    const barOffset = (m.bar - 1) * num * ppq;
    const beatOffset = (m.beat - 1) * ppq;
    const startTick = Math.max(0, barOffset + beatOffset + getJitter(12));
    const durTicks = Math.max(20, m.duration_beats * ppq + getJitter(8));
    melodyTrack.addNote(m.midi, startTick, durTicks, getVelJitter(m.velocity || 105));
  }

  // Track 2: Chords / Piano (Channel 1 / Ch 2)
  const chordTrack = new MidiTrackBuilder('Piano Chords', 1);
  chordTrack.addTrackName('Piano / Main Chords');
  chordTrack.addProgramChange(0, 0); // Acoustic Grand Piano

  for (const c of song.chords) {
    const barOffset = (c.bar - 1) * num * ppq;
    const beatOffset = (c.beat - 1) * ppq;
    const startTick = Math.max(0, barOffset + beatOffset + getJitter(8));
    const durTicks = Math.max(40, c.duration_beats * ppq - 10 + getJitter(10));

    if (c.notes && c.notes.length > 0) {
      c.notes.forEach((nStr, idx) => {
        const midiNum = noteStringToMidi(nStr);
        const strumOffset = idx * (humanize ? 6 : 3);
        chordTrack.addNote(midiNum, startTick + strumOffset, durTicks, getVelJitter(c.velocity || 92, 5));
      });
    }
  }

  // Track 3: Bass (Channel 2 / Ch 3)
  const bassTrack = new MidiTrackBuilder('Bass', 2);
  bassTrack.addTrackName('Bass / Sub');
  bassTrack.addProgramChange(33, 0); // Electric Bass (finger)

  for (const b of song.bass) {
    const barOffset = (b.bar - 1) * num * ppq;
    const beatOffset = (b.beat - 1) * ppq;
    const startTick = Math.max(0, barOffset + beatOffset + getJitter(6));
    const durTicks = Math.max(30, b.duration_beats * ppq - 15);
    bassTrack.addNote(b.midi, startTick, durTicks, getVelJitter(b.velocity || 100));
  }

  // Track 4: Pad / Strings (Channel 3 / Ch 4)
  const padTrack = new MidiTrackBuilder('Pad Atmosphere', 3);
  padTrack.addTrackName('Warm Pad / Strings');
  padTrack.addProgramChange(89, 0); // Pad (warm)

  if (song.pad && song.pad.length > 0) {
    for (const p of song.pad) {
      const barOffset = (p.bar - 1) * num * ppq;
      const beatOffset = (p.beat - 1) * ppq;
      const startTick = Math.max(0, barOffset + beatOffset);
      const durTicks = Math.max(80, p.duration_beats * ppq - 20);

      p.notes.forEach((nStr) => {
        const midiNum = noteStringToMidi(nStr);
        padTrack.addNote(midiNum, startTick, durTicks, getVelJitter(p.velocity || 75, 4));
      });
    }
  }

  // Track 10: Drums (Channel 9 / Ch 10)
  const drumTrack = new MidiTrackBuilder('Drums', 9);
  drumTrack.addTrackName('Drums (GM Standard)');

  for (const d of song.drums) {
    const barOffset = (d.bar - 1) * num * ppq;
    const beatOffset = (d.beat - 1) * ppq;
    const startTick = Math.max(0, barOffset + beatOffset + getJitter(5));
    const midiPitch = GM_DRUM_MAP[d.piece] || 36;
    drumTrack.addNote(midiPitch, startTick, 60, getVelJitter(d.velocity || 100, 8));
  }

  // Full multitrack MIDI
  const allTracks = [tempoTrack, melodyTrack, chordTrack, bassTrack, padTrack, drumTrack];
  const multitrackMidi = buildStandardMidiFile(allTracks, ppq);
  const multitrackBlob = new Blob([multitrackMidi], { type: 'audio/midi' });

  // Separate stem MIDIs
  const stemConfigs = [
    { name: 'Melody Guide', filename: `${slugify(song.title_working)}_01_Melody.mid`, track: melodyTrack },
    { name: 'Piano Chords', filename: `${slugify(song.title_working)}_02_Chords.mid`, track: chordTrack },
    { name: 'Bass Line', filename: `${slugify(song.title_working)}_03_Bass.mid`, track: bassTrack },
    { name: 'Pad Atmosphere', filename: `${slugify(song.title_working)}_04_Pad.mid`, track: padTrack },
    { name: 'Drums & Percussion', filename: `${slugify(song.title_working)}_05_Drums.mid`, track: drumTrack },
  ];

  const stems = stemConfigs.map((cfg) => {
    const bytes = buildStandardMidiFile([tempoTrack, cfg.track], ppq);
    return {
      name: cfg.name,
      filename: cfg.filename,
      midi: bytes,
      blob: new Blob([bytes], { type: 'audio/midi' }),
    };
  });

  return {
    multitrackMidi,
    multitrackBlob,
    stems,
  };
}

export function generateProducerBriefMarkdown(song: SongArrangement): string {
  const chordSummary = song.chords.map((c) => c.chord).filter((v, i, a) => a.indexOf(v) === i).join(' -> ');
  const chordProgressionBars = formatBarProgression(song.chords);

  return `# SONG DICE — PRODUCER BRIEF
==================================================
TRACK TITLE: ${song.title_working}
LOGLINE: "${song.logline}"
DATE: ${new Date(song.createdAt).toLocaleString()}
SEED CODE: ${song.seedCode}
==================================================

## 1. SESSION SPECIFICATIONS
- Key & Mode: ${song.key} (${song.mode})
- Tempo: ${song.bpm} BPM
- Time Signature: ${song.time_signature}
- Groove / Swing: ${Math.round(song.swing * 100)}%
- Total Bars: ${song.bars_total}
- Song Structure: ${song.form.join(' -> ')}

## 2. HARMONIC BLUEPRINT
- Main Chord Flow: ${chordSummary}
- Bar-by-Bar Progression:
${chordProgressionBars}

## 3. VOCAL & ARRANGEMENT NOTES
${song.arrangement_notes}

## 4. WHY THIS HOOK WORKS
${song.hook_reason}

## 5. RECOMMENDED NEXT MOVES FOR YOUR DAW
${song.next_moves.map((m, idx) => `${idx + 1}. ${m}`).join('\n')}

## 6. DAW IMPORT INSTRUCTIONS
1. Drag the included \`${slugify(song.title_working)}_Full_Arrangement.mid\` into your DAW (Ableton, FL Studio, Logic Pro, Pro Tools, Reaper).
2. Set DAW tempo to **${song.bpm} BPM**.
3. Route MIDI Channels:
   - Channel 1 -> Lead Synth / Vocal Guide Instrument
   - Channel 2 -> Acoustic Grand Piano or Rhodes Keys
   - Channel 3 -> Bass (Sub, Electric, or 808)
   - Channel 4 -> Ambient Reverb Pad
   - Channel 10 -> Drum Rack (GM Standard)
4. Record your lead vocal scratch track over the piano backing!

Enjoy finishing the song!
`;
}

export const generateProducerBrief = generateProducerBriefMarkdown;

export async function createZipPackage(
  song: SongArrangement,
  optionsOrHumanize?: { humanize?: boolean } | boolean
): Promise<Blob> {
  const zip = new JSZip();
  const midiData = generateArrangementMidi(song, optionsOrHumanize);

  const safeTitle = slugify(song.title_working);

  // 1. Multitrack MIDI
  zip.file(`${safeTitle}_Full_Multitrack.mid`, midiData.multitrackMidi);

  // 2. Stems folder
  const stemsFolder = zip.folder('stems');
  if (stemsFolder) {
    for (const stem of midiData.stems) {
      stemsFolder.file(stem.filename, stem.midi);
    }
  }

  // 3. Producer Brief
  const briefText = generateProducerBriefMarkdown(song);
  zip.file('PRODUCER_BRIEF.md', briefText);

  // 4. Quick Chord Chart
  const quickChords = song.chords.map((c) => c.chord).join(' | ');
  zip.file('CHORD_CHART.txt', `Song: ${song.title_working}\nKey: ${song.key}\nBPM: ${song.bpm}\nChords: | ${quickChords} |\n`);

  return await zip.generateAsync({ type: 'blob' });
}

export const createStemZipPackage = createZipPackage;

function noteStringToMidi(noteName: string): number {
  if (!noteName) return 60;
  const match = noteName.match(/^([A-Ga-g][#b]?)(-?\d+)$/);
  if (!match) return 60;
  const pitch = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let noteIndex = notes.indexOf(pitch);
  if (noteIndex === -1) {
    const flats = ['C', 'DB', 'D', 'EB', 'E', 'F', 'GB', 'G', 'AB', 'A', 'BB', 'B'];
    idxFinder: {
      noteIndex = flats.indexOf(pitch);
    }
  }
  if (noteIndex === -1) noteIndex = 0;
  return (octave + 1) * 12 + noteIndex;
}

function slugify(text: string): string {
  return (text || 'Song_Dice_Arrangement')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function formatBarProgression(chords: SongArrangement['chords']): string {
  const barsMap: Record<number, string[]> = {};
  for (const c of chords) {
    if (!barsMap[c.bar]) barsMap[c.bar] = [];
    barsMap[c.bar].push(c.chord);
  }
  const lines: string[] = [];
  const barNumbers = Object.keys(barsMap).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < barNumbers.length; i += 4) {
    const chunk = barNumbers.slice(i, i + 4);
    const row = chunk.map((b) => `Bar ${b}: [ ${barsMap[b].join(' - ')} ]`).join(' | ');
    lines.push(row);
  }
  return lines.join('\n');
}
