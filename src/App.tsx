import React, { useState, useEffect, useCallback } from 'react';
import { DEFAULT_DICE, OPTIONAL_DICE } from './services/diceConfig';
import { SongArrangement, DieConfig, VibeModifiers, TrackMixerChannel, YouTubeTrackItem } from './types/music';
import { composeArrangementFromState } from './services/fallbackArranger';
import { composeArrangementFromPrompt } from './services/proArranger';
import { audioEngine } from './services/audioEngine';
import { Header } from './components/Header';
import { DiceTable } from './components/DiceTable';
import { YouTubeSongArranger } from './components/YouTubeSongArranger';
import { PianoChordTabPanel } from './components/PianoChordTabPanel';
import { ArrangementSummaryCard } from './components/ArrangementSummaryCard';
import { ArrangementVisualizer } from './components/ArrangementVisualizer';
import { StickyTransport, StemMixer } from './components/TransportMixer';
import { CollapsibleSection } from './components/CollapsibleSection';
import { VocalBooth } from './components/VocalBooth';
import { ExportPanel } from './components/ExportPanel';
import { RefinementBar } from './components/RefinementBar';
import { HistoryModal } from './components/HistoryModal';
import { TourModal } from './components/TourModal';
import { Wand2, Mic, Download, Dice5, Youtube, Music, FileMusic, Sliders, Headphones, Layers } from 'lucide-react';
import { landProduceOrLocal, AI_MISSED_TOAST, AI_GENERATING_LABEL } from './audio/doorPlayback.ts';

export function App() {
  const [dice, setDice] = useState<DieConfig[]>(DEFAULT_DICE);
  const [optionalDice, setOptionalDice] = useState<DieConfig[]>(OPTIONAL_DICE);
  const [activeTab, setActiveTab] = useState<'dice' | 'youtube_song' | 'piano_cover'>('youtube_song');

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
  
  // Collapsible section states
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    generator: false,
    summary: false,
    visualizer: false,
    mixer: false,
    workbench: false,
  });

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExpandAll = () => {
    setCollapsedSections({
      generator: false,
      summary: false,
      visualizer: false,
      mixer: false,
      workbench: false,
    });
  };

  const handleCollapseAll = () => {
    setCollapsedSections({
      generator: true,
      summary: true,
      visualizer: true,
      mixer: true,
      workbench: true,
    });
  };

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
    let failureReason: string | null = null;
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
      } else {
        failureReason = data.reason || null;
      }
    } catch {
      // Offline mode or network interruption
    }

    const landed = landProduceOrLocal(produced, localFallback);
    setCurrentArrangement(landed.arrangement);
    audioEngine.loadArrangement(landed.arrangement);
    setBpm(landed.arrangement.bpm);
    setSwing(landed.arrangement.swing);
    setTakeSource(landed.source);
    if (landed.missed) {
      const notice = failureReason === 'credits-depleted'
        ? 'AI project credits depleted — rolled with Pro engine'
        : AI_MISSED_TOAST;
      setAiMissedNotice(notice);
      window.setTimeout(() => setAiMissedNotice(null), 3500);
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

  // Generate Arrangement from YouTube / YouTube Music search
  const handleGenerateFromYouTube = async (
    track: YouTubeTrackItem,
    coverStyle: string,
    shift: number
  ) => {
    setIsGenerating(true);
    setAiMissedNotice(null);
    setHeardCurrentTake(false);

    const localFallback = () =>
      composeArrangementFromPrompt({
        youtubeQuery: track.title,
        youtubeUrl: track.youtubeUrl,
        songTitle: track.title,
        artist: track.artist,
        videoId: track.id,
        refinementInstruction: coverStyle,
        vocalRange: shift !== 0 ? `Vocal transpose: ${shift} semitones` : undefined,
      });

    let produced: SongArrangement | null = null;
    let failureReason: string | null = null;
    try {
      const response = await fetch('/api/generate-arrangement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeQuery: track.title,
          youtubeUrl: track.youtubeUrl,
          songTitle: track.title,
          artist: track.artist,
          videoId: track.id,
          refinementInstruction: coverStyle,
          vocalRange: shift !== 0 ? `Vocal transpose: ${shift} semitones` : undefined,
        }),
      });

      const data = await response.json();
      if (data.success && data.source === 'ai' && data.arrangement) {
        produced = data.arrangement as SongArrangement;
      } else {
        failureReason = data.reason || null;
      }
    } catch {
      // Offline mode or network interruption
    }

    const landed = landProduceOrLocal(produced, localFallback);
    setCurrentArrangement(landed.arrangement);
    audioEngine.loadArrangement(landed.arrangement);
    setBpm(landed.arrangement.bpm);
    setSwing(landed.arrangement.swing);
    setTakeSource(landed.source);
    if (landed.missed) {
      const notice = failureReason === 'credits-depleted'
        ? 'AI project credits depleted — rolled with Pro engine'
        : AI_MISSED_TOAST;
      setAiMissedNotice(notice);
      window.setTimeout(() => setAiMissedNotice(null), 3500);
    }
    saveArrangementToHistory(landed.arrangement);
    setIsGenerating(false);
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

        {/* STICKY MASTER TRANSPORT & PLAYBACK CONTROLS (STICKS TO TOP WHEN SCROLLING) */}
        <StickyTransport
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
          currentBar={currentBar}
          currentBeat={currentBeat}
          totalBars={currentArrangement?.bars_total || 8}
          onToggleMixerSection={() => toggleSection('mixer')}
          isMixerCollapsed={collapsedSections.mixer}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          allCollapsed={Object.values(collapsedSections).every(Boolean)}
        />

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

        {/* SECTION 1: SONG GENERATOR & CREATIVE SPARK */}
        <CollapsibleSection
          id="section-generator"
          title={
            activeTab === 'dice'
              ? 'Song Dice Studio'
              : activeTab === 'youtube_song'
              ? 'YouTube Audio Reference'
              : 'Piano Chord Tab Editor'
          }
          icon={
            activeTab === 'dice' ? (
              <Dice5 className="w-4 h-4 text-amber-400" />
            ) : activeTab === 'youtube_song' ? (
              <Youtube className="w-4 h-4 text-red-400" />
            ) : (
              <Music className="w-4 h-4 text-amber-400" />
            )
          }
          badge={
            activeTab === 'dice' ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {dice.filter((d) => d.isLocked).length} / {dice.length} Locked
              </span>
            ) : activeTab === 'youtube_song' ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">
                Audio Reference
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Tab Parser
              </span>
            )
          }
          summaryWhenCollapsed={
            activeTab === 'dice'
              ? '7 Dice • Roll or lock layers'
              : activeTab === 'youtube_song'
              ? 'YouTube search & key transposition'
              : 'Chord tab text editor'
          }
          isCollapsed={collapsedSections.generator}
          onToggle={() => toggleSection('generator')}
        >
          {/* VIEW 1: YOUTUBE SONG ARRANGER */}
          {activeTab === 'youtube_song' && (
            <YouTubeSongArranger
              onGenerateFromYouTube={handleGenerateFromYouTube}
              isGenerating={isGenerating}
              vocalShift={vocalShift}
              setVocalShift={setVocalShift}
              onSwitchToManualTab={() => setActiveTab('piano_cover')}
            />
          )}

          {/* VIEW 2: DICE STUDIO TABLE */}
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

          {/* VIEW 3: PIANO CHORD TAB & VOCAL COVER GENERATOR */}
          {activeTab === 'piano_cover' && (
            <PianoChordTabPanel
              onGenerateCover={handleGenerateCover}
              isGenerating={isGenerating}
              vocalShift={vocalShift}
              setVocalShift={setVocalShift}
              onSwitchToYouTube={() => setActiveTab('youtube_song')}
            />
          )}
        </CollapsibleSection>

        {/* SECTION 2: ARRANGED BRIEF & HARMONIC PROGRESSION */}
        {currentArrangement && (
          <CollapsibleSection
            id="section-summary"
            title="Arrangement & Harmony"
            icon={<FileMusic className="w-4 h-4 text-amber-400" />}
            badge={
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {currentArrangement.key} {currentArrangement.mode} • {currentArrangement.bpm} BPM
              </span>
            }
            summaryWhenCollapsed={
              <span>
                "{currentArrangement.title_working}" • {currentArrangement.bars_total} Bars
              </span>
            }
            isCollapsed={collapsedSections.summary}
            onToggle={() => toggleSection('summary')}
          >
            <ArrangementSummaryCard
              arrangement={currentArrangement}
              isFavorite={isCurrentFavorite}
              onToggleFavorite={() => handleToggleFavorite()}
              onSelectWorkflowTab={(tab) => {
                setWorkbenchTab(tab);
                setCollapsedSections((prev) => ({ ...prev, workbench: false }));
              }}
            />
          </CollapsibleSection>
        )}

        {/* SECTION 3: PIANO ROLL & MULTI-TRACK TIMELINE */}
        <CollapsibleSection
          id="section-visualizer"
          title="Multi-Track Piano Roll"
          icon={<Music className="w-4 h-4 text-amber-400" />}
          badge={
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {currentArrangement?.bars_total || 8} Bars
            </span>
          }
          summaryWhenCollapsed="Interactive timeline (Melody, Keys, Bass, Drums)"
          isCollapsed={collapsedSections.visualizer}
          onToggle={() => toggleSection('visualizer')}
        >
          <ArrangementVisualizer
            arrangement={currentArrangement}
            currentBeat={currentBeat}
            currentBar={currentBar}
            totalBeats={(currentArrangement?.bars_total || 8) * 4}
            isPlaying={isPlaying}
            onSeek={handleSeek}
          />
        </CollapsibleSection>

        {/* SECTION 4: STUDIO TOOLS & DAW EXPORT (EXPORT • REFINE • VOCALS) */}
        <CollapsibleSection
          id="section-workbench"
          title="DAW Export & Studio Tools"
          icon={<Download className="w-4 h-4 text-amber-400" />}
          badge={
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              MIDI • Refine • Vocals
            </span>
          }
          summaryWhenCollapsed={
            workbenchTab === 'export'
              ? 'DAW Multitrack MIDI & Stems'
              : workbenchTab === 'vocal'
              ? 'Vocal Scratch Booth'
              : 'AI Arrangement Refinements'
          }
          isCollapsed={collapsedSections.workbench}
          onToggle={() => toggleSection('workbench')}
        >
          <div className="space-y-3">
            {/* Workbench Segmented Control */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center p-1 bg-zinc-950/80 rounded-xl border border-white/10 text-xs font-semibold">
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
              </div>
            </div>

            {/* Workbench Tool: DAW Multitrack MIDI & Stem Export */}
            {workbenchTab === 'export' && (
              <ExportPanel arrangement={currentArrangement} />
            )}

            {/* Workbench Tool: AI Refinements */}
            {workbenchTab === 'refine' && (
              <RefinementBar onRefine={handleRefine} isGenerating={isGenerating} />
            )}

            {/* Workbench Tool: Vocal Scratch Booth */}
            {workbenchTab === 'vocal' && (
              <VocalBooth
                isPlaying={isPlaying}
                onStartPlayback={handlePlay}
                onStopPlayback={handlePause}
              />
            )}
          </div>
        </CollapsibleSection>

        {/* SECTION 5: 5-CHANNEL MULTI-TRACK STEM MIXER */}
        <CollapsibleSection
          id="section-mixer"
          title="Stem Mixer"
          icon={<Sliders className="w-4 h-4 text-amber-400" />}
          badge={
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              5 Channels
            </span>
          }
          summaryWhenCollapsed="Lead, Keys, Pad, Bass & Drum Faders"
          isCollapsed={collapsedSections.mixer}
          onToggle={() => toggleSection('mixer')}
        >
          <StemMixer tracks={tracks} onUpdateTrack={handleUpdateTrack} />
        </CollapsibleSection>
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
