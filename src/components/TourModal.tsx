import React, { useState } from 'react';
import { X, Dice5, Music, Download, Mic, ArrowRight, Check } from 'lucide-react';

interface TourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TourModal: React.FC<TourModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      icon: <Dice5 className="w-8 h-8 text-amber-400" />,
      title: '1. Roll Your Musical Blueprint',
      desc: 'Roll the 7 tactile studio dice to generate a unique key, BPM, chord progression, rhythm, bass motion, and drum groove. Or switch to "Piano Chord Tab" mode to paste any song you want to cover!',
    },
    {
      icon: <Music className="w-8 h-8 text-cyan-400" />,
      title: '2. Lock What You Love & Reroll',
      desc: 'Found a progression or BPM you dig? Tap that die to lock it with a glowing gold pin. Hit "Reroll Unlocked" to generate new bass and drum patterns that lock tightly around your core chords.',
    },
    {
      icon: <Mic className="w-8 h-8 text-rose-400" />,
      title: '3. Preview, Mix & Scratch Record',
      desc: 'Listen to the synthesized multi-track preview in real time. Mute/solo stems, tweak BPM or swing, and use the Vocal Scratch Booth to test singing your vocal cover directly through your microphone.',
    },
    {
      icon: <Download className="w-8 h-8 text-emerald-400" />,
      title: '4. 1-Click Export to Your DAW',
      desc: 'Click "Download Multitrack MIDI" or "Download Stems ZIP" to drop separated MIDI tracks directly into Ableton, FL Studio, Logic Pro, or Reaper. Assign your favorite VST instruments and finish the track!',
    },
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#16181D] border border-white/15 rounded-3xl w-full max-w-lg shadow-2xl p-6 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <span className="text-xs font-mono font-bold text-amber-400 uppercase">
            30-SECOND BEDROOM PRODUCER TOUR
          </span>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-6 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-xl">
            {current.icon}
          </div>

          <h3 className="text-xl font-black text-white font-['Outfit']">{current.title}</h3>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-md">{current.desc}</p>
        </div>

        {/* Progress dots & navigation */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === step ? 'bg-amber-400 w-6' : 'bg-zinc-700 hover:bg-zinc-500'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black rounded-xl transition-all"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center gap-1 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black rounded-xl transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Let's Make Music!</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
