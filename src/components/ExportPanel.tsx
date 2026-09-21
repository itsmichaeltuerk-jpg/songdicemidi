import React, { useState } from 'react';
import {
  Download,
  FolderArchive,
  FileText,
  Copy,
  Check,
  Sparkles,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import { SongArrangement } from '../types/music';
import {
  generateArrangementMidi,
  generateProducerBrief,
  generateChordChartString,
} from '../services/midiEncoder';

interface ExportPanelProps {
  arrangement: SongArrangement | null;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ arrangement }) => {
  const [humanize, setHumanize] = useState<boolean>(true);
  const [copiedChart, setCopiedChart] = useState<boolean>(false);
  const [copiedBrief, setCopiedBrief] = useState<boolean>(false);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);

  if (!arrangement) return null;

  const handleDownloadMultitrackMidi = () => {
    const { multitrackBlob } = generateArrangementMidi(arrangement, humanize);
    const url = URL.createObjectURL(multitrackBlob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = arrangement.title_working.replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${safeTitle}_multitrack_${arrangement.bpm}bpm.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZipPackage = async () => {
    setIsExportingZip(true);
    try {
      const { createStemZipPackage } = await import('../services/midiEncoder');
      const zipBlob = await createStemZipPackage(arrangement, humanize);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = arrangement.title_working.replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${safeTitle}_DAW_Bundle.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip package:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleDownloadBriefText = () => {
    const briefText = generateProducerBrief(arrangement);
    const blob = new Blob([briefText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = arrangement.title_working.replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${safeTitle}_Producer_Brief.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyChordChart = () => {
    const chart = generateChordChartString(arrangement);
    navigator.clipboard.writeText(chart);
    setCopiedChart(true);
    setTimeout(() => setCopiedChart(false), 2000);
  };

  const handleCopyBrief = () => {
    const brief = generateProducerBrief(arrangement);
    navigator.clipboard.writeText(brief);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  const chordChartDisplay = generateChordChartString(arrangement);

  return (
    <div className="w-full bg-gradient-to-b from-[#181A20] via-[#141519] to-[#121316] p-4 sm:p-6 rounded-3xl border border-white/10 shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-extrabold text-amber-400 font-mono">
              DAW EXPORT STUDIO
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-xs text-zinc-300">Ableton • FL Studio • Logic Pro • Reaper</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight mt-0.5 font-['Outfit']">
            Export MIDI & Producer Brief for Your Vocal Cover Session
          </h3>
        </div>

        {/* Humanize Velocity / Timing Switch */}
        <label className="flex items-center gap-2 text-xs text-zinc-300 font-semibold cursor-pointer bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-white/10 hover:border-amber-400/40 transition-all select-none">
          <input
            type="checkbox"
            checked={humanize}
            onChange={(e) => setHumanize(e.target.checked)}
            className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
          />
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
          <span>Humanize Groove (8–12% Timing & Velocity)</span>
        </label>
      </div>

      {/* 3 Main Action Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Multitrack MIDI */}
        <div className="p-4 bg-zinc-950/90 rounded-2xl border border-white/10 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-all">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase font-mono mb-1">
              <Download className="w-4 h-4" />
              <span>Multitrack .MID File</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Standard Type 1 MIDI file containing individual tracks for Melody, Piano Chords, Bass,
              Pad, and GM Drums.
            </p>
          </div>

          <button
            id="export-multitrack-midi-btn"
            onClick={handleDownloadMultitrackMidi}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black uppercase tracking-wide shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Multitrack .MID</span>
          </button>
        </div>

        {/* Card 2: Full Stem ZIP Package */}
        <div className="p-4 bg-zinc-950/90 rounded-2xl border border-purple-500/20 flex flex-col justify-between space-y-3 hover:border-purple-500/40 transition-all">
          <div>
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase font-mono mb-1">
              <FolderArchive className="w-4 h-4" />
              <span>Full Stem ZIP Package</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              ZIP bundle containing individual stem files (<code>melody.mid</code>, <code>chords.mid</code>, <code>bass.mid</code>, <code>drums.mid</code>) + multitrack + Producer Brief.
            </p>
          </div>

          <button
            id="export-zip-btn"
            onClick={handleDownloadZipPackage}
            disabled={isExportingZip}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wide shadow-lg shadow-purple-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>{isExportingZip ? 'Packaging ZIP...' : 'Download Stems .ZIP'}</span>
          </button>
        </div>

        {/* Card 3: Producer Brief (.md) */}
        <div className="p-4 bg-zinc-950/90 rounded-2xl border border-white/10 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-all">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase font-mono mb-1">
              <FileText className="w-4 h-4" />
              <span>Producer Brief & Chart</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Complete production guide with key, BPM, form breakdown, chord bar charts, and mix recommendations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadBriefText}
              className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download .MD</span>
            </button>
            <button
              onClick={handleCopyBrief}
              className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 text-xs font-bold transition-all flex items-center gap-1"
              title="Copy Brief to clipboard"
            >
              {copiedBrief ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

      </div>

      {/* Chord Chart Clipboard Bar */}
      <div className="p-3 bg-zinc-950/90 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 overflow-x-auto py-1">
          <span className="text-zinc-500 font-mono font-bold shrink-0">CHORD CHART:</span>
          <code className="text-amber-300 font-mono font-bold bg-zinc-900 px-3 py-1 rounded-lg border border-white/5 whitespace-nowrap">
            {chordChartDisplay}
          </code>
        </div>

        <button
          onClick={handleCopyChordChart}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 text-xs font-mono font-bold transition-all shrink-0"
        >
          {copiedChart ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-amber-400" />
              <span>Copy Chart</span>
            </>
          )}
        </button>
      </div>

      {/* Arrangement Notes & Next Moves */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Left: Hook Reason & Notes */}
        <div className="p-4 bg-zinc-950/60 rounded-2xl border border-white/5 space-y-2">
          <div className="text-xs font-bold text-amber-400 uppercase font-mono">
            Arrangement Production Blueprint
          </div>
          <p className="text-zinc-300 leading-relaxed">{arrangement.arrangement_notes}</p>
          <p className="text-zinc-400 leading-relaxed italic mt-2">
            <strong>Hook Logic:</strong> {arrangement.hook_reason}
          </p>
        </div>

        {/* Right: Next Moves for Bedroom Producers */}
        <div className="p-4 bg-zinc-950/60 rounded-2xl border border-white/5 space-y-2">
          <div className="text-xs font-bold text-emerald-400 uppercase font-mono">
            DAW Next Moves (Vocal Cover Tracking)
          </div>
          <ul className="space-y-1.5 text-zinc-300">
            {arrangement.next_moves.map((move, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold font-mono">{i + 1}.</span>
                <span>{move}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
