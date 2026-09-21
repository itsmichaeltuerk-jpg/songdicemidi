import React, { useEffect, useRef } from 'react';
import { SongArrangement } from '../types/music';
import { audioEngine } from '../services/audioEngine';

interface ArrangementVisualizerProps {
  arrangement: SongArrangement | null;
  currentBeat: number;
  currentBar: number;
  totalBeats: number;
  isPlaying: boolean;
  onSeek: (beat: number) => void;
}

export const ArrangementVisualizer: React.FC<ArrangementVisualizerProps> = ({
  arrangement,
  currentBeat,
  currentBar,
  totalBeats,
  isPlaying,
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Frequency / Waveform Audio Visualizer Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);

        // Draw frequency spectrum ambient bars in background
        const barWidth = (width / bufferLength) * 2;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height * 0.75;
          ctx.fillStyle = `rgba(245, 158, 11, ${0.08 + (dataArray[i] / 255) * 0.2})`;
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      }
    };

    render();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  if (!arrangement) {
    return (
      <div className="w-full h-44 bg-zinc-950/60 rounded-2xl border border-white/10 flex items-center justify-center text-zinc-500 text-xs">
        Roll dice or input chords to visualize arrangement
      </div>
    );
  }

  const barsTotal = arrangement.bars_total || 8;
  const beatsPerBar = 4;
  const actualTotalBeats = barsTotal * beatsPerBar;
  const playheadPercent = Math.min(100, Math.max(0, (currentBeat / actualTotalBeats) * 100));

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    const targetBeat = fraction * actualTotalBeats;
    onSeek(targetBeat);
  };

  return (
    <div className="relative w-full bg-zinc-950/90 rounded-2xl border border-white/10 p-4 shadow-xl overflow-hidden">
      
      {/* Background Audio Spectrum Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={220}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
      />

      {/* Top Meta Bar */}
      <div className="flex items-center justify-between mb-3 text-xs border-b border-white/5 pb-2 relative z-10">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">
            PIANO ROLL / MULTI-TRACK TIMELINE
          </span>
          <span className="text-amber-400 font-mono font-bold">
            Bar {currentBar} / {barsTotal} • Beat {(currentBeat % beatsPerBar + 1).toFixed(1)}
          </span>
        </div>

        {/* Section Tags */}
        <div className="flex items-center gap-1">
          {arrangement.form &&
            arrangement.form.map((f, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded bg-white/5 text-zinc-300 font-mono text-[10px]"
              >
                {f}
              </span>
            ))}
        </div>
      </div>

      {/* Main Piano Roll Container */}
      <div
        onClick={handleGridClick}
        className="relative w-full h-44 sm:h-52 bg-zinc-950/80 rounded-xl border border-white/10 cursor-pointer select-none overflow-hidden"
      >
        {/* Grid Background Lines (Bars & Beats) */}
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${barsTotal}, 1fr)` }}>
          {Array.from({ length: barsTotal }).map((_, barIdx) => (
            <div
              key={barIdx}
              className={`h-full border-r relative flex flex-col justify-between ${
                barIdx % 2 === 0 ? 'border-white/15 bg-white/[0.01]' : 'border-white/10'
              }`}
            >
              {/* Bar Number */}
              <span className="text-[9px] font-mono text-zinc-500 pl-1 pt-0.5">
                {barIdx + 1}
              </span>
              {/* Inner 4 beats subdivision */}
              <div className="w-full h-full grid grid-cols-4 pointer-events-none opacity-20">
                <div className="border-r border-zinc-700" />
                <div className="border-r border-zinc-700" />
                <div className="border-r border-zinc-700" />
                <div />
              </div>
            </div>
          ))}
        </div>

        {/* TRACK 1: Guide Melody Notes (Cyan / Purple) */}
        {arrangement.melody.map((m, idx) => {
          const absBeat = (m.bar - 1) * beatsPerBar + (m.beat - 1);
          const leftPercent = (absBeat / actualTotalBeats) * 100;
          const widthPercent = (m.duration_beats / actualTotalBeats) * 100;
          const isActive = Math.abs(currentBeat - absBeat) < m.duration_beats;

          return (
            <div
              key={`mel_${idx}`}
              title={`Melody: ${m.note} ${m.lyric_placeholder ? `("${m.lyric_placeholder}")` : ''}`}
              style={{
                left: `${leftPercent}%`,
                width: `${Math.max(1, widthPercent)}%`,
                top: `${10 + ((127 - m.midi) % 24) * 1.5}%`,
              }}
              className={`absolute h-3.5 rounded-sm text-[8px] font-mono font-bold flex items-center px-1 truncate transition-all z-10 ${
                isActive
                  ? 'bg-cyan-300 text-zinc-950 shadow-lg shadow-cyan-400/50 scale-105 ring-1 ring-cyan-200'
                  : 'bg-cyan-500/80 text-zinc-950 border border-cyan-300/40'
              }`}
            >
              {m.lyric_placeholder || m.note}
            </div>
          );
        })}

        {/* TRACK 2: Piano Chords (Amber) */}
        {arrangement.chords.map((c, idx) => {
          const absBeat = (c.bar - 1) * beatsPerBar + (c.beat - 1);
          const leftPercent = (absBeat / actualTotalBeats) * 100;
          const widthPercent = (c.duration_beats / actualTotalBeats) * 100;
          const isActive = Math.abs(currentBeat - absBeat) < c.duration_beats;

          return (
            <div
              key={`ch_${idx}`}
              title={`Chord: ${c.chord} (${c.roman})`}
              style={{
                left: `${leftPercent}%`,
                width: `${Math.max(1.5, widthPercent)}%`,
                top: '40%',
              }}
              className={`absolute h-5 rounded-md text-[9px] font-mono font-bold flex items-center justify-between px-1.5 transition-all z-10 ${
                isActive
                  ? 'bg-amber-400 text-zinc-950 shadow-lg shadow-amber-400/60 ring-1 ring-amber-200 scale-105'
                  : 'bg-amber-600/75 text-white border border-amber-400/30'
              }`}
            >
              <span>{c.chord}</span>
              <span className="text-[8px] opacity-75 font-normal">{c.roman}</span>
            </div>
          );
        })}

        {/* TRACK 3: Bass Line (Pink) */}
        {arrangement.bass.map((b, idx) => {
          const absBeat = (b.bar - 1) * beatsPerBar + (b.beat - 1);
          const leftPercent = (absBeat / actualTotalBeats) * 100;
          const widthPercent = (b.duration_beats / actualTotalBeats) * 100;
          const isActive = Math.abs(currentBeat - absBeat) < b.duration_beats;

          return (
            <div
              key={`ba_${idx}`}
              title={`Bass: ${b.note}`}
              style={{
                left: `${leftPercent}%`,
                width: `${Math.max(1, widthPercent)}%`,
                top: '64%',
              }}
              className={`absolute h-3.5 rounded-sm text-[8px] font-mono font-bold flex items-center px-1 truncate transition-all z-10 ${
                isActive
                  ? 'bg-pink-400 text-zinc-950 shadow-lg shadow-pink-400/50 scale-105'
                  : 'bg-pink-600/80 text-white border border-pink-400/30'
              }`}
            >
              {b.note}
            </div>
          );
        })}

        {/* TRACK 4: Drums / Percussion (Blue / Emerald Dots) */}
        {arrangement.drums.map((d, idx) => {
          const absBeat = (d.bar - 1) * beatsPerBar + (d.beat - 1);
          const leftPercent = (absBeat / actualTotalBeats) * 100;
          const isActive = Math.abs(currentBeat - absBeat) < 0.25;

          const isKick = d.piece === 'kick';
          const isSnare = d.piece === 'snare' || d.piece === 'clap';

          return (
            <div
              key={`dr_${idx}`}
              title={`Drum: ${d.piece}`}
              style={{
                left: `${leftPercent}%`,
                top: isKick ? '82%' : isSnare ? '88%' : '78%',
              }}
              className={`absolute w-2 h-2 rounded-full transform -translate-x-1/2 transition-all z-10 ${
                isActive
                  ? 'bg-emerald-300 scale-150 shadow-md shadow-emerald-300'
                  : isKick
                  ? 'bg-blue-400'
                  : isSnare
                  ? 'bg-emerald-400'
                  : 'bg-zinc-400'
              }`}
            />
          );
        })}

        {/* Sweeping Vertical Playhead */}
        <div
          style={{ left: `${playheadPercent}%` }}
          className="absolute top-0 bottom-0 w-[2px] bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,1)] z-20 pointer-events-none transition-none"
        >
          <div className="w-2.5 h-2.5 bg-amber-400 rounded-full -ml-[4px] -mt-1 shadow-md shadow-amber-400" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-400 font-mono justify-end">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-cyan-400" />
          <span>Melody Guide</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-amber-400" />
          <span>Piano Chords</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-pink-400" />
          <span>Bass</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span>Drums</span>
        </div>
      </div>
    </div>
  );
};
