import React, { useState } from 'react';
import { Mic, MicOff, Play, Pause, Download, Trash2, Headphones, AlertCircle } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface VocalBoothProps {
  isPlaying: boolean;
  onStartPlayback: () => void;
  onStopPlayback: () => void;
}

export const VocalBooth: React.FC<VocalBoothProps> = ({
  isPlaying,
  onStartPlayback,
  onStopPlayback,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [vocalAudioUrl, setVocalAudioUrl] = useState<string | null>(null);
  const [isVocalPlaying, setIsVocalPlaying] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const handleToggleRecord = async () => {
    if (isRecording) {
      // Stop recording
      try {
        const result = audioEngine.stopVocalRecording();
        setIsRecording(false);
        onStopPlayback();
        if (result?.url) {
          setVocalAudioUrl(result.url);
        } else if (result?.blob) {
          setVocalAudioUrl(URL.createObjectURL(result.blob));
        }
      } catch (err: any) {
        console.error('Error stopping recording:', err);
        setIsRecording(false);
      }
    } else {
      // Start recording
      setRecordingError(null);
      try {
        const success = await audioEngine.startVocalRecording();
        if (success) {
          setIsRecording(true);
          onStartPlayback(); // Play backing track along with vocal
        } else {
          setRecordingError('Microphone permission required to record vocal scratch cover.');
        }
      } catch (err: any) {
        setRecordingError(err.message || 'Could not access microphone.');
      }
    }
  };

  const handlePlayRecordedVocal = () => {
    if (!vocalAudioUrl) return;
    const audio = new Audio(vocalAudioUrl);
    setIsVocalPlaying(true);
    audio.play();
    audio.onended = () => setIsVocalPlaying(false);
  };

  const handleClearVocal = () => {
    setVocalAudioUrl(null);
    setIsVocalPlaying(false);
  };

  return (
    <div className="w-full bg-gradient-to-b from-[#181A20] via-[#141519] to-[#121316] p-4 sm:p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-extrabold text-rose-400 font-mono">
              VOCAL SCRATCH BOOTH
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5 text-amber-400" /> Wear headphones while recording
            </span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight mt-0.5 font-['Outfit']">
            Record Vocal Cover Scratch Track Over Arrangement
          </h3>
        </div>

        {/* Big Record Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleRecord}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black tracking-wide uppercase transition-all shadow-xl active:scale-95 ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/40 ring-2 ring-rose-400'
                : 'bg-rose-500 hover:bg-rose-400 text-zinc-950 shadow-rose-500/25'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 fill-zinc-950" />}
            <span>{isRecording ? 'STOP RECORDING' : 'RECORD VOCAL COVER'}</span>
          </button>
        </div>
      </div>

      {recordingError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{recordingError}</span>
        </div>
      )}

      {/* Recorded Vocal Playback & Export Strip */}
      {vocalAudioUrl && (
        <div className="p-4 bg-zinc-950/80 rounded-2xl border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayRecordedVocal}
              disabled={isVocalPlaying}
              className="w-10 h-10 rounded-xl bg-rose-500 hover:bg-rose-400 text-zinc-950 flex items-center justify-center shadow-lg transition-all"
            >
              {isVocalPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />}
            </button>
            <div>
              <div className="text-xs font-bold text-white">Vocal Cover Scratch Take 1</div>
              <div className="text-[11px] text-zinc-400">Captured via browser microphone input</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={vocalAudioUrl}
              download="vocal-cover-scratch.webm"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              <span>Download Audio</span>
            </a>
            <button
              onClick={handleClearVocal}
              className="p-1.5 rounded-xl bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-white/10 transition-all text-xs"
              title="Delete Vocal Take"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
