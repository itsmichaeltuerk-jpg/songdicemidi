import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  RotateCw,
  Sparkles,
  Edit3,
  Flame,
  Plus,
  X,
  Volume2,
  Check,
  Search,
} from 'lucide-react';
import { DieConfig, DieFace, VibeModifiers } from '../types/music';

interface DiceTableProps {
  dice: DieConfig[];
  optionalDice: DieConfig[];
  isRolling: boolean;
  isGenerating: boolean;
  onToggleLock: (id: string) => void;
  onRollAll: () => void;
  onRollUnlocked: () => void;
  onSelectFace: (dieId: string, faceIndex: number) => void;
  onToggleOptionalDie: (id: string) => void;
  vibe: VibeModifiers;
  setVibe: React.Dispatch<React.SetStateAction<VibeModifiers>>;
}

export const DiceTable: React.FC<DiceTableProps> = ({
  dice,
  optionalDice,
  isRolling,
  isGenerating,
  onToggleLock,
  onRollAll,
  onRollUnlocked,
  onSelectFace,
  onToggleOptionalDie,
  vibe,
  setVibe,
}) => {
  const [editingDie, setEditingDie] = useState<DieConfig | null>(null);
  const [searchFaceText, setSearchFaceText] = useState('');
  const [showOptionalTray, setShowOptionalTray] = useState(false);
  const [showVibeSliders, setShowVibeSliders] = useState(false);

  const lockedCount = dice.filter((d) => d.isLocked).length;

  const handleDieClick = (die: DieConfig) => {
    onToggleLock(die.id);
  };

  const handleEditDieFace = (e: React.MouseEvent, die: DieConfig) => {
    e.stopPropagation();
    setEditingDie(die);
    setSearchFaceText('');
  };

  const handleChooseFace = (faceIndex: number) => {
    if (editingDie) {
      onSelectFace(editingDie.id, faceIndex);
      setEditingDie(null);
    }
  };

  return (
    <section className="relative w-full bg-gradient-to-b from-[#181A20] via-[#141519] to-[#121316] p-4 sm:p-6 lg:p-8 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
      {/* Studio Ambient Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar of Studio Table: Studio Status Light + Roll Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-5 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs uppercase tracking-wider font-extrabold text-amber-400 font-mono">
              STUDIO TABLE
            </span>
            <span className="text-zinc-500">•</span>
            {isGenerating ? (
              <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>PRODUCING ARRANGEMENT...</span>
              </div>
            ) : (
              <span className="text-xs text-zinc-400">
                {lockedCount > 0
                  ? `${lockedCount} locked (${dice.length - lockedCount} will roll)`
                  : 'Tap any die to lock it in place'}
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5 font-['Outfit']">
            Musical Dice Arranger
          </h2>
        </div>

        {/* Primary Roll Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Vibe Sliders Toggle */}
          <button
            onClick={() => setShowVibeSliders(!showVibeSliders)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showVibeSliders
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-zinc-900 border-white/10 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Vibe Biases</span>
          </button>

          {/* Optional Dice Tray Toggle */}
          <button
            onClick={() => setShowOptionalTray(!showOptionalTray)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showOptionalTray
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'bg-zinc-900 border-white/10 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Extra Dice ({optionalDice.filter((d) => d.enabled).length})</span>
          </button>

          {/* Reroll Unlocked */}
          <button
            id="roll-unlocked-btn"
            onClick={onRollUnlocked}
            disabled={isRolling || isGenerating || lockedCount === dice.length}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:pointer-events-none text-zinc-200 text-xs font-bold border border-white/10 shadow-lg hover:border-amber-500/40 transition-all active:scale-95"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
            <span>REROLL UNLOCKED</span>
          </button>

          {/* Big ROLL ALL button */}
          <button
            id="roll-all-btn"
            onClick={onRollAll}
            disabled={isRolling || isGenerating}
            className="relative group flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black tracking-wide uppercase shadow-xl shadow-amber-500/25 border border-amber-400/50 transition-all active:scale-95 disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4 fill-zinc-950" />
            <span>ROLL ALL DICE</span>
            {isRolling && (
              <span className="absolute inset-0 bg-amber-400/30 rounded-xl animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Vibe Biases Drawer */}
      {showVibeSliders && (
        <div className="mb-6 p-4 bg-zinc-950/70 border border-amber-500/20 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Darkness</span>
              <span className="text-amber-400 font-mono font-bold">{vibe.darkness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={vibe.darkness}
              onChange={(e) => setVibe({ ...vibe, darkness: Number(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Catchiness / Pop</span>
              <span className="text-amber-400 font-mono font-bold">{vibe.catchiness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={vibe.catchiness}
              onChange={(e) => setVibe({ ...vibe, catchiness: Number(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Complexity</span>
              <span className="text-amber-400 font-mono font-bold">{vibe.complexity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={vibe.complexity}
              onChange={(e) => setVibe({ ...vibe, complexity: Number(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Vocal Space / Silence</span>
              <span className="text-amber-400 font-mono font-bold">{vibe.space}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={vibe.space}
              onChange={(e) => setVibe({ ...vibe, space: Number(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Extra Dice Tray */}
      {showOptionalTray && (
        <div className="mb-6 p-4 bg-zinc-950/80 border border-purple-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-purple-300 tracking-wide uppercase">
              OPTIONAL DICE TRAY — Tap to add or remove dice
            </span>
            <button
              onClick={() => setShowOptionalTray(false)}
              className="text-zinc-500 hover:text-zinc-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {optionalDice.map((od) => (
              <button
                key={od.id}
                onClick={() => onToggleOptionalDie(od.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  od.enabled
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-200 shadow-sm'
                    : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <span>{od.enabled ? '✓' : '+'}</span>
                <span>{od.name}</span>
                {od.enabled && (
                  <span className="text-[10px] bg-purple-500/30 px-1.5 py-0.2 rounded-md font-mono text-purple-300">
                    {od.faces[od.selectedFaceIndex]?.label}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* THE DICE GRID — Tactile Oversized 3D Cubes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Render core dice + enabled optional dice */}
        {[...dice, ...optionalDice.filter((d) => d.enabled)].map((die, index) => {
          const currentFace = die.faces[die.selectedFaceIndex] || die.faces[0];
          const isLocked = die.isLocked;

          return (
            <div
              key={die.id}
              onClick={() => handleDieClick(die)}
              className={`group relative flex flex-col justify-between p-4 rounded-2xl transition-all duration-300 cursor-pointer select-none border ${
                isLocked
                  ? 'bg-gradient-to-b from-[#252018] to-[#1A1814] border-amber-500/50 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'bg-gradient-to-b from-zinc-900 to-zinc-950 border-white/10 hover:border-amber-500/30 hover:shadow-xl hover:shadow-black/50'
              } ${isRolling && !isLocked ? 'animate-[bounce_0.6s_ease-in-out_infinite]' : ''}`}
            >
              {/* Top Row: Die Category + Lock Badge + Manual Edit Icon */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: die.color || '#F59E0B' }}
                  />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 font-mono">
                    {die.shortName}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Manual Face Edit Icon */}
                  <button
                    onClick={(e) => handleEditDieFace(e, die)}
                    title="Manually choose a face"
                    className="p-1 rounded-lg text-zinc-500 hover:text-amber-300 hover:bg-white/10 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Lock Indicator */}
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                      isLocked
                        ? 'bg-amber-500 text-zinc-950 font-black shadow-sm'
                        : 'bg-zinc-800/80 text-zinc-400 group-hover:text-zinc-200'
                    }`}
                  >
                    {isLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                    <span>{isLocked ? 'LOCKED' : 'ROLL'}</span>
                  </div>
                </div>
              </div>

              {/* Center: Main Die Face Typography */}
              <div className="py-2.5">
                <div className="text-base sm:text-lg font-black text-white tracking-tight leading-snug group-hover:text-amber-200 transition-colors font-['Outfit']">
                  {currentFace.label}
                </div>
                {currentFace.sublabel && (
                  <div className="text-xs text-amber-400 font-medium tracking-wide mt-0.5 font-mono">
                    {currentFace.sublabel}
                  </div>
                )}
                <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                  {currentFace.description}
                </p>
              </div>

              {/* Bottom Row: Tag Badge + Action Hint */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
                {currentFace.tag ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 font-mono">
                    {currentFace.tag}
                  </span>
                ) : (
                  <span />
                )}
                <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                  {isLocked ? 'Tap to unlock' : 'Tap to lock'}
                </span>
              </div>

              {/* Corner 3D Bevel Highlight */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* Manual Pick Face Modal (Producer Long-Press/Edit) */}
      {editingDie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/15 rounded-2xl w-full max-w-lg shadow-2xl p-5 overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                  MANUAL FACE PICKER
                </span>
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Select {editingDie.name} Face
                </h3>
              </div>
              <button
                onClick={() => setEditingDie(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative my-3">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder={`Search ${editingDie.faces.length} faces...`}
                value={searchFaceText}
                onChange={(e) => setSearchFaceText(e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Face List */}
            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {editingDie.faces
                .filter(
                  (f) =>
                    f.label.toLowerCase().includes(searchFaceText.toLowerCase()) ||
                    (f.sublabel && f.sublabel.toLowerCase().includes(searchFaceText.toLowerCase())) ||
                    f.description.toLowerCase().includes(searchFaceText.toLowerCase())
                )
                .map((face, index) => {
                  const isSelected = editingDie.selectedFaceIndex === index;
                  return (
                    <button
                      key={face.id}
                      onClick={() => handleChooseFace(index)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500/50 text-white'
                          : 'bg-zinc-950/60 border-white/5 hover:bg-zinc-800 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{face.label}</span>
                          {face.sublabel && (
                            <span className="text-xs text-amber-400 font-mono font-medium">
                              ({face.sublabel})
                            </span>
                          )}
                          {face.tag && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-zinc-300 font-mono">
                              {face.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">{face.description}</p>
                      </div>
                      {isSelected && (
                        <div className="p-1 rounded-full bg-amber-500 text-zinc-950 font-bold shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-white/10 mt-3 flex justify-end">
              <button
                onClick={() => setEditingDie(null)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
