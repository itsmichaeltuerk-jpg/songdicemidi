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
    <div className="w-full bg-[#14151C]/90 p-4 sm:p-5 rounded-2xl border border-white/10 shadow-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white font-['Outfit']">
            Vocal Scratch Track
          </h3>
          <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
            <Headphones className="w-3.5 h-3.5 text-amber-400" />
            Use headphones to prevent mic bleed
          </p>
        </div>

        {/* Record Button */}
        <button
          onClick={handleToggleRecord}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md active:scale-95 ${
            isRecording
              ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/30'
              : 'bg-rose-500 hover:bg-rose-400 text-zinc-950 shadow-rose-500/20'
          }`}
        >
          {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 fill-zinc-950" />}
          <span>{isRecording ? 'Stop Recording' : 'Record Scratch Vocal'}</span>
        </button>
      </div>

      {recordingError && (
        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{recordingError}</span>
        </div>
      )}

      {/* Recorded Vocal Playback Strip */}
      {vocalAudioUrl && (
        <div className="p-3 bg-zinc-950/80 rounded-xl border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayRecordedVocal}
              disabled={isVocalPlaying}
              className="w-8 h-8 rounded-lg bg-rose-500 hover:bg-rose-400 text-zinc-950 flex items-center justify-center shadow transition-all"
            >
              {isVocalPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-zinc-950 ml-0.5" />}
            </button>
            <div>
              <div className="text-xs font-bold text-white">Scratch Take</div>
              <div className="text-[10px] text-zinc-500">Recorded from microphone</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={vocalAudioUrl}
              download="vocal-scratch.webm"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 text-xs font-medium transition-all"
            >
              <Download className="w-3 h-3 text-rose-400" />
              <span>Download</span>
            </a>
            <button
              onClick={handleClearVocal}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-white/10 transition-all"
              title="Delete Vocal Take"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
