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
} from 'lucide-react';
import { TrackMixerChannel } from '../types/music';

interface TransportMixerProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  bpm: number;
  setBpm: (bpm: number) => void;
  swing: number;
  setSwing: (swing: number) => void;
  isLooping: boolean;
  setIsLooping: (loop: boolean) => void;
  isMetronomeOn: boolean;
  setIsMetronomeOn: (on: boolean) => void;
  tracks: Record<string, TrackMixerChannel>;
  onUpdateTrack: (name: string, updates: Partial<TrackMixerChannel>) => void;
}

export const TransportMixer: React.FC<TransportMixerProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  bpm,
  setBpm,
  swing,
  setSwing,
  isLooping,
  setIsLooping,
  isMetronomeOn,
  setIsMetronomeOn,
  tracks,
  onUpdateTrack,
}) => {
  return (
    <div className="w-full bg-gradient-to-b from-[#181A20] via-[#141519] to-[#121316] p-4 sm:p-6 rounded-3xl border border-white/10 shadow-2xl space-y-5">
      
      {/* Top Row: Master Transport Controls & Global Tempo */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/10">
        
        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Play/Pause Button */}
          <button
            id="transport-play-btn"
            onClick={isPlaying ? onPause : onPlay}
            className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-xl transition-all active:scale-95 ${
              isPlaying
                ? 'bg-amber-400 text-zinc-950 shadow-amber-500/30 ring-2 ring-amber-300'
                : 'bg-gradient-to-br from-amber-500 to-amber-600 text-zinc-950 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/20'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-zinc-950" />
            ) : (
              <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />
            )}
          </button>

          {/* Stop Button */}
          <button
            id="transport-stop-btn"
            onClick={onStop}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 transition-all active:scale-95"
            title="Stop & Reset to Bar 1"
          >
            <Square className="w-4 h-4 fill-zinc-400" />
          </button>

          {/* Loop Region Button */}
          <button
            id="transport-loop-btn"
            onClick={() => setIsLooping(!isLooping)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isLooping
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-zinc-900 border-white/10 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Loop</span>
          </button>

          {/* Metronome / Click */}
          <button
            id="transport-click-btn"
            onClick={() => setIsMetronomeOn(!isMetronomeOn)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isMetronomeOn
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-900 border-white/10 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Click</span>
          </button>
        </div>

        {/* Global Tempo & Swing Sliders */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* BPM */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-zinc-400">BPM:</span>
            <input
              type="number"
              min={40}
              max={240}
              value={bpm}
              onChange={(e) => setBpm(Math.max(40, Math.min(240, Number(e.target.value) || 120)))}
              className="w-16 bg-zinc-950 border border-white/15 rounded-lg px-2 py-1 text-xs font-mono font-black text-amber-400 text-center focus:outline-none focus:border-amber-400"
            />
            <input
              type="range"
              min={50}
              max={180}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-20 sm:w-28 accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Swing */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-zinc-400">Groove Swing:</span>
            <span className="text-xs font-mono text-amber-300 font-bold w-9 text-right">
              {Math.round(swing * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={0.35}
              step={0.01}
              value={swing}
              onChange={(e) => setSwing(Number(e.target.value))}
              className="w-16 sm:w-24 accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 5-Channel Track Mixer Strip */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>DAW Multi-Track Studio Mixer</span>
          </span>
          <span className="text-[11px] text-zinc-400">
            Adjust individual stems for vocal tracking & monitoring
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(Object.entries(tracks) as [string, TrackMixerChannel][]).map(([name, track]) => {
            const isMuted = track.mute || track.muted;
            const isSoloed = track.solo;

            // Track color mapping
            const colorMap: Record<string, string> = {
              melody: 'border-cyan-500/30 text-cyan-300',
              chords: 'border-amber-500/30 text-amber-300',
              pad: 'border-yellow-500/30 text-yellow-300',
              bass: 'border-pink-500/30 text-pink-300',
              drums: 'border-emerald-500/30 text-emerald-300',
            };

            const trackColor = colorMap[name] || 'border-white/10 text-white';

            return (
              <div
                key={name}
                className={`p-3 bg-zinc-950/80 rounded-2xl border transition-all flex flex-col justify-between space-y-2.5 ${trackColor}`}
              >
                {/* Channel Header & Mute/Solo */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono uppercase truncate">
                    {name === 'melody'
                      ? 'Melody (Guide)'
                      : name === 'chords'
                      ? 'Piano Chords'
                      : name === 'pad'
                      ? 'Pad Texture'
                      : name === 'bass'
                      ? 'Bass Line'
                      : 'Drums / Beat'}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Mute */}
                    <button
                      onClick={() => onUpdateTrack(name, { muted: !isMuted })}
                      className={`w-6 h-6 rounded-md text-[10px] font-black font-mono flex items-center justify-center border transition-all ${
                        isMuted
                          ? 'bg-rose-500 text-zinc-950 border-rose-400 font-bold'
                          : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                      title="Mute Track"
                    >
                      M
                    </button>

                    {/* Solo */}
                    <button
                      onClick={() => onUpdateTrack(name, { solo: !isSoloed })}
                      className={`w-6 h-6 rounded-md text-[10px] font-black font-mono flex items-center justify-center border transition-all ${
                        isSoloed
                          ? 'bg-amber-400 text-zinc-950 border-amber-300 font-bold'
                          : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                      title="Solo Track"
                    >
                      S
                    </button>
                  </div>
                </div>

                {/* Volume Fader */}
                <div className="space-y-1">
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
                    className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Pan Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
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
    </div>
  );
};
