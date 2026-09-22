import React, { useState } from 'react';
import { Sparkles, Wand2, ArrowRight } from 'lucide-react';

interface RefinementBarProps {
  onRefine: (instruction: string) => void;
  isGenerating: boolean;
}

export const RefinementBar: React.FC<RefinementBarProps> = ({ onRefine, isGenerating }) => {
  const [customInstruction, setCustomInstruction] = useState('');

  const quickRefinements = [
    { label: '✨ Catchier Hook', instruction: 'Make the melody motif catchier with syncopated repetition' },
    { label: '🌙 Darker Mood', instruction: 'Make the arrangement moodier, darker, and more atmospheric' },
    { label: '🎤 Vocal Space', instruction: 'Simplify chord stabs and bass to leave space for lead vocal recording' },
    { label: '🚀 Pre-Chorus Lift', instruction: 'Add harmonic tension and building drum rolls leading to an anthemic chorus' },
    { label: '🎹 Felt Piano', instruction: 'Switch piano voicings to warm open chords and soft felt aesthetic' },
    { label: '🔥 808 Sub Slides', instruction: 'Add gliding 808 sub bass notes and snappy trap hi-hat rolls' },
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInstruction.trim()) {
      onRefine(customInstruction.trim());
      setCustomInstruction('');
    }
  };

  return (
    <div className="w-full bg-[#14151C]/90 p-4 sm:p-5 rounded-2xl border border-white/10 shadow-xl space-y-3">
      {/* Quick Refine Chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {quickRefinements.map((qr, idx) => (
          <button
            key={idx}
            onClick={() => onRefine(qr.instruction)}
            disabled={isGenerating}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-950/80 hover:bg-zinc-800 border border-white/10 hover:border-amber-500/30 text-zinc-300 text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
          >
            {qr.label}
          </button>
        ))}
      </div>

      {/* Custom Prompt Input */}
      <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-1">
        <input
          type="text"
          placeholder="Refine arrangement: e.g. 'Add walking jazz bass and syncopated piano chops'..."
          value={customInstruction}
          onChange={(e) => setCustomInstruction(e.target.value)}
          className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={isGenerating || !customInstruction.trim()}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 fill-zinc-950" />
          <span>Refine</span>
        </button>
      </form>
    </div>
  );
};
