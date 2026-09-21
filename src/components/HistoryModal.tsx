import React from 'react';
import { X, History, Heart, ArrowRight, Play, Trash2, Share2 } from 'lucide-react';
import { SongArrangement } from '../types/music';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SongArrangement[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onRestore: (arrangement: SongArrangement) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  favorites,
  onToggleFavorite,
  onRestore,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#16181D] border border-white/15 rounded-3xl w-full max-w-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">Session Library & History</h3>
              <p className="text-xs text-zinc-400">
                {history.length} saved rolls & vocal cover arrangements
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-zinc-500 hover:text-rose-400 px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="overflow-y-auto space-y-3 pr-1 py-4 flex-1">
          {history.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No sessions saved yet. Roll some dice or arrange a piano cover!
            </div>
          ) : (
            history.map((arr) => {
              const isFav = favorites.includes(arr.id);
              const dateStr = new Date(arr.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={arr.id}
                  className="p-4 bg-zinc-900/80 rounded-2xl border border-white/10 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {arr.title_working}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-amber-400 font-semibold">
                        {arr.seedCode}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-1">{arr.logline}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                      <span>{arr.key}</span>
                      <span>•</span>
                      <span>{arr.bpm} BPM</span>
                      <span>•</span>
                      <span>{arr.bars_total} Bars</span>
                      <span>•</span>
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => onToggleFavorite(arr.id)}
                      className={`p-2 rounded-xl border transition-all ${
                        isFav
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                          : 'bg-zinc-950 border-white/10 text-zinc-500 hover:text-rose-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-400' : ''}`} />
                    </button>

                    <button
                      onClick={() => {
                        onRestore(arr);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl shadow-lg transition-all"
                    >
                      <span>Load</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-850 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
