import React, { useState, useEffect, useCallback } from 'react';
import { DEFAULT_DICE, OPTIONAL_DICE } from './services/diceConfig';
import { SongArrangement, DieConfig, VibeModifiers, TrackMixerChannel } from './types/music';
import { composeArrangementFromState } from './services/fallbackArranger';
import { audioEngine } from './services/audioEngine';
import { Header } from './components/Header';
import { DiceTable } from './components/DiceTable';
import { PianoChordTabPanel } from './components/PianoChordTabPanel';
import { ArrangementSummaryCard } from './components/ArrangementSummaryCard';
import { ArrangementVisualizer } from './components/ArrangementVisualizer';
import { TransportMixer } from './components/TransportMixer';
import { VocalBooth } from './components/VocalBooth';
import { ExportPanel } from './components/ExportPanel';
import { RefinementBar } from './components/RefinementBar';
import { HistoryModal } from './components/HistoryModal';
import { TourModal } from './components/TourModal';
import { Wand2, Mic, Download } from 'lucide-react';
import { landProduceOrLocal, AI_MISSED_TOAST, AI_GENERATING_LABEL } from './audio/doorPlayback.ts';

export function App() {
  const [dice, setDice] = useState<DieConfig[]>(DEFAULT_DICE);
  const [optionalDice, setOptionalDice] = useState<DieConfig[]>(OPTIONAL_DICE);
  const [activeTab, setActiveTab] = useState<'dice' | 'piano_cover'>('dice');

  const [currentArrangement, setCurrentArrangement] = useState<SongArrangement | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [currentBar, setCurrentBar] = useState<number>(1);
  const [bpm, setBpm] = useState<number>(94);
  const [swing, setSwing] = useState<number>(0.12);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [isMetronomeOn, setIsMetronomeOn] = useState<boolean>(false);

  // Mixer Tracks
  const [tracks, setTracks] = useState<Record<string, TrackMixerChannel>>({
    melody: { name: 'melody', volume: 0.9, pan: 0, muted: false, solo: false, color: '#38BDF8' },
    chords: { name: 'chords', volume: 0.95, pan: -0.2, muted: false, solo: false, color: '#F59E0B' },
    pad: { name: 'pad', volume: 0.7, pan: 0.2, muted: false, solo: false, color: '#EAB308' },
    bass: { name: 'bass', volume: 1.0, pan: 0, muted: false, solo: false, color: '#EC4899' },
    drums: { name: 'drums', volume: 1.0, pan: 0, muted: false, solo: false, color: '#10B981' },
  });

  // Vibe & Vocal helpers
  const [vibe, setVibe] = useState<VibeModifiers>({
    darkness: 30,
    catchiness: 85,
    complexity: 40,
    space: 50,
  });
  const [vocalShift, setVocalShift] = useState<number>(0);

  // History & Favorites
  const [history, setHistory] = useState<SongArrangement[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showTourModal, setShowTourModal] = useState<boolean>(false);
  const [aiMissedNotice, setAiMissedNotice] = useState<string | null>(null);
  const [takeSource, setTakeSource] = useState<'ai' | 'local' | null>(null);
  const [heardCurrentTake, setHeardCurrentTake] = useState(false);
  const [keepNotice, setKeepNotice] = useState<string | null>(null);
  const [workbenchTab, setWorkbenchTab] = useState<'all' | 'export' | 'vocal' | 'refine'>('export');

  // Audio playback listener
  useEffect(() => {
    audioEngine.onPlaybackUpdate = (beat: number, isPlayingStatus: boolean) => {
      setCurrentBeat(beat);
      const bar = Math.floor(beat / 4) + 1;
      setCurrentBar(bar);
      setIsPlaying(isPlayingStatus);
    };

    // Load initial history and favorites from localStorage
    try {
      const savedHistory = localStorage.getItem('songdice_history');
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      const savedFavs = localStorage.getItem('songdice_favorites');
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }

    // Initial instant arrangement generation on first load (in under 10 seconds)
    const initialArrangement = composeArrangementFromState({
      dice: DEFAULT_DICE,
      vibe: { darkness: 30, catchiness: 85, complexity: 40, space: 50 },
    });
    setCurrentArrangement(initialArrangement);
    audioEngine.loadArrangement(initialArrangement);
    setBpm(initialArrangement.bpm);
    setSwing(initialArrangement.swing);
  }, []);

  // Save to history helper
  const saveArrangementToHistory = useCallback((arr: SongArrangement) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.id !== arr.id);
      const updated = [arr, ...filtered].slice(0, 25);
      try {
        localStorage.setItem('songdice_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Save to favorites helper
  const handleToggleFavorite = (id?: string) => {
    const targetId = id || (currentArrangement ? currentArrangement.id : null);
    if (!targetId) return;

    setFavorites((prev) => {
      let updated: string[];
      if (prev.includes(targetId)) {
        updated = prev.filter((item) => item !== targetId);
      } else {
        updated = [...prev, targetId];
      }
      try {
        localStorage.setItem('songdice_favorites', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Lock / Unlock Die
  const handleToggleLock = (id: string) => {
    setDice((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isLocked: !d.isLocked } : d))
    );
  };

  // Toggle Optional Die in Tray
  const handleToggleOptionalDie = (id: string) => {
    setOptionalDice((prev) =>
      prev.map((d) => (d.id === id ? { ...d, enabled: !d.enabled } : d))
    );
  };

  // Select Face directly
  const handleSelectFace = (dieId: string, faceIndex: number) => {
    setDice((prev) =>
      prev.map((d) => (d.id === dieId ? { ...d, selectedFaceIndex: faceIndex } : d))
    );
    setOptionalDice((prev) =>
      prev.map((d) => (d.id === dieId ? { ...d, selectedFaceIndex: faceIndex } : d))
    );
  };

  // Generate arrangement from Gemini (or fallback)
  const triggerArrangementGeneration = async (
    customDice?: DieConfig[],
    tabInput?: string,
    refinementInstruction?: string
  ) => {
    setIsGenerating(true);
    setAiMissedNotice(null);
    setHeardCurrentTake(false);
    const activeDice = customDice || dice;

    const diceSummary = activeDice
      .map((d) => `${d.name}: ${d.faces[d.selectedFaceIndex]?.label || ''}`)
      .join(' | ');

    const localFallback = () =>
      composeArrangementFromState({
        dice: activeDice,
        customTab: tabInput,
        vibe,
        sourceType: tabInput ? 'chord_tab' : refinementInstruction ? 'refinement' : 'dice_roll',
      });

    let produced = null;
    try {
      const response = await fetch('/api/generate-arrangement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dicePrompt: diceSummary,
          chordTab: tabInput,
          vocalRange: vocalShift !== 0 ? `Vocal transpose: ${vocalShift} semitones` : undefined,
          refinementInstruction,
          existingArrangement: currentArrangement || undefined,
        }),
      });
      const data = await response.json();
      if (data.success && data.source === 'ai' && data.arrangement) {
        produced = data.arrangement as SongArrangement;
      }
    } catch (err) {
      console.warn('Gemini API call returned error or offline, using fallback arranger:', err);
    }

    const landed = landProduceOrLocal(produced, localFallback);
    setCurrentArrangement(landed.arrangement);
    audioEngine.loadArrangement(landed.arrangement);
    setBpm(landed.arrangement.bpm);
    setSwing(landed.arrangement.swing);
    setTakeSource(landed.source);
    if (landed.missed) {
      setAiMissedNotice(AI_MISSED_TOAST);
      window.setTimeout(() => setAiMissedNotice(null), 3000);
    }
    saveArrangementToHistory(landed.arrangement);
    setIsGenerating(false);
  };

  // ROLL ALL DICE
  const handleRollAll = () => {
    setIsRolling(true);
    // Animate unlocked dice
    const updatedDice = dice.map((d) => {
      if (!d.isLocked) {
        const newFaceIdx = Math.floor(Math.random() * d.faces.length);
        return { ...d, selectedFaceIndex: newFaceIdx };
      }
      return d;
    });
    setDice(updatedDice);

    setTimeout(() => {
      setIsRolling(false);
      triggerArrangementGeneration(updatedDice);
    }, 700);
  };

  // REROLL UNLOCKED DICE ONLY
  const handleRollUnlocked = () => {
    setIsRolling(true);
    const updatedDice = dice.map((d) => {
      if (!d.isLocked) {
        const newFaceIdx = Math.floor(Math.random() * d.faces.length);
        return { ...d, selectedFaceIndex: newFaceIdx };
      }
      return d;
    });
    setDice(updatedDice);

    setTimeout(() => {
      setIsRolling(false);
      triggerArrangementGeneration(updatedDice);
    }, 700);
  };

  // Generate Vocal Cover from Piano Chord Tab
  const handleGenerateCover = (tabText: string, stylePrompt: string, vocalRangeStr: string) => {
    triggerArrangementGeneration(undefined, tabText, `Production style: ${stylePrompt}. ${vocalRangeStr}`);
  };

  // Gemini Producer Refinement
  const handleRefine = (instruction: string) => {
    triggerArrangementGeneration(undefined, currentArrangement?.sourceTab, instruction);
  };

  // Transport Handlers
  const handlePlay = () => {
    setHeardCurrentTake(true);
    audioEngine.setBpm(bpm);
    audioEngine.setSwing(swing);
    audioEngine.play();
  };

  const handleKeep = () => {
    if (!currentArrangement || !heardCurrentTake) return;
    saveArrangementToHistory(currentArrangement);
    if (!favorites.includes(currentArrangement.id)) {
      handleToggleFavorite(currentArrangement.id);
    }
    setKeepNotice('Kept in Library');
    window.setTimeout(() => setKeepNotice(null), 2500);
  };

  const handlePause = () => {
    audioEngine.pause();
  };

  const handleStop = () => {
    audioEngine.stop();
  };

  const handleSeek = (targetBeat: number) => {
    audioEngine.seek(targetBeat);
  };

  // Mixer Channel Update
  const handleUpdateTrack = (name: string, updates: Partial<TrackMixerChannel>) => {
    setTracks((prev) => {
      const updated = { ...prev, [name]: { ...prev[name], ...updates } };
      if (updates.volume !== undefined) audioEngine.setTrackVolume(name, updates.volume);
      if (updates.pan !== undefined) audioEngine.setTrackPan(name, updates.pan);
      const isMute = updates.mute ?? updates.muted;
      if (isMute !== undefined) audioEngine.setTrackMute(name, isMute);
      if (updates.solo !== undefined) audioEngine.setTrackSolo(name, updates.solo);
      return updated;
    });
  };

  // Restore from history or seed
  const handleRestore = (arr: SongArrangement) => {
    setCurrentArrangement(arr);
    audioEngine.loadArrangement(arr);
    setBpm(arr.bpm);
    setSwing(arr.swing);
  };

  const handleLoadSeed = (seedCode: string) => {
    // Check if in history or construct
    const found = history.find((h) => h.seedCode.toLowerCase() === seedCode.toLowerCase());
    if (found) {
      handleRestore(found);
      return;
    }
    // Otherwise roll matching BPM and key from seed tag
    handleRollAll();
  };

  // Keyboard Shortcuts (Space: Play/Pause, R: Roll Unlocked, E: Export)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) handlePause();
        else handlePlay();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRollUnlocked();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, dice]);

  const isCurrentFavorite = currentArrangement
    ? favorites.includes(currentArrangement.id)
    : false;

  return (
    <div className="min-h-screen bg-[#0F1014] text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-amber-500 selection:text-zinc-950">
      
      {/* Studio Header */}
      <Header
        currentArrangement={currentArrangement}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        vocalShift={vocalShift}
        setVocalShift={setVocalShift}
        onOpenHistory={() => setShowHistoryModal(true)}
        onOpenTour={() => setShowTourModal(true)}
        onLoadSeed={handleLoadSeed}
        isFavorite={isCurrentFavorite}
        onToggleFavorite={handleToggleFavorite}
        favoritesCount={favorites.length}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {(aiMissedNotice || keepNotice || isGenerating) && (
          <div
            className="text-center text-xs font-mono"
            data-toast={aiMissedNotice ? 'ai-missed' : keepNotice ? 'kept' : 'generating'}
          >
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-amber-200">
              {aiMissedNotice || keepNotice || AI_GENERATING_LABEL}
            </span>
          </div>
        )}

        <ArrangementVisualizer
          arrangement={currentArrangement}
          currentBeat={currentBeat}
          currentBar={currentBar}
          totalBeats={(currentArrangement?.bars_total || 8) * 4}
          isPlaying={isPlaying}
          onSeek={handleSeek}
        />

        <TransportMixer
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          heardCurrentTake={heardCurrentTake}
          onKeep={handleKeep}
          bpm={bpm}
          setBpm={(newBpm) => {
            setBpm(newBpm);
            audioEngine.setBpm(newBpm);
          }}
          swing={swing}
          setSwing={(newSwing) => {
            setSwing(newSwing);
            audioEngine.setSwing(newSwing);
          }}
          isLooping={isLooping}
          setIsLooping={(loop) => {
            setIsLooping(loop);
            audioEngine.setLooping(loop);
          }}
          isMetronomeOn={isMetronomeOn}
          setIsMetronomeOn={(on) => {
            setIsMetronomeOn(on);
            audioEngine.setMetronome(on);
          }}
          tracks={tracks}
          onUpdateTrack={handleUpdateTrack}
        />

        {activeTab === 'dice' && (
          <DiceTable
            dice={dice}
            optionalDice={optionalDice}
            isRolling={isRolling}
            isGenerating={isGenerating}
            onToggleLock={handleToggleLock}
            onRollAll={handleRollAll}
            onRollUnlocked={handleRollUnlocked}
            onSelectFace={handleSelectFace}
            onToggleOptionalDie={handleToggleOptionalDie}
            vibe={vibe}
            setVibe={setVibe}
          />
        )}

        {activeTab === 'piano_cover' && (
          <PianoChordTabPanel
            onGenerateCover={handleGenerateCover}
            isGenerating={isGenerating}
            vocalShift={vocalShift}
            setVocalShift={setVocalShift}
          />
        )}

        {currentArrangement && (
          <ArrangementSummaryCard
            arrangement={currentArrangement}
            isFavorite={isCurrentFavorite}
            onToggleFavorite={() => handleToggleFavorite()}
            onSelectWorkflowTab={(tab) => setWorkbenchTab(tab)}
          />
        )}

        {/* STUDIO WORKBENCH TOOLS & TAB BAR */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400 font-mono">
                STUDIO WORKBENCH
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-xs text-zinc-400">Refine • Record Scratch Vocals • Export DAW MIDI</span>
            </div>

            {/* Workbench Segmented Control */}
            <div className="flex items-center p-1 bg-zinc-900/90 rounded-xl border border-white/10 text-xs font-semibold">
              <button
                onClick={() => setWorkbenchTab('export')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  workbenchTab === 'export'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>DAW Export</span>
              </button>

              <button
                onClick={() => setWorkbenchTab('vocal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  workbenchTab === 'vocal'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Vocal Booth</span>
              </button>

              <button
                onClick={() => setWorkbenchTab('refine')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  workbenchTab === 'refine'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Refine</span>
              </button>
            </div>
          </div>

          {/* Workbench Tool 1: AI Refinements */}
          {(workbenchTab === 'all' || workbenchTab === 'refine') && (
            <RefinementBar onRefine={handleRefine} isGenerating={isGenerating} />
          )}

          {/* Workbench Tool 2: Vocal Scratch Booth */}
          {(workbenchTab === 'all' || workbenchTab === 'vocal') && (
            <VocalBooth
              isPlaying={isPlaying}
              onStartPlayback={handlePlay}
              onStopPlayback={handlePause}
            />
          )}

          {/* Workbench Tool 3: DAW Multitrack MIDI & Stem Export */}
          {(workbenchTab === 'all' || workbenchTab === 'export') && (
            <ExportPanel arrangement={currentArrangement} />
          )}
        </div>
      </main>

      {/* History Drawer Modal */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={history}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        onRestore={handleRestore}
        onClearHistory={() => {
          setHistory([]);
          try {
            localStorage.removeItem('songdice_history');
          } catch (e) {}
        }}
      />

      {/* 30s Bedroom Producer Tour Modal */}
      <TourModal isOpen={showTourModal} onClose={() => setShowTourModal(false)} />

      {/* Bottom Sticky Keyboard Helper Bar */}
      <footer className="border-t border-white/5 bg-[#121316]/90 backdrop-blur-sm py-3 px-4 text-center text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-[11px]">
            <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-zinc-300">Space</kbd> Play/Stop</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-zinc-300">R</kbd> Reroll Unlocked</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-zinc-300">Tap Die</kbd> Lock/Unlock</span>
          </div>
          <span className="text-zinc-600 text-[10px]">
            SONG DICE • Studio Arranger & Vocal Cover DAW Backing Engine
          </span>
        </div>
      </footer>
    </div>
  );
}
export default App;
