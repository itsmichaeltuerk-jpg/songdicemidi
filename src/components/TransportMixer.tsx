import React from 'react';
import {
  Play,
  Pause,
  Square,
  Repeat,
  Volume2,
  VolumeX,
  Sliders,
  Bell,
  Radio,
  Plus,
  Minus,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { TrackMixerChannel } from '../types/music';

export interface StickyTransportProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  heardCurrentTake: boolean;
  onKeep: () => void;
  bpm: number;
  setBpm: (bpm: number) => void;
  swing: number;
  setSwing: (swing: number) => void;
  isLooping: boolean;
  setIsLooping: (loop: boolean) => void;
  isMetronomeOn: boolean;
  setIsMetronomeOn: (on: boolean) => void;
  currentBar?: number;
  currentBeat?: number;
  totalBars?: number;
  onToggleMixerSection?: () => void;
  isMixerCollapsed?: boolean;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  allCollapsed?: boolean;
}

export const StickyTransport: React.FC<StickyTransportProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  heardCurrentTake,
  onKeep,
  bpm,
  setBpm,
  swing,
  setSwing,
  isLooping,
  setIsLooping,
  isMetronomeOn,
  setIsMetronomeOn,
  currentBar = 1,
  currentBeat = 0,
  totalBars = 8,
  onToggleMixerSection,
  isMixerCollapsed = false,
  onExpandAll,
  onCollapseAll,
  allCollapsed = false,
}) => {
  const beatInBar = (Math.floor(currentBeat) % 4) + 1;
  const isDownbeat = beatInBar === 1 && isPlaying;

  return (
    <div className="sticky top-0 md:top-[57px] z-30 transition-all">
      <div className="w-full bg-[#13141B]/95 backdrop-blur-md px-3 sm:px-4 py-2 rounded-2xl border border-white/10 shadow-xl flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
        
        {/* Left: Playback & Position */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Play/Pause */}
          <button
            id="transport-play-btn"
            onClick={isPlaying ? onPause : onPlay}
            className={`flex items-center justify-center w-10 h-10 rounded-xl shadow-lg transition-all active:scale-95 ${
              isPlaying
                ? 'bg-amber-400 text-zinc-950 shadow-amber-500/30 ring-2 ring-amber-300'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20'
            }`}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-zinc-950" />
            ) : (
              <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />
            )}
          </button>

          {/* Stop */}
          <button
            id="transport-stop-btn"
            onClick={onStop}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 transition-all active:scale-95"
            title="Stop & Reset to Bar 1"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>

          {/* Keep */}
          <button
            id="transport-keep-btn"
            onClick={onKeep}
            disabled={!heardCurrentTake}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              heardCurrentTake
                ? 'bg-amber-400 text-zinc-950 border-amber-300 font-bold shadow-sm'
                : 'bg-zinc-900/60 border-white/5 text-zinc-500 cursor-not-allowed opacity-50'
            }`}
            title={heardCurrentTake ? 'Save take to library' : 'Listen through to Keep'}
          >
            <Radio className={`w-3.5 h-3.5 ${heardCurrentTake ? 'animate-pulse text-zinc-950' : ''}`} />
            <span>Keep</span>
          </button>

          {/* Real-Time Position LED display */}
          <div className="flex items-center gap-2 bg-zinc-950/80 px-2.5 py-1.5 rounded-xl border border-white/10 font-mono text-xs">
            <div
              className={`w-2 h-2 rounded-full transition-all ${
                isDownbeat
                  ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                  : isPlaying
                  ? 'bg-amber-900/80'
                  : 'bg-zinc-700'
              }`}
              title="Downbeat indicator"
            />
            <span className="font-bold text-amber-300">
              Bar {currentBar}<span className="text-zinc-500">/{totalBars}</span>
            </span>
            <span className="text-zinc-600">•</span>
            <span className={`text-[11px] ${isDownbeat ? 'text-amber-400 font-bold' : 'text-zinc-400'}`}>
              Beat {beatInBar}
            </span>
          </div>
        </div>

        {/* Right: Controls & Parameters */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
          
          {/* Loop Button */}
          <button
            id="transport-loop-btn"
            onClick={() => setIsLooping(!isLooping)}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${
              isLooping
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-zinc-900/80 border-white/10 text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle Loop"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Loop</span>
          </button>

          {/* Metronome */}
          <button
            id="transport-click-btn"
            onClick={() => setIsMetronomeOn(!isMetronomeOn)}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${
              isMetronomeOn
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-900/80 border-white/10 text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle Click"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Click</span>
          </button>

          {/* BPM Stepper */}
          <div className="flex items-center gap-1 bg-zinc-950/80 px-2 py-1 rounded-xl border border-white/10 font-mono text-xs">
            <button
              onClick={() => setBpm(Math.max(40, bpm - 1))}
              className="w-4 h-4 flex items-center justify-center rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white"
              title="Decrease BPM"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>

            <input
              type="number"
              min={40}
              max={240}
              value={bpm}
              onChange={(e) => setBpm(Math.max(40, Math.min(240, Number(e.target.value) || 120)))}
              className="w-10 bg-transparent text-center font-bold text-amber-400 focus:outline-none text-xs"
            />
            <span className="text-[10px] text-zinc-500 font-bold">BPM</span>

            <button
              onClick={() => setBpm(Math.min(240, bpm + 1))}
              className="w-4 h-4 flex items-center justify-center rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white"
              title="Increase BPM"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Swing */}
          <div className="hidden lg:flex items-center gap-1.5 bg-zinc-950/80 px-2 py-1 rounded-xl border border-white/10 font-mono text-xs">
            <span className="text-[10px] text-zinc-500 font-bold">SWING</span>
            <span className="text-amber-300 font-bold text-[11px] w-6 text-right">
              {Math.round(swing * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={0.35}
              step={0.01}
              value={swing}
              onChange={(e) => setSwing(Number(e.target.value))}
              className="w-12 accent-amber-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Quick Mixer Toggle */}
          {onToggleMixerSection && (
            <button
              onClick={onToggleMixerSection}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                !isMixerCollapsed
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Toggle Stem Mixer"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Mixer</span>
            </button>
          )}

          {/* Expand/Collapse All */}
          {(onExpandAll || onCollapseAll) && (
            <button
              onClick={allCollapsed ? onExpandAll : onCollapseAll}
              className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/10 transition-all text-xs"
              title={allCollapsed ? 'Expand All' : 'Collapse All'}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export interface StemMixerProps {
  tracks: Record<string, TrackMixerChannel>;
  onUpdateTrack: (name: string, updates: Partial<TrackMixerChannel>) => void;
}

export const StemMixer: React.FC<StemMixerProps> = ({ tracks, onUpdateTrack }) => {
  return (
    <div className="w-full bg-[#14151C]/90 p-3 sm:p-4 rounded-2xl border border-white/10 shadow-xl space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {(Object.entries(tracks) as [string, TrackMixerChannel][]).map(([name, track]) => {
          const isMuted = track.mute || track.muted;
          const isSoloed = track.solo;

          const colorMap: Record<string, string> = {
            melody: 'border-cyan-500/30 text-cyan-300',
            chords: 'border-amber-500/30 text-amber-300',
            pad: 'border-yellow-500/30 text-yellow-300',
            bass: 'border-pink-500/30 text-pink-300',
            drums: 'border-emerald-500/30 text-emerald-300',
          };

          const trackNames: Record<string, string> = {
            melody: 'Melody',
            chords: 'Chords',
            pad: 'Pad',
            bass: 'Bass',
            drums: 'Drums',
          };

          const trackColor = colorMap[name] || 'border-white/10 text-white';

          return (
            <div
              key={name}
              className={`p-2.5 bg-zinc-950/80 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${trackColor}`}
            >
              {/* Channel Header & M/S */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono uppercase truncate">
                  {trackNames[name] || name}
                </span>

                <div className="flex items-center gap-1">
                  {/* Mute */}
                  <button
                    onClick={() => onUpdateTrack(name, { muted: !isMuted })}
                    className={`w-5 h-5 rounded text-[9px] font-black font-mono flex items-center justify-center border transition-all ${
                      isMuted
                        ? 'bg-rose-500 text-zinc-950 border-rose-400'
                        : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                    title="Mute Track"
                  >
                    M
                  </button>

                  {/* Solo */}
                  <button
                    onClick={() => onUpdateTrack(name, { solo: !isSoloed })}
                    className={`w-5 h-5 rounded text-[9px] font-black font-mono flex items-center justify-center border transition-all ${
                      isSoloed
                        ? 'bg-amber-400 text-zinc-950 border-amber-300'
                        : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                    title="Solo Track"
                  >
                    S
                  </button>
                </div>
              </div>

              {/* Volume */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span>Vol</span>
                  <span>{Math.round(track.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1.2}
                  step={0.01}
                  value={track.volume}
                  onChange={(e) => onUpdateTrack(name, { volume: Number(e.target.value) })}
                  className="w-full accent-amber-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Pan Slider */}
              <div className="hidden sm:block space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>Pan</span>
                  <span>
                    {track.pan === 0
                      ? 'C'
                      : track.pan < 0
                      ? `L${Math.abs(Math.round(track.pan * 50))}`
                      : `R${Math.round(track.pan * 50)}`}
                  </span>
                </div>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.05}
                  value={track.pan}
                  onChange={(e) => onUpdateTrack(name, { pan: Number(e.target.value) })}
                  className="w-full accent-zinc-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface TransportMixerProps extends StickyTransportProps, StemMixerProps {}

export const TransportMixer: React.FC<TransportMixerProps> = (props) => {
  return (
    <div className="space-y-4">
      <StickyTransport {...props} />
      <StemMixer tracks={props.tracks} onUpdateTrack={props.onUpdateTrack} />
    </div>
  );
};
