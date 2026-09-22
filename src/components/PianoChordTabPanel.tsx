import React, { useState, useEffect } from 'react';
import {
  Music,
  Play,
  Sparkles,
  Sliders,
  ArrowRight,
  Bookmark,
  RefreshCw,
  Info,
  Check,
  Youtube,
} from 'lucide-react';
import {
  SONG_COVER_PRESETS,
  VOCAL_RANGES,
  parseChordName,
  transposeTabText,
  extractChordsFromTab,
  detectKeyAndMode,
  NOTE_NAMES,
} from '../services/chordParser';
import { audioEngine } from '../services/audioEngine';
import { PianoChordPreset } from '../types/music';

interface PianoChordTabPanelProps {
  onGenerateCover: (tabText: string, stylePrompt: string, vocalRange: string) => void;
  isGenerating: boolean;
  vocalShift: number;
  setVocalShift: (shift: number) => void;
  onSwitchToYouTube?: () => void;
}

export const PianoChordTabPanel: React.FC<PianoChordTabPanelProps> = ({
  onGenerateCover,
  isGenerating,
  vocalShift,
  setVocalShift,
  onSwitchToYouTube,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('hey_there_delilah');
  const [tabText, setTabText] = useState<string>(SONG_COVER_PRESETS[0].tabText);
  const [coverStyle, setCoverStyle] = useState<string>('Acoustic Singer-Songwriter Groove');
  const [activeChordHover, setActiveChordHover] = useState<string>('D');
  const [detectedChords, setDetectedChords] = useState<string[]>([]);
  const [detectedKey, setDetectedKey] = useState<{ key: string; mode: string }>({
    key: 'D major',
    mode: 'Ionian',
  });

  // Extract chords and detect key when tab text changes
  useEffect(() => {
    const chords = extractChordsFromTab(tabText);
    setDetectedChords(chords);
    if (chords.length > 0) {
      const keyInfo = detectKeyAndMode(chords);
      setDetectedKey(keyInfo);
      setActiveChordHover(chords[0]);
    }
  }, [tabText]);

  const handleSelectPreset = (preset: PianoChordPreset) => {
    setSelectedPresetId(preset.id);
    setTabText(preset.tabText);
    setCoverStyle(preset.genre);
  };

  const handleTranspose = (semitones: number) => {
    setVocalShift(semitones);
    // If shift applied, transpose the tab text directly
    if (semitones !== 0) {
      const transposed = transposeTabText(tabText, semitones);
      setTabText(transposed);
    }
  };

  const handlePlayChordPreview = (chordName: string) => {
    setActiveChordHover(chordName);
    const parsed = parseChordName(chordName, 4);
    // Preview piano chord via audioEngine
    const ctx = (audioEngine as any).ctx;
    const masterGain = (audioEngine as any).masterGain;
    if (ctx && masterGain) {
      audioEngine.playPianoChord(parsed.notes, ctx.currentTime, 1.2, 0.9, masterGain);
    } else {
      // Trigger context initialization
      audioEngine.getAnalyser();
      audioEngine.playPianoChord(parsed.notes, 0, 1.2, 0.9, (audioEngine as any).masterGain);
    }
  };

  const handleKeyClick = (noteName: string) => {
    const ctx = (audioEngine as any).ctx;
    const masterGain = (audioEngine as any).masterGain;
    if (ctx && masterGain) {
      audioEngine.playPianoChord([noteName], ctx.currentTime, 0.8, 0.85, masterGain);
    }
  };

  const currentParsedChord = parseChordName(activeChordHover, 4);

  return (
    <section className="w-full bg-gradient-to-b from-[#181A20] via-[#141519] to-[#121316] p-4 sm:p-6 lg:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-extrabold text-amber-400 font-mono">
              PIANO CHORD TAB TO VOCAL COVER BACKING
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> DAW Ready
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 font-['Outfit']">
            Input Piano Chords & Arrange Your Vocal Cover
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            Paste any piano chord tab or select a cover song template. Gemini will arrange a
            multi-track backing track (Piano, Bass, Drums, Pad, and Guide Vocal Melody) structured
            for recording vocal covers in your DAW.
          </p>
        </div>

        {/* Generate Button */}
        <button
          id="generate-cover-btn"
          onClick={() => onGenerateCover(tabText, coverStyle, `Shift ${vocalShift} semitones`)}
          disabled={isGenerating || !tabText.trim()}
          className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs sm:text-sm font-black tracking-wide uppercase shadow-xl shadow-amber-500/25 border border-amber-400/50 transition-all active:scale-95 disabled:opacity-50 shrink-0"
        >
          <Sparkles className="w-4 h-4 fill-zinc-950" />
          <span>{isGenerating ? 'Arranging Cover...' : 'Arrange Vocal Cover MIDI'}</span>
        </button>
      </div>

      {/* Banner: Quick Switch to YouTube Search */}
      {onSwitchToYouTube && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-red-950/40 via-zinc-900 to-amber-950/30 rounded-2xl border border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/30 shrink-0">
              <Youtube className="w-4 h-4 fill-current" />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Want to skip pasting tabs entirely?</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded font-semibold">
                  NEW
                </span>
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Search any song on YouTube or YouTube Music to extract authentic chords and generate MIDI automatically.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSwitchToYouTube}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold font-mono tracking-wide flex items-center gap-1.5 transition-all shadow-md shadow-red-600/20 shrink-0"
          >
            <Youtube className="w-3.5 h-3.5 fill-current" />
            <span>Search on YouTube</span>
          </button>
        </div>
      )}

      {/* Cover Song Preset Buttons */}
      <div>
        <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-2">
          Popular Song Cover Presets
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {SONG_COVER_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30'
                    : 'bg-zinc-900/80 border-white/5 hover:bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold text-white line-clamp-1">{preset.title}</div>
                <div className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{preset.artist}</div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-amber-400">
                  <span>{preset.originalKey}</span>
                  <span>•</span>
                  <span>{preset.bpm} BPM</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Work Area: Tab Text Input + Theory / Vocal Range Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Tab Editor & Chord Chips */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span>Chord Tab & Lyrics Sheet</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const delilah = SONG_COVER_PRESETS.find(p => p.id === 'hey_there_delilah');
                  if (delilah) handleSelectPreset(delilah);
                }}
                className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-mono font-bold transition-all"
              >
                Load Delilah Tab
              </button>
              <button
                type="button"
                onClick={() => setTabText('')}
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-white/10 rounded-lg text-[10px] font-mono transition-all"
              >
                Clear
              </button>
              <div className="text-xs text-zinc-400 font-mono">
                Key: <span className="text-amber-300 font-bold">{detectedKey.key}</span>
              </div>
            </div>
          </div>

          {/* Tab Text Area */}
          <textarea
            id="chord-tab-input"
            rows={9}
            value={tabText}
            onChange={(e) => setTabText(e.target.value)}
            placeholder="Paste your chord progression e.g.:
[Intro]
D  F#m  D  F#m

[Verse 1]
D                            F#m
Hey there Delilah, what’s it like in New York City?
...
[Chorus]
D                       Bm  D                       Bm
Oh, it’s what you do to me..."
            className="w-full bg-zinc-950/90 border border-white/15 rounded-2xl p-4 text-xs sm:text-sm font-mono text-amber-200 focus:outline-none focus:border-amber-400/80 focus:ring-2 focus:ring-amber-500/20 leading-relaxed resize-y shadow-inner"
          />

          {/* Quick Detected Chords Chips (Click to hear piano voicing!) */}
          {detectedChords.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] text-zinc-400 font-mono">Detected Chords (tap to hear):</span>
              {Array.from(new Set(detectedChords)).slice(0, 10).map((c: string, idx: number) => (
                <button
                  key={`${c}_${idx}`}
                  onClick={() => handlePlayChordPreview(c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                    activeChordHover === c
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-amber-300 border-white/10 hover:border-amber-400/40'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Vocal Transposition & Arrangement Style */}
        <div className="lg:col-span-5 space-y-4 bg-zinc-950/60 p-4 sm:p-5 rounded-2xl border border-white/10">
          
          {/* Vocal Range & Transpose Helper */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Singer Vocal Range Helper</span>
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {vocalShift > 0 ? `+${vocalShift}` : vocalShift} semitones
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {VOCAL_RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleTranspose(r.shift)}
                  className={`p-2 rounded-xl text-left border transition-all text-xs ${
                    vocalShift === r.shift
                      ? 'bg-amber-500/20 border-amber-500/50 text-white font-bold'
                      : 'bg-zinc-900 border-white/5 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <div className="text-xs font-semibold">{r.name}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cover Arrangement Style & Dynamic Energy */}
          <div className="space-y-3">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block mb-1.5 flex items-center justify-between">
                <span>Piano Performance Style</span>
                <span className="text-[10px] text-amber-400 font-normal">Voice-Led Voicings</span>
              </span>
              <select
                value={coverStyle}
                onChange={(e) => setCoverStyle(e.target.value)}
                className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
              >
                <option value="Acoustic Singer-Songwriter Groove">Acoustic Fingerpicked (Delilah / Taylor Swift / Folk)</option>
                <option value="Intimate Rolling Piano Ballad">Intimate Rolling Arpeggio (Adele / Someone Like You)</option>
                <option value="Modern Alt R&B 808 Build">Modern Alt R&B Syncopated (Frank Ocean / SZA)</option>
                <option value="Indie Rock Dynamic Anthem">Driving Pop / Rock Stabs (Radiohead / Phoebe Bridgers)</option>
                <option value="Lo-Fi Bedroom Chill Piano">Lo-Fi Bedroom Chill Piano (Cozy, Dusty, Swung)</option>
                <option value="Gospel Soul Piano Stabs">Gospel Soul 7ths & 9ths (Sam Smith / Alicia Keys)</option>
                <option value="Cinematic Ambient Open Spread">Cinematic Ambient Open Spread (Atmospheric & Wide)</option>
              </select>
            </div>

            {/* Dynamic Energy Arc */}
            <div className="p-3 bg-zinc-900/70 rounded-xl border border-white/10">
              <div className="flex items-center justify-between text-[11px] font-mono mb-1 text-zinc-300">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Sectional Dynamic Arc:</span>
                </span>
                <span className="text-emerald-400 font-semibold">Intro → Verse → Chorus Drop</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-normal">
                Intro stays intimate & soft, builds with 8th-note driving bass into a full 4-voice Chorus with GM crash cymbals and tom fills.
              </p>
            </div>
          </div>

          {/* Current Chord Voicing Readout */}
          <div className="p-3 bg-zinc-900/90 rounded-xl border border-white/10 text-xs">
            <div className="flex items-center justify-between text-zinc-400 mb-1 font-mono text-[11px]">
              <span>Active Chord: <strong className="text-amber-300">{currentParsedChord.raw}</strong></span>
              <span>Root: <strong className="text-zinc-200">{currentParsedChord.root}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-zinc-500 text-[10px]">Voicing Notes:</span>
              {currentParsedChord.notes.map((n, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold">
                  {n}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Visual Interactive Piano Keyboard (61 keys preview) */}
      <div className="p-4 bg-zinc-950 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-zinc-400 uppercase">
            Visual Keyboard — Highlighted notes for <span className="text-amber-400">{currentParsedChord.raw}</span>
          </span>
          <span className="text-[11px] text-zinc-500">Tap any key to play tone</span>
        </div>

        {/* 2-Octave Visual Piano Keys */}
        <div className="relative flex items-start justify-center overflow-x-auto py-2">
          <div className="flex relative select-none">
            {/* Render 2 octaves from C3 to B4 */}
            {[3, 4].map((oct) => (
              <div key={oct} className="flex relative">
                {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((whiteNote) => {
                  const fullNote = `${whiteNote}${oct}`;
                  const isChordNote = currentParsedChord.notes.some((n) => n.startsWith(whiteNote) && n.endsWith(`${oct}`));
                  const isRoot = currentParsedChord.notes[0]?.startsWith(whiteNote) && currentParsedChord.notes[0]?.endsWith(`${oct}`);

                  return (
                    <div
                      key={fullNote}
                      onClick={() => handleKeyClick(fullNote)}
                      className={`relative w-8 sm:w-10 h-28 sm:h-32 border border-zinc-700 rounded-b-md transition-all cursor-pointer flex flex-col justify-end items-center pb-2 ${
                        isRoot
                          ? 'bg-amber-400 text-zinc-950 font-black shadow-lg shadow-amber-500/30'
                          : isChordNote
                          ? 'bg-amber-200 text-zinc-900 font-bold'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      <span className="text-[10px] font-mono font-semibold">{fullNote}</span>
                    </div>
                  );
                })}

                {/* Black Keys */}
                {['C#', 'D#', 'F#', 'G#', 'A#'].map((blackNote) => {
                  const fullBlack = `${blackNote}${oct}`;
                  const isChordNote = currentParsedChord.notes.some((n) => n.startsWith(blackNote) && n.endsWith(`${oct}`));
                  
                  let leftOffset = 'left-[22px] sm:left-[28px]';
                  if (blackNote === 'D#') leftOffset = 'left-[54px] sm:left-[68px]';
                  if (blackNote === 'F#') leftOffset = 'left-[118px] sm:left-[148px]';
                  if (blackNote === 'G#') leftOffset = 'left-[150px] sm:left-[188px]';
                  if (blackNote === 'A#') leftOffset = 'left-[182px] sm:left-[228px]';

                  return (
                    <div
                      key={fullBlack}
                      onClick={() => handleKeyClick(fullBlack)}
                      className={`absolute top-0 ${leftOffset} w-5 sm:w-6 h-16 sm:h-20 rounded-b-sm z-10 transition-all cursor-pointer flex items-end justify-center pb-1 ${
                        isChordNote
                          ? 'bg-amber-400 border border-amber-300 shadow-md text-zinc-950 font-black'
                          : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <span className="text-[8px] font-mono">{blackNote}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
