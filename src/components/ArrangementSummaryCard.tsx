import React, { useState } from 'react';
import {
  Sparkles,
  Music,
  Heart,
  Copy,
  Check,
  ArrowRight,
  Sliders,
  Share2,
  Lightbulb,
  ListOrdered,
  FileMusic,
  Youtube,
  ExternalLink,
} from 'lucide-react';
import { SongArrangement } from '../types/music';

interface ArrangementSummaryCardProps {
  arrangement: SongArrangement | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onSelectWorkflowTab?: (tab: 'export' | 'vocal' | 'refine') => void;
}

export const ArrangementSummaryCard: React.FC<ArrangementSummaryCardProps> = ({
  arrangement,
  isFavorite,
  onToggleFavorite,
  onSelectWorkflowTab,
}) => {
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  if (!arrangement) return null;

  const handleCopySeed = () => {
    navigator.clipboard.writeText(arrangement.seedCode);
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 2000);
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="w-full bg-[#14151C]/90 rounded-2xl border border-white/10 p-4 sm:p-5 shadow-xl space-y-3.5">
      {/* Top Banner: Title + Key/BPM Badges + Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
              ARRANGED BRIEF
            </span>

            {arrangement.youtubeMetadata && (
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
                <Youtube className="w-3 h-3 fill-red-400 text-red-400" />
                <span>REFERENCE</span>
              </span>
            )}

            <button
              onClick={handleCopySeed}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-950 border border-white/10 hover:border-amber-400/40 text-amber-300 text-xs font-mono transition-all"
              title="Copy session seed code"
            >
              <Share2 className="w-3 h-3 text-amber-400" />
              <span>{arrangement.seedCode}</span>
              {copiedSeed ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-60" />}
            </button>

            {arrangement.youtubeMetadata?.youtubeUrl && (
              <a
                href={arrangement.youtubeMetadata.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors font-mono"
              >
                <span>Original</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-['Outfit']">
            {arrangement.title_working}
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
            {arrangement.logline}
          </p>
        </div>

        {/* Badges and Favorite Toggle */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs font-mono font-bold text-amber-300">
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span>{arrangement.key}</span>
            <span className="text-zinc-500">({arrangement.mode})</span>
          </div>

          <div className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs font-mono font-bold text-zinc-200">
            <span>{arrangement.bpm} BPM</span>
          </div>

          <button
            onClick={onToggleFavorite}
            className={`p-1.5 rounded-lg border transition-all ${
              isFavorite
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-zinc-950 border-white/10 text-zinc-400 hover:text-rose-400'
            }`}
            title="Save to Favorites"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid: Why Hook Works + Next Moves Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Hook Insight */}
        {arrangement.hook_reason && (
          <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-white/10 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold font-mono uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Hook Analysis</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {arrangement.hook_reason}
            </p>
          </div>
        )}

        {/* Next Moves Checklist */}
        {arrangement.next_moves && arrangement.next_moves.length > 0 && (
          <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-white/10 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-mono uppercase tracking-wider">
              <ListOrdered className="w-3.5 h-3.5" />
              <span>DAW Next Moves</span>
            </div>
            <ul className="space-y-1.5">
              {arrangement.next_moves.map((move, idx) => {
                const isDone = completedSteps.includes(idx);
                return (
                  <li
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className="flex items-start gap-2 text-xs text-zinc-300 cursor-pointer group select-none"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border mt-0.5 flex items-center justify-center transition-all ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-zinc-950'
                          : 'border-white/20 group-hover:border-amber-400/60 bg-zinc-900'
                      }`}
                    >
                      {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className={isDone ? 'line-through text-zinc-500' : ''}>{move}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Form / Song Sections Strip */}
      {arrangement.form && arrangement.form.length > 0 && (
        <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider shrink-0">
            Structure:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {arrangement.form.map((section, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-zinc-950 border border-white/10 text-zinc-300 font-mono text-[11px]"
              >
                {section}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
