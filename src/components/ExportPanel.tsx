import React, { useState } from 'react';
import {
  Download,
  FolderArchive,
  FileText,
  Copy,
  Check,
  SlidersHorizontal,
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
    <div className="w-full bg-[#14151C]/90 p-4 sm:p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
      {/* Top Bar: Groove Humanize + Copy Chord Chart */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3 overflow-x-auto">
          <span className="text-[11px] text-zinc-500 font-mono font-bold shrink-0">CHORD CHART:</span>
          <code className="text-amber-300 font-mono font-bold bg-zinc-950 px-2.5 py-1 rounded-lg border border-white/10 text-xs whitespace-nowrap">
            {chordChartDisplay}
          </code>
          <button
            onClick={handleCopyChordChart}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 text-xs font-mono transition-all shrink-0"
            title="Copy Chord Chart"
          >
            {copiedChart ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-amber-400" />
            )}
            <span>{copiedChart ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Humanize Toggle */}
        <label className="flex items-center gap-2 text-xs text-zinc-300 font-medium cursor-pointer bg-zinc-950/80 px-2.5 py-1 rounded-lg border border-white/10 hover:border-amber-400/30 transition-all select-none shrink-0">
          <input
            type="checkbox"
            checked={humanize}
            onChange={(e) => setHumanize(e.target.checked)}
            className="accent-amber-500 w-3.5 h-3.5 rounded cursor-pointer"
          />
          <SlidersHorizontal className="w-3 h-3 text-amber-400" />
          <span>Humanize (8–12% Timing & Velocity)</span>
        </label>
      </div>

      {/* 3 Streamlined Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Multitrack MIDI */}
        <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-white/10 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-all">
          <div>
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase font-mono mb-1">
              <Download className="w-3.5 h-3.5" />
              <span>Multitrack .MID File</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Standard Type 1 MIDI with Melody, Piano Chords, Bass, Pad, and GM Drums channels.
            </p>
          </div>

          <button
            id="export-multitrack-midi-btn"
            onClick={handleDownloadMultitrackMidi}
            className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold uppercase tracking-wider shadow active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Multitrack</span>
          </button>
        </div>

        {/* Card 2: Full Stem ZIP */}
        <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-white/10 flex flex-col justify-between space-y-3 hover:border-purple-500/40 transition-all">
          <div>
            <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs uppercase font-mono mb-1">
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Full Stem ZIP Package</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              ZIP containing separate files (<code>melody.mid</code>, <code>chords.mid</code>, <code>bass.mid</code>, <code>drums.mid</code>) + brief.
            </p>
          </div>

          <button
            id="export-zip-btn"
            onClick={handleDownloadZipPackage}
            disabled={isExportingZip}
            className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider shadow active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>{isExportingZip ? 'Packaging...' : 'Download Stems .ZIP'}</span>
          </button>
        </div>

        {/* Card 3: Producer Brief */}
        <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-white/10 flex flex-col justify-between space-y-3 hover:border-emerald-500/40 transition-all">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase font-mono mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Producer Brief (.MD)</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Key, BPM, form breakdown, chord bar charts, and mix recommendations for your session.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadBriefText}
              className="flex-1 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 text-xs font-bold transition-all flex items-center justify-center gap-1"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download .MD</span>
            </button>
            <button
              onClick={handleCopyBrief}
              className="py-2 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 text-xs font-bold transition-all flex items-center gap-1"
              title="Copy Brief to clipboard"
            >
              {copiedBrief ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
