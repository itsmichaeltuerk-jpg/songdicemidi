import React from 'react';
import { SongArrangement } from '../types/music';
import { noteToMidi } from '../services/chordParser';
import {
  COLLAPSED_LANE_H,
  COLLAPSED_LANES,
  collapsedNoteTop,
  seekBeatFromClick,
} from '../audio/doorPlayback.ts';

interface ArrangementVisualizerProps {
  arrangement: SongArrangement | null;
  currentBeat: number;
  currentBar: number;
  totalBeats: number;
  isPlaying: boolean;
  onSeek: (beat: number) => void;
}

const LANE_COLOR: Record<string, string> = {
  melody: 'bg-cyan-400 text-zinc-950',
  chords: 'bg-amber-400 text-zinc-950',
  pad: 'bg-yellow-300/90 text-zinc-950',
  bass: 'bg-pink-400 text-zinc-950',
  drums: 'bg-emerald-400 text-zinc-950',
};

const LANE_LABEL: Record<string, string> = {
  melody: 'Lead',
  chords: 'Keys',
  pad: 'Pad',
  bass: 'Bass',
  drums: 'Drums',
};

export const ArrangementVisualizer: React.FC<ArrangementVisualizerProps> = ({
  arrangement,
  currentBeat,
  currentBar,
  isPlaying,
  onSeek,
}) => {
  if (!arrangement) {
    return (
      <div className="w-full h-36 bg-zinc-950/60 rounded-2xl border border-white/10 flex items-center justify-center text-zinc-500 text-xs">
        Roll dice to hear a take
      </div>
    );
  }

  const barsTotal = arrangement.bars_total || 8;
  const beatsPerBar = 4;
  const actualTotalBeats = barsTotal * beatsPerBar;
  const playheadPercent = Math.min(100, Math.max(0, (currentBeat / actualTotalBeats) * 100));
  const height = COLLAPSED_LANES.length * COLLAPSED_LANE_H;

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(seekBeatFromClick((e.clientX - rect.left) / rect.width, barsTotal, beatsPerBar));
  };

  const notes: { lane: number; midi: number; left: number; width: number; label: string; key: string; cls: string }[] = [];

  arrangement.melody.forEach((m, i) => {
    const abs = (m.bar - 1) * beatsPerBar + (m.beat - 1);
    notes.push({
      lane: 0,
      midi: m.midi,
      left: (abs / actualTotalBeats) * 100,
      width: Math.max(2.2, (m.duration_beats / actualTotalBeats) * 100),
      label: m.note,
      key: `m${i}`,
      cls: LANE_COLOR.melody,
    });
  });
  arrangement.chords.forEach((c, i) => {
    const abs = (c.bar - 1) * beatsPerBar + (c.beat - 1);
    const midi = c.notes?.[0] ? noteToMidi(c.notes[0]) : 60;
    notes.push({
      lane: 1,
      midi,
      left: (abs / actualTotalBeats) * 100,
      width: Math.max(2.2, (c.duration_beats / actualTotalBeats) * 100),
      label: i === 0 || c.beat === 1 ? c.chord : '',
      key: `c${i}`,
      cls: LANE_COLOR.chords,
    });
  });
  (arrangement.pad || []).forEach((p, i) => {
    const abs = (p.bar - 1) * beatsPerBar + (p.beat - 1);
    const midi = p.midi_notes?.[0] ?? 48;
    notes.push({
      lane: 2,
      midi,
      left: (abs / actualTotalBeats) * 100,
      width: Math.max(2.2, (p.duration_beats / actualTotalBeats) * 100),
      label: '',
      key: `p${i}`,
      cls: LANE_COLOR.pad,
    });
  });
  arrangement.bass.forEach((b, i) => {
    const abs = (b.bar - 1) * beatsPerBar + (b.beat - 1);
    notes.push({
      lane: 3,
      midi: b.midi,
      left: (abs / actualTotalBeats) * 100,
      width: Math.max(2.2, (b.duration_beats / actualTotalBeats) * 100),
      label: b.note,
      key: `b${i}`,
      cls: LANE_COLOR.bass,
    });
  });
  arrangement.drums.forEach((d, i) => {
    const abs = (d.bar - 1) * beatsPerBar + (d.beat - 1);
    const midi = d.midi_note ?? (d.piece === 'kick' ? 36 : d.piece === 'snare' ? 38 : 42);
    notes.push({
      lane: 4,
      midi,
      left: (abs / actualTotalBeats) * 100,
      width: 1.6,
      label: '',
      key: `d${i}`,
      cls: LANE_COLOR.drums,
    });
  });

  return (
    <div className="relative w-full bg-[#14151C]/90 rounded-2xl border border-white/10 p-3.5 shadow-xl" data-piano-roll="">
      <div className="flex items-center justify-between mb-2 text-xs">
        <span className="font-bold text-zinc-300 uppercase tracking-wider font-mono text-[10px]">Multi-Track Roll</span>
        <span className="text-amber-400 font-mono font-bold text-xs">
          Bar {currentBar} / {barsTotal}
        </span>
      </div>
      <div className="grid items-stretch" style={{ gridTemplateColumns: '2.6rem 1fr' }}>
        <div className="overflow-hidden rounded-l-md border border-white/10 bg-[#101115]">
          {COLLAPSED_LANES.map((lane) => (
            <div
              key={lane}
              className="flex items-center border-b border-white/5 px-1.5 font-mono text-[9px] text-zinc-400"
              style={{ height: COLLAPSED_LANE_H }}
            >
              {LANE_LABEL[lane]}
            </div>
          ))}
        </div>
        <div
          className="relative cursor-pointer overflow-hidden rounded-r-md border border-l-0 border-white/10 bg-zinc-950"
          style={{ height }}
          data-piano-grid="all"
          onClick={handleGridClick}
        >
          <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${barsTotal}, 1fr)` }}>
            {Array.from({ length: barsTotal }).map((_, barIdx) => (
              <div
                key={barIdx}
                className={`h-full border-r ${barIdx % 2 === 0 ? 'border-white/15' : 'border-white/5'}`}
              />
            ))}
          </div>
          {notes.map((n) => (
            <div
              key={n.key}
              data-piano-note=""
              className={`pointer-events-none absolute overflow-hidden rounded-sm px-0.5 font-mono text-[8px] leading-[10px] ${n.cls}`}
              style={{
                top: collapsedNoteTop(n.midi, n.lane),
                left: `${n.left}%`,
                width: `${n.width}%`,
                height: 10,
              }}
            >
              <span className="block truncate">{n.label}</span>
            </div>
          ))}
          <div
            style={{ left: `${playheadPercent}%` }}
            className={`absolute top-0 bottom-0 w-[2px] bg-amber-400 z-20 pointer-events-none ${
              isPlaying ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <div className="w-2 h-2 bg-amber-400 rounded-full -ml-[3px] -mt-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
