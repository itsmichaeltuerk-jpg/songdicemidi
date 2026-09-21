import React, { useState } from 'react';
import {
  Dice5,
  Music,
  Share2,
  History,
  Heart,
  HelpCircle,
  Sparkles,
  Sliders,
  Check,
  RotateCcw,
} from 'lucide-react';
import { SongArrangement } from '../types/music';
import { VOCAL_RANGES } from '../services/chordParser';

interface HeaderProps {
  currentArrangement: SongArrangement | null;
  activeTab: 'dice' | 'piano_cover';
  setActiveTab: (tab: 'dice' | 'piano_cover') => void;
  vocalShift: number;
  setVocalShift: (shift: number) => void;
  onOpenHistory: () => void;
  onOpenTour: () => void;
  onLoadSeed: (seed: string) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  favoritesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentArrangement,
  activeTab,
  setActiveTab,
  vocalShift,
  setVocalShift,
  onOpenHistory,
  onOpenTour,
  onLoadSeed,
  isFavorite,
  onToggleFavorite,
  favoritesCount,
}) => {
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [showSeedInput, setShowSeedInput] = useState(false);
  const [seedInputVal, setSeedInputVal] = useState('');

  const handleCopySeed = () => {
    if (!currentArrangement) return;
    navigator.clipboard.writeText(currentArrangement.seedCode);
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 2000);
  };

  const handleApplySeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (seedInputVal.trim()) {
      onLoadSeed(seedInputVal.trim());
      setShowSeedInput(false);
      setSeedInputVal('');
    }
  };

  return (
    <header className="border-b border-white/10 bg-[#16181D]/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Metaphor */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20 text-white font-black text-xl tracking-tighter ring-1 ring-amber-400/40">
            <Dice5 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white font-['Outfit']">
                SONG <span className="text-amber-400">DICE</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                PRODUCER AI
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-normal hidden sm:block">
              Roll a starting point. Export the MIDI. Finish the song.
            </p>
          </div>
        </div>

        {/* View Switcher: Dice Table vs Piano Chord Tab / Vocal Cover */}
        <div className="flex items-center p-1 bg-zinc-900/90 rounded-xl border border-white/10 shadow-inner">
          <button
            id="tab-dice-btn"
            onClick={() => setActiveTab('dice')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'dice'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Dice5 className="w-3.5 h-3.5" />
            <span>Dice Studio</span>
          </button>
          <button
            id="tab-piano-cover-btn"
            onClick={() => setActiveTab('piano_cover')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'piano_cover'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Piano Chord Tab & Vocal Cover</span>
          </button>
        </div>

        {/* Top Actions: Seed Code, Vocal Transpose, History, Tour */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Vocal Key Transpose Helper */}
          <div className="hidden lg:flex items-center gap-1.5 bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-white/10 text-xs">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400 text-[11px]">Vocal Key:</span>
            <select
              value={vocalShift}
              onChange={(e) => setVocalShift(Number(e.target.value))}
              className="bg-transparent text-amber-300 font-mono text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {VOCAL_RANGES.map((r) => (
                <option key={r.id} value={r.shift} className="bg-zinc-900 text-zinc-200">
                  {r.name} ({r.shift >= 0 ? `+${r.shift}` : r.shift})
                </option>
              ))}
            </select>
          </div>

          {/* Seed / Share Code Badge */}
          {currentArrangement && (
            <div className="relative">
              <button
                onClick={handleCopySeed}
                title="Click to copy session seed code"
                className="flex items-center gap-1.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-white/10 text-xs font-mono transition-all group"
              >
                <Share2 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-400" />
                <span className="text-amber-400 font-semibold">{currentArrangement.seedCode}</span>
                {copiedSeed ? (
                  <span className="text-emerald-400 text-[10px] flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Copied
                  </span>
                ) : null}
              </button>
            </div>
          )}

          {/* Load Seed Toggle */}
          <button
            onClick={() => setShowSeedInput(!showSeedInput)}
            title="Load a Seed Code"
            className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 border border-white/10 transition-all text-xs"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Favorites */}
          <button
            onClick={onToggleFavorite}
            title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            className={`p-1.5 rounded-lg border transition-all ${
              isFavorite
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-rose-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-400' : ''}`} />
          </button>

          {/* History Drawer Trigger */}
          <button
            onClick={onOpenHistory}
            title="Roll History & Saved Sessions"
            className="flex items-center gap-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 px-2.5 py-1.5 rounded-lg border border-white/10 text-xs font-medium transition-all"
          >
            <History className="w-4 h-4 text-zinc-400" />
            <span className="hidden sm:inline">History</span>
            {favoritesCount > 0 && (
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-amber-500/30">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* 30s Tour Guide */}
          <button
            onClick={onOpenTour}
            title="Quick 30-Second Tour"
            className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 border border-white/10 transition-all"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Seed code popup bar */}
      {showSeedInput && (
        <form
          onSubmit={handleApplySeed}
          className="max-w-md mx-auto mt-3 p-2 bg-zinc-900 border border-amber-500/30 rounded-xl flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-2"
        >
          <input
            type="text"
            placeholder="Paste Seed Code (e.g. SD-7F3A-Am-102)"
            value={seedInputVal}
            onChange={(e) => setSeedInputVal(e.target.value)}
            className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg transition-all"
          >
            Recall
          </button>
          <button
            type="button"
            onClick={() => setShowSeedInput(false)}
            className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300"
          >
            Cancel
          </button>
        </form>
      )}
    </header>
  );
};
