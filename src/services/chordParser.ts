export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const FLAT_NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export function noteToMidi(noteName: string): number {
  if (!noteName) return 60;
  const match = noteName.match(/^([A-Ga-g][#b]?)(-?\d+)$/);
  if (!match) return 60;
  const pitch = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);
  
  let noteIndex = NOTE_NAMES.indexOf(pitch as any);
  if (noteIndex === -1) {
    noteIndex = FLAT_NOTE_NAMES.indexOf(pitch as any);
  }
  if (noteIndex === -1) {
    if (pitch === 'DB') noteIndex = 1;
    else if (pitch === 'EB') noteIndex = 3;
    else if (pitch === 'GB') noteIndex = 6;
    else if (pitch === 'AB') noteIndex = 8;
    else if (pitch === 'BB') noteIndex = 10;
    else noteIndex = 0;
  }
  return (octave + 1) * 12 + noteIndex;
}

export function midiToNote(midi: number, useFlats = false): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = ((midi % 12) + 12) % 12;
  const name = useFlats ? FLAT_NOTE_NAMES[noteIndex] : NOTE_NAMES[noteIndex];
  return `${name}${octave}`;
}

export interface ParsedChord {
  raw: string;
  root: string;
  quality: string;
  bass?: string;
  notes: string[];
  midiNotes: number[];
}

export function parseChordName(chordStr: string, octave = 4): ParsedChord {
  const clean = chordStr.trim();
  const slashParts = clean.split('/');
  const mainPart = slashParts[0];
  const bassPart = slashParts[1];

  const match = mainPart.match(/^([A-G][#b]?)(.*)$/i);
  if (!match) {
    return {
      raw: chordStr,
      root: 'C',
      quality: 'maj',
      notes: ['C4', 'E4', 'G4'],
      midiNotes: [60, 64, 67],
    };
  }

  let root = match[1].toUpperCase();
  if (root.length === 2 && root[1] === 'B') {
    root = root[0] + 'b';
  }
  const qual = (match[2] || '').toLowerCase();

  let rootIndex = NOTE_NAMES.indexOf(root as any);
  if (rootIndex === -1) {
    rootIndex = FLAT_NOTE_NAMES.indexOf(root as any);
  }
  if (rootIndex === -1) rootIndex = 0;

  const rootMidi = (octave + 1) * 12 + rootIndex;

  let intervals: number[] = [0, 4, 7]; // Major triad

  if (qual === 'm' || qual === 'min' || qual === '-') {
    intervals = [0, 3, 7]; // Minor
  } else if (qual === '7' || qual === 'dom7') {
    intervals = [0, 4, 7, 10]; // Dominant 7
  } else if (qual === 'maj7' || qual === 'm7+' || qual === 'delta') {
    intervals = [0, 4, 7, 11]; // Major 7
  } else if (qual === 'm7' || qual === 'min7' || qual === '-7') {
    intervals = [0, 3, 7, 10]; // Minor 7
  } else if (qual === 'm9' || qual === 'min9') {
    intervals = [0, 3, 7, 10, 14]; // Minor 9
  } else if (qual === 'maj9' || qual === 'm9+') {
    intervals = [0, 4, 7, 11, 14]; // Major 9
  } else if (qual === '9' || qual === 'dom9') {
    intervals = [0, 4, 7, 10, 14]; // Dominant 9
  } else if (qual === 'sus4' || qual === 'sus') {
    intervals = [0, 5, 7]; // Sus4
  } else if (qual === 'sus2') {
    intervals = [0, 2, 7]; // Sus2
  } else if (qual === '7sus4') {
    intervals = [0, 5, 7, 10];
  } else if (qual === 'dim' || qual === 'o') {
    intervals = [0, 3, 6]; // Diminished
  } else if (qual === 'dim7' || qual === 'o7') {
    intervals = [0, 3, 6, 9]; // Full diminished 7
  } else if (qual === 'm7b5' || qual === 'ø') {
    intervals = [0, 3, 6, 10]; // Half diminished
  } else if (qual === 'aug' || qual === '+') {
    intervals = [0, 4, 8]; // Augmented
  } else if (qual === 'add9' || qual === 'add2') {
    intervals = [0, 4, 7, 14]; // Add9
  } else if (qual === '6' || qual === 'maj6') {
    intervals = [0, 4, 7, 9]; // 6th
  } else if (qual === 'm6' || qual === 'min6') {
    intervals = [0, 3, 7, 9]; // Minor 6th
  } else if (qual === '5' || qual === 'power') {
    intervals = [0, 7, 12]; // Power chord
  }

  const midiNotes = intervals.map((i) => rootMidi + i);
  const notes = midiNotes.map((m) => midiToNote(m));

  return {
    raw: chordStr,
    root,
    quality: qual || 'maj',
    bass: bassPart ? bassPart.toUpperCase() : undefined,
    notes,
    midiNotes,
  };
}

export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;
  return chord.replace(/[A-G][#b]?/g, (match) => {
    const root = match.toUpperCase();
    let idx = NOTE_NAMES.indexOf(root as any);
    if (idx === -1) idx = FLAT_NOTE_NAMES.indexOf(root as any);
    if (idx === -1) return match;
    const newIdx = ((idx + semitones) % 12 + 12) % 12;
    return semitones < 0 ? FLAT_NOTE_NAMES[newIdx] : NOTE_NAMES[newIdx];
  });
}

export function transposeTabText(tabText: string, semitones: number): string {
  if (semitones === 0) return tabText;
  // Regex to match chords like Am, F#m7, C/E, Gsus4, Bbm9, etc.
  const chordRegex = /\b([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|ø)?\d*(?:\/[A-G][#b]?)?)\b/g;
  return tabText.replace(chordRegex, (match) => transposeChord(match, semitones));
}

// Check if a single token is a valid musical chord
export function isChordToken(token: string): boolean {
  if (!token) return false;
  const clean = token.replace(/^[\[\(\{]+|[\]\)\},:;]+$/g, '').trim();
  if (!clean) return false;
  
  // Specific English words to reject unless unambiguous chord
  const commonWords = ['A', 'I', 'IN', 'ON', 'TO', 'ME', 'MY', 'SO', 'AT', 'AM', 'BE', 'DO', 'IT', 'IS', 'WE', 'HE', 'SHE', 'THE', 'AND', 'OR', 'IF', 'AS', 'BY'];
  if (commonWords.includes(clean.toUpperCase()) && clean.length === 1 && clean !== 'A') {
    return false;
  }

  // Regex for standard chords: root (A-G, with optional # or b), optional quality/extensions, optional slash bass
  const chordPattern = /^[A-Ga-g][#b]?(?:maj|min|m|M|dim|aug|sus|add|ø)?\d*(?:\/[A-Ga-g][#b]?)?$/;
  return chordPattern.test(clean);
}

export interface ParsedTabSection {
  name: string;
  chords: string[];
  lyrics: string[];
  bars: number;
}

export interface ParsedSongTab {
  title?: string;
  sections: ParsedTabSection[];
  allChords: string[];
  detectedKey: { key: string; mode: string; confidence: number };
  totalBars: number;
  form: string[];
  lyricsSummary: string[];
}

export function parseStructuredSongTab(text: string): ParsedSongTab {
  if (!text || !text.trim()) {
    return {
      sections: [{ name: 'Verse', chords: ['Am', 'F', 'C', 'G'], lyrics: [], bars: 4 }],
      allChords: ['Am', 'F', 'C', 'G'],
      detectedKey: { key: 'A minor', mode: 'Aeolian', confidence: 0.8 },
      totalBars: 4,
      form: ['Verse 4'],
      lyricsSummary: [],
    };
  }

  const lines = text.split('\n');
  const sections: ParsedTabSection[] = [];
  let currentSection: ParsedTabSection = {
    name: 'Intro',
    chords: [],
    lyrics: [],
    bars: 0,
  };

  const allChords: string[] = [];
  const lyricsSummary: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Check for section header like [Verse 1], [Chorus], [Intro], [Bridge], Verse:, etc.
    const sectionHeaderMatch = trimmed.match(/^\[(.*?)\]$/) || trimmed.match(/^(Intro|Verse\s*\d*|Chorus\s*\d*|Pre-Chorus|Bridge|Outro|Final\s*Chorus|Hook|Breakdown):?$/i);
    if (sectionHeaderMatch) {
      if (currentSection.chords.length > 0 || currentSection.lyrics.length > 0) {
        currentSection.bars = Math.max(2, Math.ceil(currentSection.chords.length));
        sections.push(currentSection);
      }
      const sectionName = (sectionHeaderMatch[1] || sectionHeaderMatch[0]).replace(/[\[\]:]/g, '').trim();
      currentSection = {
        name: sectionName,
        chords: [],
        lyrics: [],
        bars: 0,
      };
      continue;
    }

    // Split line into words/tokens
    const tokens = trimmed.split(/\s+/).filter(Boolean);
    let chordCount = 0;
    const lineChords: string[] = [];

    for (const t of tokens) {
      const clean = t.replace(/^[|\[\(\{]+|[|\]\)\},:;]+$/g, '').trim();
      if (isChordToken(clean)) {
        chordCount++;
        lineChords.push(clean);
      }
    }

    // If more than 40% of tokens are valid chords or pipe-delimited chord line or line is purely chords
    const isChordLine = (chordCount > 0 && chordCount / tokens.length >= 0.4) || (trimmed.includes('|') && chordCount > 0);

    if (isChordLine) {
      for (const c of lineChords) {
        currentSection.chords.push(c);
        allChords.push(c);
      }
    } else {
      // It is a lyric line
      currentSection.lyrics.push(trimmed);
      lyricsSummary.push(trimmed);
    }
  }

  // Push final section
  if (currentSection.chords.length > 0 || currentSection.lyrics.length > 0) {
    currentSection.bars = Math.max(2, Math.ceil(currentSection.chords.length));
    sections.push(currentSection);
  }

  // Fallback if no sections or chords detected
  const finalChords = allChords.length > 0 ? allChords : ['D', 'F#m', 'Bm', 'G', 'A'];
  const keyInfo = detectKeyAndMode(finalChords);

  const form: string[] = [];
  let totalBars = 0;
  for (const s of sections) {
    const bars = Math.max(2, Math.min(32, s.bars || s.chords.length));
    form.push(`${s.name} ${bars}`);
    totalBars += bars;
  }

  if (form.length === 0) {
    form.push('Hook 8');
    totalBars = 8;
  }

  return {
    sections: sections.length > 0 ? sections : [{ name: 'Main', chords: finalChords, lyrics: lyricsSummary, bars: finalChords.length }],
    allChords: finalChords,
    detectedKey: keyInfo,
    totalBars: Math.max(8, totalBars),
    form,
    lyricsSummary,
  };
}

export function extractChordsFromTab(text: string): string[] {
  const structured = parseStructuredSongTab(text);
  return structured.allChords.length > 0 ? structured.allChords : ['D', 'F#m', 'Bm', 'G', 'A'];
}

export function detectKeyAndMode(chords: string[]): { key: string; mode: string; confidence: number } {
  if (!chords || chords.length === 0) {
    return { key: 'D major', mode: 'Ionian', confidence: 0.85 };
  }

  const rootCounts: Record<string, number> = {};
  const isMinorRoot: Record<string, boolean> = {};

  chords.forEach((c) => {
    const parsed = parseChordName(c);
    rootCounts[parsed.root] = (rootCounts[parsed.root] || 0) + 1;
    if (parsed.quality.startsWith('m') && !parsed.quality.startsWith('maj')) {
      isMinorRoot[parsed.root] = true;
    }
  });

  const firstChord = parseChordName(chords[0]);
  const lastChord = parseChordName(chords[chords.length - 1]);

  // Special detection for popular progressions:
  // e.g. D - F#m - Bm - G - A -> Key of D Major!
  const hasD = rootCounts['D'] && rootCounts['D'] > 0;
  const hasFsharpM = chords.some((c) => c.startsWith('F#m') || c.startsWith('Gbm'));
  const hasBm = chords.some((c) => c.startsWith('Bm'));
  const hasG = rootCounts['G'] && rootCounts['G'] > 0;
  const hasA = rootCounts['A'] && rootCounts['A'] > 0;

  if (hasD && (hasFsharpM || (hasBm && hasG && hasA))) {
    return { key: 'D major', mode: 'Ionian', confidence: 0.95 };
  }

  // If first chord is minor, likely minor key
  if (firstChord.quality.startsWith('m') && !firstChord.quality.startsWith('maj')) {
    return {
      key: `${firstChord.root} minor`,
      mode: 'Aeolian',
      confidence: 0.85,
    };
  }

  return {
    key: `${firstChord.root} major`,
    mode: 'Ionian',
    confidence: 0.85,
  };
}

export const VOCAL_RANGES = [
  { id: 'auto', name: 'Original Key (No Transpose)', shift: 0, desc: 'Keep song at original pitch' },
  { id: 'female_soprano', name: 'Female High (Soprano)', shift: 3, desc: 'Higher register (+3 semitones)' },
  { id: 'female_alto', name: 'Female Mid/Low (Alto/Mezzo)', shift: 1, desc: 'Warm chest & mix register (+1 semitone)' },
  { id: 'male_tenor', name: 'Male High (Tenor)', shift: -2, desc: 'Bright comfortable tenor range (-2 semitones)' },
  { id: 'male_baritone', name: 'Male Mid/Deep (Baritone/Bass)', shift: -5, desc: 'Resonant deep vocal pocket (-5 semitones)' },
  { id: 'acoustic_intimate', name: 'Capo 2 (Singer-Songwriter)', shift: 2, desc: 'Bright acoustic chime (+2 semitones)' },
];

export const SONG_COVER_PRESETS: import('../types/music').PianoChordPreset[] = [
  {
    id: 'hey_there_delilah',
    title: 'Hey There Delilah (Acoustic Pop)',
    artist: "Plain White T's / Acoustic Pop",
    genre: 'Intimate Acoustic / Fingerpicked Piano Ballad',
    originalKey: 'D major',
    bpm: 104,
    timeSignature: '4/4',
    description: 'Iconic fingerpicked D to F#m acoustic cadence with building Bm-G-A pre-chorus and soaring vocal anthemic chorus.',
    tabText: `[Intro]
D  F#m  D  F#m

[Verse 1]
D                            F#m
Hey there Delilah, what’s it like in New York City?
      D                               F#m
I’m a thousand miles away, but girl tonight you look so pretty,
         Bm  G                  A                  Bm
Yes, you do, Times Square can’t shine as bright as you,
             A
I swear it’s true.
D                            F#m
Hey there Delilah, don’t you worry about the distance,
          D                                  F#m
I’m right there if you get lonely, give this song another listen,
           Bm    G            A                 Bm
Close your eyes, listen to my voice, it’s my disguise,
            A
I’m by your side.

[Chorus]
D                       Bm  D                       Bm     A
Oh, it’s what you do to me, Oh, it’s what you do to me,
D                       Bm  D                       Bm
Oh, it’s what you do to me, Oh, it’s what you do to me,
               D
What you do to me.

[Verse 2]
D                         F#m
Hey there Delilah, I know times are getting hard,
           D                                    F#m
But just believe me girl, some day I'll pay the bills with this guitar,
              Bm    G              A               Bm
We'll have it good, we'll have the life we knew we would,
           A
My word is good.

[Bridge]
  G                                    A
A thousand miles seems pretty far, but they’ve got planes and trains and cars,
    D                             Bm
I’d walk to you if I had no other way
    G                                     A
Our friends would all make fun of us, and we'll just laugh along because,
   D                                     Bm
We know that none of them have felt this way.

[Final Chorus]
D                       Bm  D                       Bm    A
Oh, it’s what you do to me, Oh, it’s what you do to me,
D                       Bm  D                       Bm
Oh, it’s what you do to me, Oh, it’s what you do to me,
               D
What you do to me.`,
  },
  {
    id: 'someone_like_you',
    title: 'Someone Like You (Piano Ballad)',
    artist: 'Adele / Pop Ballad',
    genre: 'Emotional Pop Ballad',
    originalKey: 'A major',
    bpm: 68,
    timeSignature: '4/4',
    description: 'Arpeggiated rolling piano with deep sub bass, intimate dynamic swells, and heart-wrenching emotional space for vocal covers.',
    tabText: `[Intro & Verse]
| A | C#m/G# | F#m | D |
| A | C#m/G# | F#m | D |

[Pre-Chorus]
| E | F#m | D | D |
| E | F#m | D | E |

[Chorus]
| A | E | F#m | D |
| A | E | F#m | D |`,
  },
  {
    id: 'creep_cover',
    title: 'Creep (Indie Dynamic Lift)',
    artist: 'Radiohead / Indie Cover',
    genre: 'Indie Rock / Dynamic Lift',
    originalKey: 'G major',
    bpm: 92,
    timeSignature: '4/4',
    description: 'Classic G-B-C-Cm progression with modal mixture, building from intimate piano arpeggios into huge cinematic chorus stabs.',
    tabText: `[Verse]
| G | B | C | Cm |
| G | B | C | Cm |

[Chorus]
| G | B | C | Cm |
| G | B | C | Cm |`,
  },
  {
    id: 'drivers_license',
    title: 'Drivers License (Intimate Pop Build)',
    artist: 'Olivia Rodrigo / Modern Pop',
    genre: 'Modern Pop / Bedroom Piano',
    originalKey: 'Bb major',
    bpm: 72,
    timeSignature: '4/4',
    description: 'Syncopated eighth-note piano pulses, subtle car-chime high notes, transitioning into anthemic drum groove on the bridge.',
    tabText: `[Verse]
| Bb | Gm | Eb | Bb |
| Bb | Gm | Eb | Bb |

[Chorus]
| Eb | F | Bb | Gm |
| Eb | F | Bb | Bb |`,
  },
  {
    id: 'fly_me_to_the_moon',
    title: 'Fly Me to the Moon (Jazz Piano Swing)',
    artist: 'Jazz Standard / Sinatra',
    genre: 'Acoustic Jazz Swing',
    originalKey: 'A minor',
    bpm: 118,
    timeSignature: '4/4',
    description: 'Circle of fifths jazz chords with walking bass line, swing ride cymbal, and lush 7th/9th piano voicings.',
    tabText: `[A Section]
| Am7 | Dm7 | G7 | Cmaj7 |
| Fmaj7 | Bm7b5 | E7 | Am7 |

[B Section]
| Dm7 | G7 | Cmaj7 | A7 |
| Dm7 | G7 | Em7 | A7 |
| Dm7 | E7 | Am7 | Am7 |`,
  },
  {
    id: 'stay_with_me',
    title: 'Stay With Me (Gospel-Pop Soul)',
    artist: 'Sam Smith / Soul Pop',
    genre: 'Gospel Pop / Soul',
    originalKey: 'C major',
    bpm: 84,
    timeSignature: '4/4',
    description: 'Soulful gospel piano pushes with warm organ pads, room claps, and tight vocal hook space.',
    tabText: `[Verse & Chorus]
| Am | F | C | C |
| Am | F | C | C |
| Am | F | C | C |
| G | G | C | C |`,
  },
  {
    id: 'hallelujah',
    title: 'Hallelujah (6/8 Rolling Anthem)',
    artist: 'Leonard Cohen / Jeff Buckley',
    genre: '6/8 Folk Anthem',
    originalKey: 'C major',
    bpm: 56,
    timeSignature: '6/8',
    description: 'The iconic "secret chord" progression with rolling 6/8 triplets, soaring strings, and deep cinematic kick/tom hits.',
    tabText: `[Verse]
| C | Am | C | Am |
| F | G | C | G |
| C | F | G | Am |
| F | G | E7 | Am |

[Chorus]
| F | F | Am | Am |
| F | F | C | G |
| C | C |`,
  },
];
