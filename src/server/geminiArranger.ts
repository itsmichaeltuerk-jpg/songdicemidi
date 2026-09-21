import { GoogleGenAI, Type } from '@google/genai';
import { SongArrangement } from '../types/music';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function generateArrangementWithGemini(payload: {
  dicePrompt: string;
  chordTab?: string;
  vocalRange?: string;
  refinementInstruction?: string;
  existingArrangement?: Partial<SongArrangement>;
}): Promise<SongArrangement> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('no-key');
  }

  try {
    const ai = getAiClient();

    const prompt = `You are a platinum-level music producer, master arranger, and session pianist specializing in commercial bedroom pop, acoustic arrangements, and vocal cover backing tracks for DAWs (Ableton, Logic, FL Studio).
Your task is to take the input musical state or chord tab and compose an elite, professional-grade, multi-track MIDI arrangement.

INPUT BRIEF:
- Musical Dice & Parameters: ${payload.dicePrompt}
${payload.chordTab ? `- Piano Chord Tab / Song to Cover:\n${payload.chordTab}` : ''}
${payload.vocalRange ? `- Target Vocal Range / Transposition: ${payload.vocalRange}` : ''}
${payload.refinementInstruction ? `- Producer Refinement Directive: ${payload.refinementInstruction}` : ''}

CRITICAL RULES FOR PROFESSIONAL HIGH-QUALITY MIDI ARRANGEMENTS:
1. OPTIMAL VOICE LEADING FOR PIANO (Crucial):
   - Never output root-position triad blocks jumping erratically across octaves!
   - Apply classic voice-leading: smooth inner voices that move by step or remain common tones across chords.
   - Voicing format: Split Left Hand (Roots/5ths/10ths in octaves 2-3 like ["D2", "A2"]) and Right Hand (3rds, 7ths, 9ths, and color extensions in octaves 4-5 like ["F#4", "A4", "E5"]).
   - For acoustic songs (e.g. Delilah, folk, indie), generate authentic fingerpicking or arpeggiation patterns across beats 1, 1.5, 2, 2.5, 3, 3.5, 4.

2. SECTIONAL DYNAMIC ARC & ENERGY EVOLUTION:
   - Identify song sections (Intro, Verse, Pre-Chorus, Chorus, Bridge, Outro).
   - Intro: Intimate, soft piano fingerpicking, gentle ambient pad, light shaker or no drums (velocity 60-75).
   - Verse: Intimate groove, LH bass + RH smooth chords, pocket bass, rim-shot/cross-stick + closed hat (velocity 80-95).
   - Pre-Chorus / Build: Escalating rhythm, 8th-note driving bass, rising 4-on-floor kick or snare roll build (velocity 95-110).
   - Chorus: Full anthemic sonic drop! Rich 4-voice spread piano chords, driving melodic bass with octave jumps, driving kick/snare on 2 & 4 with sizzle open hats, and a crash cymbal on bar 1 downbeat (velocity 110-125).
   - Bridge: Harmonic reharmonization / breakdown dynamic contrast.
   - Outro: Resolving into a delicate final chord ring-out.

3. PUNCHY, REALISTIC BASSLINES:
   - Lock tightly with the kick drum on beat 1 and syncopated pockets (beat 2.5 / 3.5).
   - Include melodic passing / approach tones (half-step or whole-step approach) on beat 4 or 4.5 that smoothly resolve into the next bar's chord root.

4. STUDIO GM DRUM PROGRAMMING (Channel 10):
   - Use standard GM drum pieces: 'kick', 'snare', 'hat', 'open_hat', 'clap', 'rim', 'tom', 'crash', 'shaker'.
   - Add ghost notes (velocity 40-55 on snare/hat) for authentic groove and bounce.
   - Add crash cymbals on bar 1 of Chorus/Bridge sections and tom fills at the end of 4-bar and 8-bar phrases.

5. TOPLINE VOCAL GUIDE MELODY:
   - A memorable, singable vocal guide line tailored to the chords and lyric syllables extracted from the tab.
   - Natural vocal breathing pauses every 2-4 bars.

6. PRODUCER BRIEF:
   - Provide concrete, actionable DAW production steps, mix balance suggestions, and harmonic insights explaining why the arrangement works.

Return STRICT JSON matching the schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title_working: { type: Type.STRING, description: 'Working track title' },
            logline: { type: Type.STRING, description: 'One sentence vibe summary' },
            key: { type: Type.STRING, description: 'Key e.g. A minor' },
            mode: { type: Type.STRING, description: 'Mode e.g. Aeolian' },
            bpm: { type: Type.NUMBER, description: 'Tempo in BPM (e.g. 94)' },
            time_signature: { type: Type.STRING, description: 'Time signature e.g. 4/4' },
            swing: { type: Type.NUMBER, description: 'Swing amount 0.0 to 0.3' },
            form: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Song sections e.g. ["Verse 8", "Chorus 8"]',
            },
            bars_total: { type: Type.NUMBER, description: 'Total bars arranged (8, 16, or 24)' },
            chords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bar: { type: Type.NUMBER },
                  beat: { type: Type.NUMBER },
                  chord: { type: Type.STRING },
                  roman: { type: Type.STRING },
                  duration_beats: { type: Type.NUMBER },
                  inversion: { type: Type.STRING },
                  voicing: { type: Type.STRING },
                  notes: { type: Type.ARRAY, items: { type: Type.STRING } },
                  velocity: { type: Type.NUMBER },
                },
                required: ['bar', 'beat', 'chord', 'duration_beats', 'notes'],
              },
            },
            melody: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bar: { type: Type.NUMBER },
                  beat: { type: Type.NUMBER },
                  note: { type: Type.STRING },
                  duration_beats: { type: Type.NUMBER },
                  lyric_placeholder: { type: Type.STRING },
                  velocity: { type: Type.NUMBER },
                },
                required: ['bar', 'beat', 'note', 'duration_beats'],
              },
            },
            bass: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bar: { type: Type.NUMBER },
                  beat: { type: Type.NUMBER },
                  note: { type: Type.STRING },
                  duration_beats: { type: Type.NUMBER },
                  velocity: { type: Type.NUMBER },
                  articulation: { type: Type.STRING },
                },
                required: ['bar', 'beat', 'note', 'duration_beats'],
              },
            },
            drums: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bar: { type: Type.NUMBER },
                  beat: { type: Type.NUMBER },
                  piece: { type: Type.STRING },
                  velocity: { type: Type.NUMBER },
                },
                required: ['bar', 'beat', 'piece', 'velocity'],
              },
            },
            pad: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bar: { type: Type.NUMBER },
                  beat: { type: Type.NUMBER },
                  notes: { type: Type.ARRAY, items: { type: Type.STRING } },
                  duration_beats: { type: Type.NUMBER },
                  velocity: { type: Type.NUMBER },
                },
                required: ['bar', 'beat', 'notes', 'duration_beats'],
              },
            },
            arrangement_notes: { type: Type.STRING },
            hook_reason: { type: Type.STRING },
            next_moves: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'title_working',
            'logline',
            'key',
            'bpm',
            'bars_total',
            'chords',
            'bass',
            'drums',
            'arrangement_notes',
            'hook_reason',
            'next_moves',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    const rawJson = JSON.parse(text);
    const hexSeed = Math.random().toString(36).substring(2, 6).toUpperCase();
    const cleanKeyTag = (rawJson.key || 'Am').replace(/[^a-zA-Z0-9]/g, '');

    // Post-process note names and MIDI numbers
    const song: SongArrangement = {
      id: 'gemini_' + Date.now() + '_' + hexSeed,
      seedCode: `SD-${hexSeed}-${cleanKeyTag}-${rawJson.bpm || 94}`,
      createdAt: Date.now(),
      title_working: rawJson.title_working || 'Song Dice Arrangement',
      logline: rawJson.logline || 'A fresh DAW-ready arrangement.',
      key: rawJson.key || 'A minor',
      mode: rawJson.mode || 'Aeolian',
      bpm: rawJson.bpm || 94,
      time_signature: rawJson.time_signature || '4/4',
      swing: rawJson.swing || 0,
      form: rawJson.form || ['Verse 8', 'Chorus 8'],
      bars_total: rawJson.bars_total || 8,
      chords: (rawJson.chords || []).map((c: any) => ({
        bar: Number(c.bar) || 1,
        beat: Number(c.beat) || 1,
        chord: String(c.chord || 'Am'),
        roman: String(c.roman || 'i'),
        duration_beats: Number(c.duration_beats) || 4,
        inversion: c.inversion,
        voicing: c.voicing,
        notes: Array.isArray(c.notes) && c.notes.length > 0 ? c.notes : ['A3', 'C4', 'E4'],
        velocity: Number(c.velocity) || 90,
      })),
      melody: (rawJson.melody || []).map((m: any) => {
        const noteStr = String(m.note || 'E4');
        return {
          bar: Number(m.bar) || 1,
          beat: Number(m.beat) || 1,
          note: noteStr,
          midi: noteToMidiHelper(noteStr),
          duration_beats: Number(m.duration_beats) || 1,
          lyric_placeholder: m.lyric_placeholder || 'la',
          velocity: Number(m.velocity) || 105,
        };
      }),
      bass: (rawJson.bass || []).map((b: any) => {
        const noteStr = String(b.note || 'A1');
        return {
          bar: Number(b.bar) || 1,
          beat: Number(b.beat) || 1,
          note: noteStr,
          midi: noteToMidiHelper(noteStr, 1),
          duration_beats: Number(b.duration_beats) || 1,
          velocity: Number(b.velocity) || 110,
          articulation: b.articulation,
        };
      }),
      drums: (rawJson.drums || []).map((d: any) => ({
        bar: Number(d.bar) || 1,
        beat: Number(d.beat) || 1,
        piece: String(d.piece || 'kick') as any,
        velocity: Number(d.velocity) || 100,
      })),
      pad: (rawJson.pad || []).map((p: any) => {
        const notes = Array.isArray(p.notes) && p.notes.length > 0 ? p.notes : ['A3', 'C4', 'E4'];
        return {
          bar: Number(p.bar) || 1,
          beat: Number(p.beat) || 1,
          notes,
          midi_notes: notes.map(noteToMidiHelper),
          duration_beats: Number(p.duration_beats) || 4,
          velocity: Number(p.velocity) || 75,
        };
      }),
      arrangement_notes: rawJson.arrangement_notes || 'Arranged with balanced spacing for vocal recording.',
      hook_reason: rawJson.hook_reason || 'Built on memorable melodic motifs and strong bass foundation.',
      next_moves: Array.isArray(rawJson.next_moves)
        ? rawJson.next_moves
        : ['Import MIDI into DAW', 'Set tempo', 'Record vocals'],
      sourceType: payload.chordTab ? 'chord_tab' : payload.refinementInstruction ? 'refinement' : 'dice_roll',
      sourceTab: payload.chordTab,
    };

    return song;
  } catch (err) {
    throw err;
  }
}

function noteToMidiHelper(noteName: string, defaultOctave = 4): number {
  if (!noteName) return 60;
  const match = noteName.match(/^([A-Ga-g][#b]?)(-?\d+)?$/);
  if (!match) return 60;
  const pitch = match[1].toUpperCase();
  const oct = match[2] !== undefined ? parseInt(match[2], 10) : defaultOctave;
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let idx = notes.indexOf(pitch);
  if (idx === -1) {
    const flats = ['C', 'DB', 'D', 'EB', 'E', 'F', 'GB', 'G', 'AB', 'A', 'BB', 'B'];
    idx = flats.indexOf(pitch);
  }
  if (idx === -1) idx = 0;
  return (oct + 1) * 12 + idx;
}
