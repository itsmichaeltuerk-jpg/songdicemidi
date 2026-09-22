import React, { useState } from 'react';
import {
  Dice5,
  Music,
  Share2,
  History,
  Heart,
  HelpCircle,
  Check,
  RotateCcw,
  Youtube,
  Sliders,
} from 'lucide-react';
import { SongArrangement } from '../types/music';
import { VOCAL_RANGES } from '../services/chordParser';

interface HeaderProps {
  currentArrangement: SongArrangement | null;
  activeTab: 'dice' | 'youtube_song' | 'piano_cover';
  setActiveTab: (tab: 'dice' | 'youtube_song' | 'piano_cover') => void;
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
    <header className="border-b border-white/[0.08] bg-[#121318]/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 shadow-md shadow-amber-500/20 text-zinc-950 font-black">
            <Dice5 className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight text-white font-['Outfit']">
              SONG <span className="text-amber-400">DICE</span>
            </span>
            <span className="hidden sm:inline-block text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              PRODUCER
            </span>
          </div>
        </div>

        {/* Studio View Selector */}
        <nav className="flex items-center p-1 bg-zinc-900/90 rounded-xl border border-white/10 text-xs">
          <button
            id="tab-dice-btn"
            onClick={() => setActiveTab('dice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'dice'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Dice5 className="w-3.5 h-3.5" />
            <span>Dice Studio</span>
          </button>
          
          <button
            id="tab-youtube-song-btn"
            onClick={() => setActiveTab('youtube_song')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'youtube_song'
                ? 'bg-red-500 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">YouTube to MIDI</span>
            <span className="sm:hidden">YouTube</span>
          </button>

          <button
            id="tab-piano-cover-btn"
            onClick={() => setActiveTab('piano_cover')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'piano_cover'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tab Editor</span>
            <span className="sm:hidden">Tab</span>
          </button>
        </nav>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Vocal Key Shift */}
          <div className="hidden xl:flex items-center gap-1 bg-zinc-900/80 px-2 py-1 rounded-lg border border-white/10 text-xs font-mono">
            <Sliders className="w-3 h-3 text-amber-400" />
            <select
              value={vocalShift}
              onChange={(e) => setVocalShift(Number(e.target.value))}
              className="bg-transparent text-amber-300 font-semibold focus:outline-none cursor-pointer text-xs"
              title="Vocal Range Shift"
            >
              {VOCAL_RANGES.map((r) => (
                <option key={r.id} value={r.shift} className="bg-zinc-900 text-zinc-200">
                  {r.name} ({r.shift >= 0 ? `+${r.shift}` : r.shift})
                </option>
              ))}
            </select>
          </div>

          {/* Seed Code (Clean Pill) */}
          {currentArrangement && (
            <button
              onClick={handleCopySeed}
              title="Click to copy seed"
              className="hidden md:flex items-center gap-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg border border-white/10 text-xs font-mono transition-all"
            >
              <Share2 className="w-3 h-3 text-amber-400" />
              <span className="text-amber-400 font-semibold">{currentArrangement.seedCode}</span>
              {copiedSeed && <Check className="w-3 h-3 text-emerald-400" />}
            </button>
          )}

          {/* Recall Seed Code */}
          <button
            onClick={() => setShowSeedInput(!showSeedInput)}
            title="Recall Seed"
            className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 border border-white/10 transition-all text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Favorites */}
          <button
            onClick={onToggleFavorite}
            title={isFavorite ? 'Remove favorite' : 'Save favorite'}
            className={`p-1.5 rounded-lg border transition-all ${
              isFavorite
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-rose-400'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-400' : ''}`} />
          </button>

          {/* History */}
          <button
            onClick={onOpenHistory}
            title="Roll History"
            className="flex items-center gap-1 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-white/10 text-xs font-medium transition-all"
          >
            <History className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">History</span>
            {favoritesCount > 0 && (
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 rounded-full border border-amber-500/30">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Tour */}
          <button
            onClick={onOpenTour}
            title="Guide"
            className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 border border-white/10 transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Seed code recall dropdown */}
      {showSeedInput && (
        <form
          onSubmit={handleApplySeed}
          className="max-w-md mx-auto mt-2.5 p-1.5 bg-zinc-900 border border-amber-500/30 rounded-xl flex items-center gap-2 shadow-2xl"
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
