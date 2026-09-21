import { parseChordName, noteToMidi, midiToNote, extractChordsFromTab, parseStructuredSongTab } from './chordParser';
import { arrangeSongTabHQ } from './proArranger';
import { getSmoothedVoicing } from './voiceLeading';
import { DieConfig, SongArrangement, VibeModifiers } from '../types/music';

export function composeArrangementFromState(params: {
  dice: DieConfig[];
  customTab?: string;
  vibe?: VibeModifiers;
  customTitle?: string;
  sourceType?: 'dice_roll' | 'chord_tab' | 'refinement';
}): SongArrangement {
  const { dice, customTab, vibe, customTitle, sourceType = 'dice_roll' } = params;

  // If a chord tab is provided, route directly to the elite professional arranger engine
  if (customTab && customTab.trim().length > 0) {
    return arrangeSongTabHQ({
      tabText: customTab,
      style: 'Acoustic Singer-Songwriter Groove',
      energyMode: 'dynamic_arc',
    });
  }

  // Helper to get selected face of a die
  const getDieValue = (id: string, fallback: string = ''): string => {
    const die = dice.find((d) => d.id === id);
    if (!die) return fallback;
    const face = die.faces[die.selectedFaceIndex];
    return face ? face.value : fallback;
  };

  const keyVal = getDieValue('key_mode', 'A minor');
  const tempoVal = getDieValue('tempo_feel', '94 bpm / light swing');
  const structVal = getDieValue('structure', '8-bar loop');
  const chordsVal = getDieValue('chords', 'vi - IV - I - V');
  const rhythmVal = getDieValue('chord_rhythm', 'Syncopated piano stabs');
  const bassVal = getDieValue('bass', 'Syncopated pocket bass');
  const drumVal = getDieValue('drums', 'Trap rolls + rim clap');
  const genreVal = getDieValue('genre_vibe', 'Indie Bedroom Pop');
  const contourVal = getDieValue('melody_contour', 'Stepwise vocal hook');
  const hookTypeVal = getDieValue('hook_type', 'Topline Vocal Melody');

  // Parse structured tab if provided
  const structuredTab = customTab ? parseStructuredSongTab(customTab) : null;

  // Parse Key & Mode
  let rootKey = 'A';
  let mode = 'Aeolian';
  let isMinor = true;

  if (structuredTab && structuredTab.detectedKey) {
    const parts = structuredTab.detectedKey.key.split(' ');
    rootKey = parts[0] || 'D';
    isMinor = structuredTab.detectedKey.key.includes('minor');
    mode = structuredTab.detectedKey.mode || (isMinor ? 'Aeolian' : 'Ionian');
  } else if (keyVal.includes('minor') || keyVal.includes('Aeolian') || keyVal.includes('Dorian')) {
    isMinor = true;
    rootKey = keyVal.split(' ')[0] || 'A';
    mode = keyVal.includes('Dorian') ? 'Dorian' : 'Aeolian';
  } else {
    isMinor = false;
    rootKey = keyVal.split(' ')[0] || 'C';
    mode = keyVal.includes('Lydian') ? 'Lydian' : keyVal.includes('Mixolydian') ? 'Mixolydian' : 'Ionian';
  }

  // Parse BPM & Swing
  let bpm = 94;
  if (customTab && (customTab.toLowerCase().includes('delilah') || customTab.includes('F#m'))) {
    bpm = 104;
  } else {
    const bpmMatch = tempoVal.match(/(\d+)/);
    bpm = bpmMatch ? parseInt(bpmMatch[1], 10) : 94;
  }

  let swing = 0;
  if (tempoVal.includes('light swing')) swing = 0.12;
  else if (tempoVal.includes('heavy swing')) swing = 0.24;

  // Bars & Form
  let barsTotal = 8;
  let form: string[] = ['Verse 4', 'Chorus 4'];

  if (structuredTab && structuredTab.sections.length > 0) {
    form = structuredTab.form;
    barsTotal = structuredTab.totalBars;
  } else if (structVal.includes('16-bar') || structVal.includes('16 Bars')) {
    barsTotal = 16;
    form = ['Verse 8', 'Chorus 8'];
  } else if (structVal.includes('24 Bars') || structVal.includes('Verse-Pre-Chorus')) {
    barsTotal = 24;
    form = ['Verse 8', 'Pre-Chorus 8', 'Chorus 8'];
  } else if (structVal.includes('32 Bars') || structVal.includes('AABA')) {
    barsTotal = 32;
    form = ['Verse 8', 'Verse 8', 'Bridge 8', 'Chorus 8'];
  } else {
    barsTotal = 8;
    form = ['Hook 8'];
  }

  // Resolve chord progression
  let chordList: string[] = [];
  if (structuredTab && structuredTab.allChords.length > 0) {
    chordList = structuredTab.allChords;
  }

  if (chordList.length === 0) {
    if (chordsVal.includes('I - V - vi - IV')) {
      chordList = isMinor ? ['Am', 'Em', 'F', 'G'] : ['C', 'G', 'Am', 'F'];
    } else if (chordsVal.includes('vi - IV - I - V')) {
      chordList = isMinor ? ['Am', 'F', 'C', 'G'] : ['Am', 'F', 'C', 'G'];
    } else if (chordsVal.includes('ii - V - I')) {
      chordList = isMinor ? ['Bm7b5', 'E7', 'Am7', 'Am7'] : ['Dm7', 'G7', 'Cmaj7', 'A7'];
    } else if (chordsVal.includes('i - bVI - bVII')) {
      chordList = isMinor ? ['Am', 'F', 'G', 'Am'] : ['Cm', 'Ab', 'Bb', 'Cm'];
    } else if (chordsVal.includes('I - bVII - IV')) {
      chordList = isMinor ? ['Am', 'G', 'D', 'Am'] : ['C', 'Bb', 'F', 'C'];
    } else if (chordsVal.includes('i - iv - v')) {
      chordList = isMinor ? ['Am', 'Dm', 'Em', 'Am'] : ['Cm', 'Fm', 'Gm', 'Cm'];
    } else if (chordsVal.includes('I - iii - IV - V')) {
      chordList = isMinor ? ['Am', 'C', 'F', 'G'] : ['C', 'Em', 'F', 'G'];
    } else if (chordsVal.includes('Canon') || chordsVal.includes('iii - IV')) {
      chordList = ['C', 'G', 'Am', 'Em', 'F', 'C', 'F', 'G'];
    } else {
      chordList = isMinor ? ['Am', 'F', 'C', 'G'] : ['C', 'G', 'Am', 'F'];
    }
  }

  // Expand chords across bars
  const chords: SongArrangement['chords'] = [];
  const pad: SongArrangement['pad'] = [];
  const bass: SongArrangement['bass'] = [];
  const melody: SongArrangement['melody'] = [];
  const drums: SongArrangement['drums'] = [];

  const beatsPerBar = 4;

  // 1. Build Chords & Pads
  for (let bar = 1; bar <= barsTotal; bar++) {
    const chordIndex = (bar - 1) % chordList.length;
    const chordName = chordList[chordIndex] || (isMinor ? 'Am' : 'C');
    const parsed = parseChordName(chordName, 4);

    // Voicing smoothing
    const notes = parsed.notes;

    // Chord rhythm styling
    if (rhythmVal.includes('Whole-note') || rhythmVal.includes('sustained')) {
      chords.push({
        bar,
        beat: 1,
        chord: chordName,
        roman: getRomanNumeral(chordName, rootKey, isMinor),
        duration_beats: 4,
        notes,
        velocity: 88,
        inversion: 'root',
        voicing: 'open',
      });
    } else if (rhythmVal.includes('Half-note') || rhythmVal.includes('pushed')) {
      chords.push(
        {
          bar,
          beat: 1,
          chord: chordName,
          roman: getRomanNumeral(chordName, rootKey, isMinor),
          duration_beats: 1.5,
          notes,
          velocity: 95,
        },
        {
          bar,
          beat: 2.5,
          chord: chordName,
          roman: getRomanNumeral(chordName, rootKey, isMinor),
          duration_beats: 2.5,
          notes,
          velocity: 90,
        }
      );
    } else if (rhythmVal.includes('Syncopated') || rhythmVal.includes('stabs')) {
      chords.push(
        { bar, beat: 1, chord: chordName, roman: getRomanNumeral(chordName, rootKey, isMinor), duration_beats: 1, notes, velocity: 96 },
        { bar, beat: 2.5, chord: chordName, roman: getRomanNumeral(chordName, rootKey, isMinor), duration_beats: 0.5, notes, velocity: 84 },
        { bar, beat: 3.5, chord: chordName, roman: getRomanNumeral(chordName, rootKey, isMinor), duration_beats: 1.5, notes, velocity: 92 }
      );
    } else if (rhythmVal.includes('Arpeggiated') || rhythmVal.includes('16th')) {
      // Arpeggiate across the 4 beats
      const noteCount = notes.length;
      for (let step = 0; step < 8; step++) {
        const beatNum = 1 + step * 0.5;
        const notePick = notes[step % noteCount];
        chords.push({
          bar,
          beat: beatNum,
          chord: chordName,
          roman: getRomanNumeral(chordName, rootKey, isMinor),
          duration_beats: 0.45,
          notes: [notePick],
          velocity: step % 2 === 0 ? 94 : 78,
        });
      }
    } else {
      // Standard 2-hit pop chord
      chords.push(
        { bar, beat: 1, chord: chordName, roman: getRomanNumeral(chordName, rootKey, isMinor), duration_beats: 2, notes, velocity: 92 },
        { bar, beat: 3, chord: chordName, roman: getRomanNumeral(chordName, rootKey, isMinor), duration_beats: 2, notes, velocity: 88 }
      );
    }

    // Pad sustained layer
    pad.push({
      bar,
      beat: 1,
      notes: notes,
      midi_notes: parsed.midiNotes,
      duration_beats: 4,
      velocity: 70,
    });

    // 2. Build Bass Line
    const rootNoteName = parsed.bass || parsed.root;
    const bassMidi = noteToMidi(`${rootNoteName}2`);
    const bassOctaveUpMidi = bassMidi + 12;

    if (bassVal.includes('Root-Note') || bassVal.includes('8th')) {
      for (let b = 1; b <= 4; b++) {
        bass.push(
          { bar, beat: b, note: midiToNote(bassMidi), midi: bassMidi, duration_beats: 0.45, velocity: 105, articulation: 'sustain' },
          { bar, beat: b + 0.5, note: midiToNote(bassMidi), midi: bassMidi, duration_beats: 0.45, velocity: 90, articulation: 'staccato' }
        );
      }
    } else if (bassVal.includes('Walking') || bassVal.includes('Jazz')) {
      bass.push(
        { bar, beat: 1, note: midiToNote(bassMidi), midi: bassMidi, duration_beats: 0.9, velocity: 105 },
        { bar, beat: 2, note: midiToNote(bassMidi + 4), midi: bassMidi + 4, duration_beats: 0.9, velocity: 92 },
        { bar, beat: 3, note: midiToNote(bassMidi + 7), midi: bassMidi + 7, duration_beats: 0.9, velocity: 98 },
        { bar, beat: 4, note: midiToNote(bassMidi + (isMinor ? 10 : 11)), midi: bassMidi + (isMinor ? 10 : 11), duration_beats: 0.9, velocity: 90 }
      );
    } else if (bassVal.includes('808') || bassVal.includes('Sub')) {
      bass.push(
        { bar, beat: 1, note: midiToNote(bassMidi), midi: bassMidi, duration_beats: 2.2, velocity: 118, articulation: 'slide' },
        { bar, beat: 3.5, note: midiToNote(bassOctaveUpMidi), midi: bassOctaveUpMidi, duration_beats: 1.5, velocity: 110, articulation: 'slide' }
      );
    } else if (bassVal.includes('Octave') || bassVal.includes('Disco')) {
      for (let b = 1; b <= 4; b++) {
        bass.push(
          { bar, beat: b, note: midiToNote(bassMidi), midi: bassMidi, duration_beats: 0.45, velocity: 105 },
          { bar, beat: b + 0.5, note: midiToNote(bassOctaveUpMidi), midi: bassOctaveUpMidi, duration_beats: 0.45, velocity: 95 }
        );
      }
    } else {
      // Syncopated pocket bass (default)
      bass.push(
        { bar, beat: 1, note: midiToNote(bassMidi), midi: bassMidi, duration_beats: 1.2, velocity: 110 },
        { bar, beat: 2.5, note: midiToNote(bassMidi), midi: bassMidi, duration_beats: 0.8, velocity: 98 },
        { bar, beat: 3.5, note: midiToNote(bassOctaveUpMidi), midi: bassOctaveUpMidi, duration_beats: 1.2, velocity: 102 }
      );
    }

    // 3. Build Drums
    if (drumVal.includes('Four-on-the-Floor') || drumVal.includes('Dance')) {
      // 4 on the floor kick
      for (let b = 1; b <= 4; b++) {
        drums.push({ bar, beat: b, piece: 'kick', velocity: 115 });
        drums.push({ bar, beat: b + 0.5, piece: 'open_hat', velocity: 90 });
      }
      drums.push({ bar, beat: 2, piece: 'clap', velocity: 108 });
      drums.push({ bar, beat: 4, piece: 'clap', velocity: 110 });
    } else if (drumVal.includes('Trap') || drumVal.includes('rolls')) {
      drums.push({ bar, beat: 1, piece: 'kick', velocity: 118 });
      drums.push({ bar, beat: 2.5, piece: 'kick', velocity: 105 });
      drums.push({ bar, beat: 3, piece: 'clap', velocity: 115 });
      if (bar % 2 === 0) drums.push({ bar, beat: 3.75, piece: 'kick', velocity: 102 });

      // Rolling 8ths/16ths hats
      for (let step = 0; step < 8; step++) {
        const beatNum = 1 + step * 0.5;
        drums.push({ bar, beat: beatNum, piece: 'hat', velocity: step % 2 === 0 ? 98 : 78 });
      }
      // Occasional crash on bar 1
      if (bar === 1 || bar === 5) drums.push({ bar, beat: 1, piece: 'crash', velocity: 95 });
    } else if (drumVal.includes('Boom-Bap') || drumVal.includes('Lo-Fi')) {
      drums.push({ bar, beat: 1, piece: 'kick', velocity: 112 });
      drums.push({ bar, beat: 2, piece: 'snare', velocity: 105 });
      drums.push({ bar, beat: 2.75, piece: 'kick', velocity: 95 });
      drums.push({ bar, beat: 4, piece: 'snare', velocity: 108 });
      for (let b = 1; b <= 4; b++) {
        drums.push({ bar, beat: b, piece: 'hat', velocity: 90 });
        drums.push({ bar, beat: b + 0.5, piece: 'shaker', velocity: 75 });
      }
    } else if (drumVal.includes('Minimal') || drumVal.includes('Snap')) {
      drums.push({ bar, beat: 1, piece: 'rim', velocity: 85 });
      drums.push({ bar, beat: 2, piece: 'clap', velocity: 92 });
      drums.push({ bar, beat: 4, piece: 'clap', velocity: 94 });
      drums.push({ bar, beat: 3, piece: 'rim', velocity: 80 });
    } else {
      // Standard Pop / Indie kit
      drums.push({ bar, beat: 1, piece: 'kick', velocity: 115 });
      drums.push({ bar, beat: 2, piece: 'snare', velocity: 106 });
      drums.push({ bar, beat: 2.5, piece: 'kick', velocity: 96 });
      drums.push({ bar, beat: 3, piece: 'kick', velocity: 104 });
      drums.push({ bar, beat: 4, piece: 'snare', velocity: 108 });
      for (let b = 1; b <= 4; b++) {
        drums.push({ bar, beat: b, piece: 'hat', velocity: 92 });
        drums.push({ bar, beat: b + 0.5, piece: 'hat', velocity: 76 });
      }
      if (bar === 1) drums.push({ bar, beat: 1, piece: 'crash', velocity: 100 });
    }

    // 4. Build Melody Guide (if enabled)
    if (!hookTypeVal.includes('No Guide')) {
      const melodyScaleNotes = parsed.midiNotes;
      const rootMidiMelody = melodyScaleNotes[0] + 12; // In 4th/5th octave
      const thirdMidi = (melodyScaleNotes[1] || rootMidiMelody + 4) + 12;
      const fifthMidi = (melodyScaleNotes[2] || rootMidiMelody + 7) + 12;

      // Create a memorable, singable vocal motif
      const phraseMod = (bar - 1) % 4;
      let lyricRow = ['oh', 'yeah', 'now'];

      if (structuredTab && structuredTab.lyricsSummary.length > 0) {
        const lyricIdx = (bar - 1) % structuredTab.lyricsSummary.length;
        const line = structuredTab.lyricsSummary[lyricIdx] || '';
        const words = line.split(/\s+/).slice(0, 3);
        if (words.length > 0) {
          lyricRow = [words[0] || 'oh', words[1] || 'you', words[2] || 'me'];
        }
      } else {
        const lyricsMap = [
          ['take', 'me', 'high - er'],
          ['feel', 'the', 'light'],
          ['stay', 'right', 'here now'],
          ['through', 'the', 'night'],
        ];
        lyricRow = lyricsMap[phraseMod] || ['oh', 'yeah', 'now'];
      }

      if (phraseMod === 0 || phraseMod === 2) {
        melody.push(
          { bar, beat: 1, note: midiToNote(fifthMidi), midi: fifthMidi, duration_beats: 1.0, lyric_placeholder: lyricRow[0], velocity: 105 },
          { bar, beat: 2, note: midiToNote(thirdMidi), midi: thirdMidi, duration_beats: 0.5, lyric_placeholder: lyricRow[1], velocity: 98 },
          { bar, beat: 2.5, note: midiToNote(rootMidiMelody), midi: rootMidiMelody, duration_beats: 1.5, lyric_placeholder: lyricRow[2], velocity: 108 }
        );
      } else if (phraseMod === 1) {
        melody.push(
          { bar, beat: 1, note: midiToNote(thirdMidi), midi: thirdMidi, duration_beats: 0.75, lyric_placeholder: lyricRow[0], velocity: 102 },
          { bar, beat: 1.75, note: midiToNote(fifthMidi), midi: fifthMidi, duration_beats: 0.75, lyric_placeholder: lyricRow[1], velocity: 95 },
          { bar, beat: 2.5, note: midiToNote(fifthMidi + 2), midi: fifthMidi + 2, duration_beats: 1.5, lyric_placeholder: lyricRow[2], velocity: 110 }
        );
      } else {
        // Resolution phrase
        melody.push(
          { bar, beat: 1, note: midiToNote(fifthMidi), midi: fifthMidi, duration_beats: 1.0, lyric_placeholder: lyricRow[0], velocity: 100 },
          { bar, beat: 2, note: midiToNote(thirdMidi), midi: thirdMidi, duration_beats: 0.5, lyric_placeholder: lyricRow[1], velocity: 96 },
          { bar, beat: 2.5, note: midiToNote(rootMidiMelody), midi: rootMidiMelody, duration_beats: 2.0, lyric_placeholder: lyricRow[2], velocity: 104 }
        );
      }
    }
  }

  const hexSeed = Math.random().toString(36).substring(2, 6).toUpperCase();
  const cleanKeyTag = rootKey + (isMinor ? 'm' : '');
  const seedCode = `SD-${hexSeed}-${cleanKeyTag}-${bpm}`;

  let detectedSongTitle = 'Vocal Cover Piano Arrangement';
  if (customTab) {
    if (customTab.toLowerCase().includes('delilah')) {
      detectedSongTitle = 'Hey There Delilah — Acoustic Vocal Cover';
    } else if (customTab.toLowerCase().includes('someone like you')) {
      detectedSongTitle = 'Someone Like You — Piano Ballad Cover';
    } else if (customTab.toLowerCase().includes('creep')) {
      detectedSongTitle = 'Creep — Indie Dynamic Cover';
    } else if (customTab.toLowerCase().includes('drivers license')) {
      detectedSongTitle = 'Drivers License — Bedroom Piano Cover';
    }
  }

  const generatedTitle =
    customTitle ||
    (customTab ? detectedSongTitle : `${genreVal.split(' ')[0]} ${rootKey} ${isMinor ? 'Minor' : 'Major'} Groove`);

  const logline = customTab
    ? `Tailored vocal cover backing track for piano in ${rootKey} ${isMinor ? 'minor' : 'major'} at ${bpm} BPM, balanced for recording clarity.`
    : `Catchy ${genreVal.toLowerCase()} sketch in ${rootKey} ${mode} at ${bpm} BPM featuring ${chordsVal} and pocket groove.`;

  const arrangementNotes = `Voice-led piano arrangement designed for vocal recording. The bass sits at ${rootKey} fundamental with clean sub-separation so your vocal scratch track has plenty of space across 300Hz-3kHz. Piano voicings leave the center stereo image clear.`;

  const hookReason = `The ${chordList.slice(0, 4).join(' -> ')} harmonic loop utilizes strong functional cadence, while the drum pattern anchors the pocket without crowding the vocal register.`;

  const nextMoves = [
    'Drag the multitrack MIDI into your DAW (Ableton / FL Studio / Logic).',
    'Set your DAW project tempo to ' + bpm + ' BPM.',
    'Assign Channel 2 to a warm piano (Grand Piano or Felt Keys).',
    'Mute or lower the Melody Guide track once you learn the vocal melody.',
    'Plug in your microphone and record your lead vocal cover on track 1.',
  ];

  return {
    id: 'arr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    seedCode,
    createdAt: Date.now(),
    title_working: generatedTitle,
    logline,
    key: `${rootKey} ${isMinor ? 'minor' : 'major'}`,
    mode,
    bpm,
    time_signature: '4/4',
    swing,
    form,
    bars_total: barsTotal,
    chords,
    melody,
    bass,
    drums,
    pad,
    arrangement_notes: arrangementNotes,
    hook_reason: hookReason,
    next_moves: nextMoves,
    sourceType,
    sourceTab: customTab,
  };
}

function getRomanNumeral(chord: string, keyRoot: string, keyIsMinor: boolean): string {
  const parsed = parseChordName(chord);
  const isChordMinor = parsed.quality.startsWith('m') && !parsed.quality.startsWith('maj');

  const romanMaj = ['I', 'bII', 'II', 'bIII', 'III', 'IV', 'bV', 'V', 'bVI', 'VI', 'bVII', 'VII'];
  const romanMin = ['i', 'bii', 'ii', 'biii', 'iii', 'iv', 'bv', 'v', 'bvi', 'vi', 'bvii', 'vii'];

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const keyIdx = noteNames.indexOf(keyRoot.toUpperCase());
  const chordIdx = noteNames.indexOf(parsed.root.toUpperCase());

  if (keyIdx === -1 || chordIdx === -1) return isChordMinor ? 'i' : 'I';

  const semitones = (chordIdx - keyIdx + 12) % 12;
  const list = isChordMinor ? romanMin : romanMaj;
  return list[semitones] || 'I';
}
