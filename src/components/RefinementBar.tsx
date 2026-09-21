import React, { useState } from 'react';
import { Sparkles, Wand2, ArrowRight } from 'lucide-react';

interface RefinementBarProps {
  onRefine: (instruction: string) => void;
  isGenerating: boolean;
}

export const RefinementBar: React.FC<RefinementBarProps> = ({ onRefine, isGenerating }) => {
  const [customInstruction, setCustomInstruction] = useState('');

  const quickRefinements = [
    { label: '✨ Make it Catchier', instruction: 'Make the melody motif catchier with syncopated repetition' },
    { label: '🌙 Make it Darker', instruction: 'Make the arrangement moodier, darker, and more atmospheric' },
    { label: '🎤 Simplify for Vocal Topline', instruction: 'Simplify the chord stabs and bass to leave maximum frequency space for lead vocal recording' },
    { label: '🚀 Add Pre-Chorus Lift', instruction: 'Add harmonic tension and building drum rolls leading to an anthemic chorus' },
    { label: '🎹 Intimate Felt Piano', instruction: 'Switch piano voicings to warm open chords and soft felt aesthetic' },
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
    <div className="w-full bg-gradient-to-b from-[#181A20] via-[#141519] to-[#121316] p-4 sm:p-5 rounded-3xl border border-white/10 shadow-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-amber-400" />
          <span className="text-xs uppercase tracking-wider font-extrabold text-amber-400 font-mono">
            GEMINI PRODUCER REFINEMENTS
          </span>
        </div>
        <span className="text-[11px] text-zinc-400">
          Refines current arrangement while keeping locked elements
        </span>
      </div>

      {/* Quick Refine Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {quickRefinements.map((qr, idx) => (
          <button
            key={idx}
            onClick={() => onRefine(qr.instruction)}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 hover:border-amber-500/40 text-zinc-200 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
          >
            {qr.label}
          </button>
        ))}
      </div>

      {/* Custom Prompt Input */}
      <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-1">
        <input
          type="text"
          placeholder="Ask Gemini Producer to refine: e.g. 'Add a walking jazz bass line and syncopated reggae piano chops'..."
          value={customInstruction}
          onChange={(e) => setCustomInstruction(e.target.value)}
          className="flex-1 bg-zinc-950 border border-white/15 rounded-xl px-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={isGenerating || !customInstruction.trim()}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 fill-zinc-950" />
          <span>Refine</span>
        </button>
      </form>
    </div>
  );
};
