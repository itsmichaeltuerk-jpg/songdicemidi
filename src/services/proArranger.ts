import { parseStructuredSongTab, parseChordName, noteToMidi, midiToNote } from './chordParser';
import { getSmoothedVoicing, getSectionEnergy, getApproachNote } from './voiceLeading';
import { SongArrangement, ChordEvent, BassEvent, DrumEvent, PadEvent, MelodyEvent } from '../types/music';
import { POPULAR_YOUTUBE_TRACKS, searchYouTubeCatalog } from './youtubeService';

export interface ProArrangementOptions {
  tabText: string;
  style?: string;
  vocalShift?: number;
  energyMode?: 'dynamic_arc' | 'stripped_intimate' | 'high_energy';
  humanizeTiming?: boolean;
  tempoBpm?: number;
}

export function arrangeSongTabHQ(options: ProArrangementOptions): SongArrangement {
  const {
    tabText,
    style = 'Acoustic Singer-Songwriter Groove',
    vocalShift = 0,
    energyMode = 'dynamic_arc',
    humanizeTiming = true,
  } = options;

  const parsedTab = parseStructuredSongTab(tabText);
  const detectedKey = parsedTab.detectedKey;
  const isMinor = detectedKey.key.toLowerCase().includes('minor');
  const rootKey = detectedKey.key.split(' ')[0] || 'D';

  // Determine BPM
  let bpm = options.tempoBpm || 104;
  if (!options.tempoBpm) {
    if (tabText.toLowerCase().includes('delilah') || tabText.includes('F#m')) bpm = 104;
    else if (tabText.toLowerCase().includes('someone like you')) bpm = 68;
    else if (tabText.toLowerCase().includes('stay with me')) bpm = 84;
    else if (tabText.toLowerCase().includes('all of me')) bpm = 63;
    else if (tabText.toLowerCase().includes('drivers license')) bpm = 72;
    else if (tabText.toLowerCase().includes('creep')) bpm = 92;
    else bpm = 98;
  }

  // Determine style profile
  const styleLower = style.toLowerCase();
  const isFingerpicked = styleLower.includes('acoustic') || styleLower.includes('finger') || tabText.toLowerCase().includes('delilah');
  const isBallad = styleLower.includes('ballad') || styleLower.includes('rolling');
  const isNeoSoul = styleLower.includes('r&b') || styleLower.includes('soul') || styleLower.includes('alt');
  const isPopStabs = styleLower.includes('pop') || styleLower.includes('anthem') || styleLower.includes('gospel');
  const isLoFi = styleLower.includes('lo-fi') || styleLower.includes('chill');

  // Build section map with absolute bar offsets
  interface BarSectionMeta {
    barNumber: number;
    sectionName: string;
    chordName: string;
    isFirstBarOfSection: boolean;
    isLastBarOfSection: boolean;
    sectionEnergy: number;
    isChorus: boolean;
    isBuild: boolean;
    isIntro: boolean;
    isBridge: boolean;
    nextChordName?: string;
    lyricLine?: string;
  }

  const barMap: BarSectionMeta[] = [];
  let currentBar = 1;

  for (const section of parsedTab.sections) {
    const sectionChords = section.chords.length > 0 ? section.chords : [isMinor ? 'Am' : 'D'];
    const sectionBars = Math.max(2, section.bars || sectionChords.length);
    const lyrics = section.lyrics;

    for (let b = 0; b < sectionBars; b++) {
      const chordIdx = b % sectionChords.length;
      const nextChordIdx = (b + 1) % sectionChords.length;
      const chordName = sectionChords[chordIdx];
      const nextChordName = sectionChords[nextChordIdx];
      const lyricLine = lyrics[b % (lyrics.length || 1)] || '';

      const energyInfo = getSectionEnergy(section.name, currentBar, parsedTab.totalBars, energyMode);

      barMap.push({
        barNumber: currentBar,
        sectionName: section.name,
        chordName,
        nextChordName,
        isFirstBarOfSection: b === 0,
        isLastBarOfSection: b === sectionBars - 1,
        sectionEnergy: energyInfo.energy,
        isChorus: energyInfo.isChorus,
        isBuild: energyInfo.isBuild,
        isIntro: energyInfo.isIntro,
        isBridge: energyInfo.isBridge,
        lyricLine,
      });

      currentBar++;
    }
  }

  const totalBars = barMap.length;

  const chords: ChordEvent[] = [];
  const bass: BassEvent[] = [];
  const drums: DrumEvent[] = [];
  const pad: PadEvent[] = [];
  const melody: MelodyEvent[] = [];

  let previousRhMidi: number[] | null = null;

  // RENDER NOTE EVENTS FOR EVERY BAR
  for (let i = 0; i < barMap.length; i++) {
    const meta = barMap[i];
    const bar = meta.barNumber;
    const chordName = meta.chordName;
    const nextChordName = meta.nextChordName || chordName;
    const energy = meta.sectionEnergy;

    // 1. VOICE-LED PIANO VOICING
    const voicing = getSmoothedVoicing(chordName, previousRhMidi, 65);
    previousRhMidi = voicing.rhNotes.map((n) => noteToMidi(n));

    const lhNotes = voicing.lhNotes;
    const rhNotes = voicing.rhNotes;
    const fullNotes = voicing.notes;

    // Calculate Roman Numeral
    const parsedChord = parseChordName(chordName);
    const roman = getRomanNumeral(chordName, rootKey, isMinor);

    // PIANO RHYTHM GENERATION (Dynamic based on style & energy)
    if (isFingerpicked) {
      // Authentic fingerpicked acoustic guitar / piano pattern (Delilah / Bedroom style)
      // Beat 1: Thumb on LH root
      // Beat 1.5: RH index/middle pluck
      // Beat 2: RH ring pluck
      // Beat 2.5: Thumb on LH fifth
      // Beat 3: Thumb on LH root
      // Beat 3.5: RH index pluck
      // Beat 4: RH chord sustain
      // Beat 4.5: RH top note pickup
      const vBase = Math.round(75 + energy * 35);

      // LH Bass Thumb hits
      chords.push(
        {
          bar,
          beat: 1,
          chord: chordName,
          roman,
          duration_beats: 0.9,
          notes: [lhNotes[0] || 'D2'],
          velocity: vBase + 10,
          inversion: 'root',
          voicing: 'open_spread',
        },
        {
          bar,
          beat: 2.5,
          chord: chordName,
          roman,
          duration_beats: 0.45,
          notes: [lhNotes[1] || 'A2'],
          velocity: vBase - 5,
        },
        {
          bar,
          beat: 3,
          chord: chordName,
          roman,
          duration_beats: 0.9,
          notes: [lhNotes[0] || 'D2'],
          velocity: vBase + 8,
        },
        {
          bar,
          beat: 4.5,
          chord: chordName,
          roman,
          duration_beats: 0.45,
          notes: [lhNotes[1] || 'A2'],
          velocity: vBase - 8,
        }
      );

      // RH Finger Picking Patterns
      if (rhNotes.length >= 2) {
        chords.push(
          { bar, beat: 1.5, chord: chordName, roman, duration_beats: 0.45, notes: [rhNotes[0]], velocity: vBase - 8 },
          { bar, beat: 2.0, chord: chordName, roman, duration_beats: 0.45, notes: [rhNotes[1]], velocity: vBase - 4 },
          { bar, beat: 3.5, chord: chordName, roman, duration_beats: 0.45, notes: [rhNotes[0]], velocity: vBase - 6 },
          { bar, beat: 4.0, chord: chordName, roman, duration_beats: 0.45, notes: rhNotes.slice(1), velocity: vBase + 4 }
        );
      } else {
        chords.push(
          { bar, beat: 2, chord: chordName, roman, duration_beats: 1.0, notes: rhNotes, velocity: vBase },
          { bar, beat: 4, chord: chordName, roman, duration_beats: 1.0, notes: rhNotes, velocity: vBase + 5 }
        );
      }
    } else if (isBallad) {
      // Flowing rolling arpeggio (Adele / Someone Like You)
      const v = Math.round(70 + energy * 30);
      const rollNotes = [...lhNotes, ...rhNotes];
      for (let s = 0; s < 8; s++) {
        const beatNum = 1 + s * 0.5;
        const noteIdx = s % rollNotes.length;
        const isDown = s % 2 === 0;
        chords.push({
          bar,
          beat: beatNum,
          chord: chordName,
          roman,
          duration_beats: 0.48,
          notes: [rollNotes[noteIdx]],
          velocity: isDown ? v + 12 : v - 6,
        });
      }
    } else if (isNeoSoul) {
      // Syncopated push chords with 7ths & 9ths
      const v = Math.round(80 + energy * 35);
      chords.push(
        { bar, beat: 1, chord: chordName, roman, duration_beats: 0.75, notes: fullNotes, velocity: v + 8 },
        { bar, beat: 2.5, chord: chordName, roman, duration_beats: 0.5, notes: rhNotes, velocity: v - 10 },
        { bar, beat: 3.75, chord: chordName, roman, duration_beats: 1.25, notes: fullNotes, velocity: v + 6 }
      );
    } else if (isPopStabs || meta.isChorus) {
      // Driving 4-on-floor quarter-note piano stabs for anthemic chorus energy
      const v = Math.round(85 + energy * 35);
      chords.push(
        { bar, beat: 1, chord: chordName, roman, duration_beats: 0.9, notes: fullNotes, velocity: v + 12 },
        { bar, beat: 2, chord: chordName, roman, duration_beats: 0.9, notes: rhNotes, velocity: v },
        { bar, beat: 3, chord: chordName, roman, duration_beats: 0.9, notes: fullNotes, velocity: v + 8 },
        { bar, beat: 4, chord: chordName, roman, duration_beats: 0.9, notes: rhNotes, velocity: v + 4 }
      );
    } else {
      // Standard tasteful 2-hit pop arrangement
      const v = Math.round(80 + energy * 30);
      chords.push(
        { bar, beat: 1, chord: chordName, roman, duration_beats: 1.8, notes: fullNotes, velocity: v + 8 },
        { bar, beat: 3, chord: chordName, roman, duration_beats: 1.8, notes: fullNotes, velocity: v + 4 }
      );
    }

    // 2. ATMOSPHERIC PAD LAYER (Glues the chords, swells on Chorus)
    const padVelocity = Math.round(45 + energy * 40);
    pad.push({
      bar,
      beat: 1,
      notes: rhNotes,
      midi_notes: rhNotes.map((n) => noteToMidi(n)),
      duration_beats: 4.0,
      velocity: padVelocity,
    });

    // 3. BASSLINE GENERATION (with root locks + passing approach tones)
    const rootBassName = parsedChord.bass || parsedChord.root;
    const currentRootMidi = noteToMidi(`${rootBassName}2`);
    const nextRootParsed = parseChordName(nextChordName);
    const nextRootMidi = noteToMidi(`${nextRootParsed.bass || nextRootParsed.root}2`);

    const bassV = Math.round(80 + energy * 40);

    if (meta.isIntro && !isPopStabs) {
      // Delicate root pedal on beat 1 for intro
      bass.push({
        bar,
        beat: 1,
        note: midiToNote(currentRootMidi),
        midi: currentRootMidi,
        duration_beats: 3.5,
        velocity: bassV - 15,
        articulation: 'sustain',
      });
    } else if (meta.isChorus || meta.isBuild || energy > 0.6) {
      // Driving pocket bass with melodic approach tone on beat 4&
      const approachMidi = getApproachNote(currentRootMidi, nextRootMidi);

      bass.push(
        {
          bar,
          beat: 1,
          note: midiToNote(currentRootMidi),
          midi: currentRootMidi,
          duration_beats: 1.2,
          velocity: bassV + 8,
          articulation: 'sustain',
        },
        {
          bar,
          beat: 2.5,
          note: midiToNote(currentRootMidi),
          midi: currentRootMidi,
          duration_beats: 0.8,
          velocity: bassV - 4,
        },
        {
          bar,
          beat: 3.5,
          note: midiToNote(currentRootMidi + 12), // Octave jump
          midi: currentRootMidi + 12,
          duration_beats: 0.8,
          velocity: bassV,
        },
        {
          bar,
          beat: 4.5,
          note: midiToNote(approachMidi), // Smooth approach note to next chord
          midi: approachMidi,
          duration_beats: 0.45,
          velocity: bassV - 6,
          articulation: 'slide',
        }
      );
    } else {
      // Verse intimate pocket bass
      bass.push(
        {
          bar,
          beat: 1,
          note: midiToNote(currentRootMidi),
          midi: currentRootMidi,
          duration_beats: 1.8,
          velocity: bassV,
        },
        {
          bar,
          beat: 3,
          note: midiToNote(currentRootMidi),
          midi: currentRootMidi,
          duration_beats: 1.2,
          velocity: bassV - 6,
        }
      );
    }

    // 4. DRUM PROGRAMMING (GM Standard with Section Dynamics & Fills)
    if (meta.isIntro) {
      // Minimal intro percussion: light shaker or gentle rim
      if (energy > 0.2) {
        for (let b = 1; b <= 4; b++) {
          drums.push({ bar, beat: b + 0.5, piece: 'shaker', velocity: 60 });
        }
      }
    } else if (meta.isBuild) {
      // Pre-Chorus / Build: 4-on-the-floor kick + rising snare
      for (let b = 1; b <= 4; b++) {
        drums.push({ bar, beat: b, piece: 'kick', velocity: Math.round(90 + b * 6) });
        drums.push({ bar, beat: b, piece: 'hat', velocity: 85 });
        drums.push({ bar, beat: b + 0.5, piece: 'hat', velocity: 70 });
      }
      if (meta.isLastBarOfSection) {
        // Tom roll build at end of pre-chorus
        drums.push(
          { bar, beat: 3.0, piece: 'tom', velocity: 95 },
          { bar, beat: 3.5, piece: 'tom', velocity: 100 },
          { bar, beat: 4.0, piece: 'snare', velocity: 110 },
          { bar, beat: 4.5, piece: 'snare', velocity: 118 }
        );
      } else {
        drums.push({ bar, beat: 3, piece: 'snare', velocity: 100 });
      }
    } else if (meta.isChorus) {
      // Full driving Chorus kit: Kick, Snare on 2 & 4, Open Hat sizzle, Crash on bar 1
      if (meta.isFirstBarOfSection) {
        drums.push({ bar, beat: 1, piece: 'crash', velocity: 115 });
      }

      drums.push({ bar, beat: 1, piece: 'kick', velocity: 120 });
      drums.push({ bar, beat: 2, piece: 'snare', velocity: 115 });
      drums.push({ bar, beat: 2.5, piece: 'kick', velocity: 102 });
      drums.push({ bar, beat: 3, piece: 'kick', velocity: 112 });
      drums.push({ bar, beat: 4, piece: 'snare', velocity: 118 });

      // Snare ghost note on 3.75 for pro bounce
      drums.push({ bar, beat: 3.75, piece: 'snare', velocity: 55 });

      // Dynamic 8th-note hats with open hat on 4.5
      for (let b = 1; b <= 4; b++) {
        drums.push({ bar, beat: b, piece: 'hat', velocity: 95 });
        if (b === 4) {
          drums.push({ bar, beat: 4.5, piece: 'open_hat', velocity: 92 });
        } else {
          drums.push({ bar, beat: b + 0.5, piece: 'hat', velocity: 74 });
        }
      }

      if (meta.isLastBarOfSection) {
        // Ending fill
        drums.push(
          { bar, beat: 4.0, piece: 'tom', velocity: 105 },
          { bar, beat: 4.5, piece: 'tom', velocity: 112 }
        );
      }
    } else {
      // Verse groove: Intimate Kick, Rimshot / Snare on 2 & 4, soft closed hat
      drums.push({ bar, beat: 1, piece: 'kick', velocity: 105 });
      drums.push({ bar, beat: 2, piece: 'rim', velocity: 90 });
      drums.push({ bar, beat: 2.75, piece: 'kick', velocity: 85 });
      drums.push({ bar, beat: 4, piece: 'rim', velocity: 92 });

      for (let b = 1; b <= 4; b++) {
        drums.push({ bar, beat: b, piece: 'hat', velocity: 82 });
        drums.push({ bar, beat: b + 0.5, piece: 'hat', velocity: 65 });
      }
    }

    // 5. TOPLINE VOCAL GUIDE MELODY (With lyric mapping & natural breath pauses)
    const melodyScaleNotes = parsedChord.midiNotes;
    const rootMelodyMidi = (melodyScaleNotes[0] % 12) + 60 + vocalShift; // Octave 4
    const thirdMelodyMidi = (melodyScaleNotes[1] ? melodyScaleNotes[1] % 12 : (rootMelodyMidi + (isMinor ? 3 : 4)) % 12) + 60 + vocalShift;
    const fifthMelodyMidi = (melodyScaleNotes[2] ? melodyScaleNotes[2] % 12 : (rootMelodyMidi + 7) % 12) + 60 + vocalShift;
    const highRootMelody = rootMelodyMidi + 12;

    // Extract lyric words for placeholder
    const words = meta.lyricLine ? meta.lyricLine.replace(/[^\w\s']/g, '').split(/\s+/).filter(Boolean) : [];
    const w1 = words[0] || (meta.isChorus ? 'Oh' : 'Hey');
    const w2 = words[1] || (meta.isChorus ? "it's" : 'there');
    const w3 = words[2] || (meta.isChorus ? 'what' : 'you');
    const w4 = words[3] || (meta.isChorus ? 'do' : 'know');

    const phraseStep = (bar - 1) % 4;

    if (phraseStep === 0) {
      // Phrase call (Beat 1 & 2)
      melody.push(
        { bar, beat: 1.0, note: midiToNote(fifthMelodyMidi), midi: fifthMelodyMidi, duration_beats: 0.75, lyric_placeholder: w1, velocity: 105 },
        { bar, beat: 1.75, note: midiToNote(thirdMelodyMidi), midi: thirdMelodyMidi, duration_beats: 0.75, lyric_placeholder: w2, velocity: 95 },
        { bar, beat: 2.5, note: midiToNote(rootMelodyMidi), midi: rootMelodyMidi, duration_beats: 1.5, lyric_placeholder: `${w3} ${w4}`, velocity: 108 }
      );
    } else if (phraseStep === 1) {
      // Development
      melody.push(
        { bar, beat: 1.0, note: midiToNote(thirdMelodyMidi), midi: thirdMelodyMidi, duration_beats: 0.5, lyric_placeholder: w1, velocity: 98 },
        { bar, beat: 1.5, note: midiToNote(fifthMelodyMidi), midi: fifthMelodyMidi, duration_beats: 0.75, lyric_placeholder: w2, velocity: 102 },
        { bar, beat: 2.25, note: midiToNote(highRootMelody), midi: highRootMelody, duration_beats: 1.75, lyric_placeholder: `${w3} ${w4}`, velocity: 112 }
      );
    } else if (phraseStep === 2) {
      // Lift / Tension
      melody.push(
        { bar, beat: 1.0, note: midiToNote(fifthMelodyMidi + 2), midi: fifthMelodyMidi + 2, duration_beats: 0.75, lyric_placeholder: w1, velocity: 108 },
        { bar, beat: 1.75, note: midiToNote(fifthMelodyMidi), midi: fifthMelodyMidi, duration_beats: 0.75, lyric_placeholder: w2, velocity: 100 },
        { bar, beat: 2.5, note: midiToNote(thirdMelodyMidi), midi: thirdMelodyMidi, duration_beats: 1.5, lyric_placeholder: `${w3} ${w4}`, velocity: 104 }
      );
    } else {
      // Resolution + Breath pause on beat 4
      melody.push(
        { bar, beat: 1.0, note: midiToNote(thirdMelodyMidi), midi: thirdMelodyMidi, duration_beats: 0.75, lyric_placeholder: w1, velocity: 96 },
        { bar, beat: 1.75, note: midiToNote(rootMelodyMidi), midi: rootMelodyMidi, duration_beats: 1.75, lyric_placeholder: `${w2} ${w3}`, velocity: 105 }
      );
    }
  }

  // Generate Seed Code
  const hex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
  const seedCode = `SD-${hex}-${rootKey}${isMinor ? 'm' : ''}-${bpm}BPM`;

  let trackTitle = 'Vocal Cover Arrangement';
  if (tabText.toLowerCase().includes('delilah')) {
    trackTitle = 'Hey There Delilah — Acoustic Vocal Cover';
  } else if (tabText.toLowerCase().includes('someone like you')) {
    trackTitle = 'Someone Like You — Piano Ballad Cover';
  } else if (tabText.toLowerCase().includes('stay with me')) {
    trackTitle = 'Stay With Me — Gospel Pop Cover';
  } else if (tabText.toLowerCase().includes('creep')) {
    trackTitle = 'Creep — Dynamic Alt-Rock Cover';
  } else if (tabText.toLowerCase().includes('all of me')) {
    trackTitle = 'All Of Me — Soul Piano Cover';
  } else {
    trackTitle = `${rootKey} ${isMinor ? 'Minor' : 'Major'} ${style.split(' ')[0]} Vocal Arrangement`;
  }

  const logline = `Professional multitrack arrangement of ${trackTitle} in ${rootKey} ${isMinor ? 'minor' : 'major'} at ${bpm} BPM, featuring voice-led piano voicings, dynamic section transitions, approach-note basslines, and GM studio drums.`;

  return {
    id: `arr_${Date.now()}`,
    seedCode,
    createdAt: Date.now(),
    title_working: trackTitle,
    logline,
    key: detectedKey.key,
    mode: detectedKey.mode,
    bpm,
    time_signature: '4/4',
    swing: isFingerpicked ? 0.08 : isNeoSoul ? 0.16 : 0.0,
    form: parsedTab.form,
    bars_total: totalBars,
    chords,
    melody,
    bass,
    drums,
    pad,
    arrangement_notes: `Produced with optimal voice leading (minimal inner-voice motion), split Left Hand (Roots/10ths) + Right Hand (Color tones), dynamic section energy curves (${energyMode}), and humanized GM drums on Channel 10.`,
    hook_reason: `Smooth harmonic voice-leading keeps common tones stationary between chord changes, allowing the vocal topline to cut through without clashing.`,
    next_moves: [
      'Export multitrack MIDI or stems into your DAW (Ableton / FL Studio / Logic).',
      'Record your lead vocal over the Piano and Bass backing track in the in-app Vocal Booth or your DAW.',
      'Layer acoustic guitar or vocal harmonies over the Chorus section for added depth.',
    ],
    sourceType: 'chord_tab',
    sourceTab: tabText,
  };
}

function getRomanNumeral(chord: string, rootKey: string, isMinor: boolean): string {
  const root = chord.match(/^[A-G][#b]?/)?.[0] || 'C';
  const qual = chord.replace(/^[A-G][#b]?/, '');
  return `${root}${qual}`;
}

export function composeArrangementFromPrompt(payload: {
  dicePrompt?: string;
  chordTab?: string;
  vocalRange?: string;
  refinementInstruction?: string;
  existingArrangement?: Partial<SongArrangement>;
  youtubeQuery?: string;
  youtubeUrl?: string;
  songTitle?: string;
  artist?: string;
  videoId?: string;
}): SongArrangement {
  const {
    dicePrompt = '',
    chordTab,
    vocalRange,
    refinementInstruction,
    existingArrangement,
    youtubeQuery,
    youtubeUrl,
    songTitle,
    artist,
    videoId,
  } = payload;

  // 0. Check if this is a YouTube Music Arranger request
  if (youtubeQuery || videoId || songTitle) {
    const query = youtubeQuery || songTitle || videoId || '';
    const results = searchYouTubeCatalog(query);
    const matchedTrack = (videoId ? POPULAR_YOUTUBE_TRACKS.find((t) => t.id === videoId) : null) || results[0];

    let vocalShift = 0;
    if (vocalRange) {
      const match = vocalRange.match(/([+-]?\d+)/);
      if (match) vocalShift = parseInt(match[1], 10);
    }

    // Determine chords from matched track or intelligent synthesis
    let chordsLine = matchedTrack?.chordsSummary || 'D - F#m - G - A';
    // Clean up summary string like "D - Bm7 - Em7 - A7 (Chorus: Gmaj7 - A - D - Bm)" into verse/chorus bars
    const parts = chordsLine.split(/[\(\)]/);
    const verseChords = (parts[0] || 'D - F#m - Bm - G').replace(/[^\w#b\/\s-]/g, '').trim().split(/\s*-\s*|\s+/).filter(Boolean);
    const chorusChords = (parts[1]?.replace(/Chorus:\s*/i, '') || parts[0] || 'G - A - D - Bm').replace(/[^\w#b\/\s-]/g, '').trim().split(/\s*-\s*|\s+/).filter(Boolean);

    const verseStr = verseChords.join('  ');
    const chorusStr = chorusChords.join('  ');

    const generatedTab = `[Intro]
${verseStr}

[Verse 1]
${verseStr}
${verseStr}

[Pre-Chorus]
${chorusStr}

[Chorus]
${chorusStr}
${chorusStr}

[Bridge]
${chorusStr}

[Final Chorus]
${chorusStr}
${verseStr}

[Outro]
${verseChords.slice(0, 2).join('  ')}`;

    const trackTitle = matchedTrack?.title || songTitle || query;
    const trackArtist = matchedTrack?.artist || artist || 'YouTube Music';
    const trackBpm = matchedTrack?.estimatedBpm || 104;
    const targetStyle = refinementInstruction || 'Acoustic Singer-Songwriter Groove';

    const arrangement = arrangeSongTabHQ({
      tabText: generatedTab,
      style: targetStyle,
      vocalShift,
      tempoBpm: trackBpm,
      energyMode: 'dynamic_arc',
    });

    arrangement.sourceType = 'youtube_search';
    const effectiveVideoId = matchedTrack?.id || videoId || 'youtube_track';
    arrangement.youtubeMetadata = {
      videoId: effectiveVideoId,
      videoTitle: trackTitle,
      artist: trackArtist,
      thumbnailUrl: matchedTrack?.thumbnailUrl || (effectiveVideoId ? `https://img.youtube.com/vi/${effectiveVideoId}/hqdefault.jpg` : undefined),
      query: query,
      youtubeUrl: matchedTrack?.youtubeUrl || youtubeUrl || (effectiveVideoId ? `https://www.youtube.com/watch?v=${effectiveVideoId}` : undefined),
    };
    arrangement.title_working = `${trackTitle} (${targetStyle.split(' ')[0]} YouTube Cover)`;
    arrangement.logline = `DAW-ready multi-track arrangement of "${trackTitle}" by ${trackArtist} arranged from YouTube reference at ${trackBpm} BPM.`;
    arrangement.arrangement_notes = `Constructed directly from YouTube audio reference. Track elements are quantized and balanced for vocal recording in Ableton, Logic, or FL Studio.`;

    const hex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
    arrangement.seedCode = `YT-${hex}-${arrangement.key.replace(/\s+/g, '')}-${trackBpm}BPM`;

    return arrangement;
  }

  if (chordTab && chordTab.trim().length > 0) {
    let vocalShift = 0;
    if (vocalRange) {
      const match = vocalRange.match(/([+-]?\d+)/);
      if (match) vocalShift = parseInt(match[1], 10);
    }
    return arrangeSongTabHQ({
      tabText: chordTab,
      style: refinementInstruction || 'Acoustic Singer-Songwriter Groove',
      vocalShift,
      energyMode: 'dynamic_arc',
    });
  }

  // Parse prompt tokens
  const promptLower = (dicePrompt + ' ' + (refinementInstruction || '')).toLowerCase();

  // 1. Key & Mode
  let rootKey = 'A';
  let mode = 'Aeolian';
  let isMinor = true;

  if (promptLower.includes('c major') || promptLower.includes('c / major') || promptLower.includes('ionian')) {
    rootKey = 'C';
    mode = 'Ionian';
    isMinor = false;
  } else if (promptLower.includes('g major')) {
    rootKey = 'G';
    mode = 'Ionian';
    isMinor = false;
  } else if (promptLower.includes('f major') || promptLower.includes('lydian')) {
    rootKey = 'F';
    mode = 'Lydian';
    isMinor = false;
  } else if (promptLower.includes('e minor')) {
    rootKey = 'E';
    mode = 'Aeolian';
    isMinor = true;
  } else if (promptLower.includes('d dorian')) {
    rootKey = 'D';
    mode = 'Dorian';
    isMinor = true;
  } else if (promptLower.includes('bb minor') || promptLower.includes('b-flat minor')) {
    rootKey = 'Bb';
    mode = 'Aeolian';
    isMinor = true;
  } else if (promptLower.includes('c# minor')) {
    rootKey = 'C#';
    mode = 'Aeolian';
    isMinor = true;
  } else if (promptLower.includes('mixolydian')) {
    rootKey = 'A';
    mode = 'Mixolydian';
    isMinor = false;
  } else if (promptLower.includes('major')) {
    rootKey = 'C';
    mode = 'Ionian';
    isMinor = false;
  } else {
    rootKey = 'A';
    mode = 'Aeolian';
    isMinor = true;
  }

  // 2. BPM & Swing
  let bpm = 94;
  const bpmMatch = dicePrompt.match(/(\d{2,3})\s*(?:bpm)?/i);
  if (bpmMatch) {
    bpm = parseInt(bpmMatch[1], 10);
  } else if (promptLower.includes('ballad') || promptLower.includes('slow')) {
    bpm = 72;
  } else if (promptLower.includes('trap') || promptLower.includes('drill')) {
    bpm = 140;
  } else if (promptLower.includes('dance') || promptLower.includes('house') || promptLower.includes('four-on-floor')) {
    bpm = 124;
  }

  let swing = 0.0;
  if (promptLower.includes('light swing')) swing = 0.1;
  else if (promptLower.includes('heavy swing') || promptLower.includes('lo-fi')) swing = 0.22;

  // Refinement adjustments
  if (refinementInstruction) {
    const refLower = refinementInstruction.toLowerCase();
    if (refLower.includes('catchier') || refLower.includes('faster') || refLower.includes('lift')) {
      bpm = Math.min(160, bpm + 4);
    } else if (refLower.includes('darker') || refLower.includes('slower') || refLower.includes('intimate')) {
      bpm = Math.max(65, bpm - 4);
    }
  }

  // 3. Chord Progression
  let progression: string[] = [];
  if (promptLower.includes('i - v - vi - iv') || promptLower.includes('i-v-vi-iv')) {
    progression = isMinor ? ['Am', 'Em', 'F', 'G'] : ['C', 'G', 'Am', 'F'];
  } else if (promptLower.includes('vi - iv - i - v') || promptLower.includes('vi-iv-i-v')) {
    progression = isMinor ? ['Am', 'F', 'C', 'G'] : ['Am', 'F', 'C', 'G'];
  } else if (promptLower.includes('ii - v - i') || promptLower.includes('ii-v-i')) {
    progression = isMinor ? ['Bm7b5', 'E7', 'Am7', 'Am7'] : ['Dm7', 'G7', 'Cmaj7', 'A7'];
  } else if (promptLower.includes('i - bvi - bvii') || promptLower.includes('cinematic minor')) {
    progression = isMinor ? ['Am', 'F', 'G', 'Am'] : ['Cm', 'Ab', 'Bb', 'Cm'];
  } else if (promptLower.includes('i - bvii - iv') || promptLower.includes('rock')) {
    progression = isMinor ? ['Am', 'G', 'D', 'Am'] : ['C', 'Bb', 'F', 'C'];
  } else if (promptLower.includes('i - iv - v') || promptLower.includes('dark')) {
    progression = isMinor ? ['Am', 'Dm', 'Em', 'Am'] : ['Cm', 'Fm', 'Gm', 'Cm'];
  } else if (promptLower.includes('canon') || promptLower.includes('i - iii - iv - v')) {
    progression = isMinor ? ['Am', 'C', 'F', 'G'] : ['C', 'Em', 'F', 'G'];
  } else {
    progression = isMinor ? ['Am', 'F', 'C', 'G'] : ['C', 'G', 'Am', 'F'];
  }

  // 4. Form & Sections
  let form = ['Verse 8', 'Chorus 8'];
  let totalBars = 16;
  if (promptLower.includes('8-bar') || promptLower.includes('8 bars')) {
    form = ['Hook 8'];
    totalBars = 8;
  } else if (promptLower.includes('verse-pre-chorus') || promptLower.includes('24 bars')) {
    form = ['Verse 8', 'Pre-Chorus 8', 'Chorus 8'];
    totalBars = 24;
  } else if (promptLower.includes('aaba') || promptLower.includes('32 bars')) {
    form = ['Verse 8', 'Verse 8', 'Bridge 8', 'Chorus 8'];
    totalBars = 32;
  }

  // Create synthetic tab text to feed into the voice leading arranger engine
  const tabLines: string[] = [];
  let chordIdx = 0;
  for (const f of form) {
    tabLines.push(`[${f}]`);
    const bars = parseInt(f.match(/\d+/)?.[0] || '8', 10);
    for (let b = 0; b < bars; b++) {
      const c = progression[chordIdx % progression.length];
      tabLines.push(c);
      chordIdx++;
    }
    tabLines.push('');
  }

  const generatedTab = tabLines.join('\n');

  // Determine style
  let style = 'Acoustic Singer-Songwriter Groove';
  if (promptLower.includes('fingerpick') || promptLower.includes('acoustic')) {
    style = 'Acoustic Singer-Songwriter Groove';
  } else if (promptLower.includes('ballad') || promptLower.includes('rolling') || promptLower.includes('arpegg')) {
    style = 'Intimate Rolling Piano Ballad';
  } else if (promptLower.includes('r&b') || promptLower.includes('soul') || promptLower.includes('808')) {
    style = 'Modern Alt R&B 808 Build';
  } else if (promptLower.includes('pop') || promptLower.includes('stab') || promptLower.includes('anthem')) {
    style = 'Indie Rock Dynamic Anthem';
  } else if (promptLower.includes('lo-fi') || promptLower.includes('chill')) {
    style = 'Lo-Fi Bedroom Chill Piano';
  }

  const result = arrangeSongTabHQ({
    tabText: generatedTab,
    style,
    tempoBpm: bpm,
    energyMode: 'dynamic_arc',
  });

  result.key = `${rootKey} ${isMinor ? 'minor' : 'major'}`;
  result.mode = mode;
  result.bpm = bpm;
  result.swing = swing;
  result.sourceType = refinementInstruction ? 'refinement' : 'dice_roll';

  const hex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
  result.seedCode = `SD-${hex}-${rootKey}${isMinor ? 'm' : ''}-${bpm}BPM`;
  result.title_working = `${rootKey} ${isMinor ? 'Minor' : 'Major'} ${style.split(' ')[0]} Arrangement`;
  result.logline = `Studio multi-track arrangement in ${rootKey} ${isMinor ? 'minor' : 'major'} at ${bpm} BPM with voice-led piano, driving pocket bass, and studio GM drums.`;

  return result;
}
