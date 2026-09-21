import { MixBus, type BusId } from '../audio/mixbus.ts';
import { drumPieceMidi } from '../audio/doorPlayback.ts';
import { midiToHz, playBassVoice, playChordVoice, playDrumMidi, playMelodyVoice, playPadVoice } from '../audio/voices.ts';
import { noteToMidi } from './chordParser';
import { SongArrangement, TrackMixerChannel } from '../types/music';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentArrangement: SongArrangement | null = null;
  
  // Transport & Scheduling
  private bpm: number = 94;
  private swing: number = 0;
  private totalBars: number = 8;
  private beatsPerBar: number = 4;
  private currentBeatPosition: number = 0; // Floating beat count
  private playbackStartTime: number = 0;
  private lastScheduledBeat: number = 0;
  private lookaheadMs: number = 25;
  private scheduleAheadTime: number = 0.15; // 150ms lookahead
  private timerId: number | null = null;
  private isLooping: boolean = true;
  private metronomeEnabled: boolean = false;

  // Mixer nodes — Door mixbus is the master; per-track gain/pan stay in front.
  private mixbus: MixBus | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private trackNodes: Map<
    string,
    {
      gain: GainNode;
      panner: StereoPannerNode | null;
      volume: number;
      mute: boolean;
      solo: boolean;
    }
  > = new Map();

  // Callbacks
  public onPlaybackUpdate: ((beat: number, isPlaying: boolean) => void) | null = null;
  private onPositionUpdate: ((beat: number, bar: number, totalBeats: number) => void) | null = null;
  private onPlayStateChange: ((isPlaying: boolean) => void) | null = null;

  // Vocal recording
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordedAudioBlob: Blob | null = null;
  private recordedAudioUrl: string | null = null;
  private isRecordingVocal: boolean = false;

  constructor() {
    // Lazy init audio context on first interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.connect(this.ctx.destination);

      this.mixbus = new MixBus(this.ctx, this.analyser);
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.analyser);

      // Initialize track channels: melody, chords, pad, bass, drums
      const trackIds: BusId[] = ['melody', 'chords', 'pad', 'bass', 'drums'];
      for (const id of trackIds) {
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.8, this.ctx.currentTime);

        let panner: StereoPannerNode | null = null;
        if (this.ctx.createStereoPanner) {
          panner = this.ctx.createStereoPanner();
          gain.connect(panner);
          panner.connect(this.mixbus.stemInput(id));
        } else {
          gain.connect(this.mixbus.stemInput(id));
        }

        this.trackNodes.set(id, {
          gain,
          panner,
          volume: 0.8,
          mute: false,
          solo: false,
        });
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    this.initContext();
    return this.analyser;
  }

  public setCallbacks(
    onPositionUpdate: (beat: number, bar: number, totalBeats: number) => void,
    onPlayStateChange: (isPlaying: boolean) => void
  ) {
    this.onPositionUpdate = onPositionUpdate;
    this.onPlayStateChange = onPlayStateChange;
  }

  public loadArrangement(arr: SongArrangement) {
    this.setArrangement(arr);
  }

  public seek(beat: number) {
    this.seekToBeat(beat);
  }

  public setTrackVolume(trackId: string, volume: number) {
    this.initContext();
    const node = this.trackNodes.get(trackId);
    if (node && this.ctx) {
      node.volume = volume;
      if (!node.mute) {
        node.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.02);
      }
    }
  }

  public setTrackPan(trackId: string, pan: number) {
    this.initContext();
    const node = this.trackNodes.get(trackId);
    if (node && node.panner && this.ctx) {
      node.panner.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.02);
    }
  }

  public setTrackMute(trackId: string, mute: boolean) {
    this.initContext();
    const node = this.trackNodes.get(trackId);
    if (node && this.ctx) {
      node.mute = mute;
      const effectiveGain = mute ? 0 : node.volume;
      node.gain.gain.setTargetAtTime(effectiveGain, this.ctx.currentTime, 0.02);
    }
  }

  public setTrackSolo(trackId: string, solo: boolean) {
    this.initContext();
    const node = this.trackNodes.get(trackId);
    if (node) {
      node.solo = solo;
      const channels = Array.from(this.trackNodes.entries()).map(([id, n]) => ({
        id: id as any,
        name: id,
        volume: n.volume,
        pan: n.panner ? n.panner.pan.value : 0,
        mute: n.mute,
        solo: n.solo,
        color: '#fff',
      }));
      this.updateMixer(channels);
    }
  }

  public setArrangement(arr: SongArrangement) {
    this.currentArrangement = arr;
    this.bpm = arr.bpm || 94;
    this.swing = arr.swing || 0;
    this.totalBars = arr.bars_total || 8;
    const timeParts = (arr.time_signature || '4/4').split('/');
    this.beatsPerBar = parseInt(timeParts[0] || '4', 10);
  }

  public updateMixer(channels: TrackMixerChannel[]) {
    this.initContext();
    const hasAnySolo = channels.some((c) => c.solo);

    for (const ch of channels) {
      const node = this.trackNodes.get(ch.id);
      if (node && this.ctx) {
        node.volume = ch.volume;
        node.mute = ch.mute;
        node.solo = ch.solo;

        let effectiveGain = ch.volume;
        if (ch.mute) effectiveGain = 0;
        else if (hasAnySolo && !ch.solo) effectiveGain = 0;

        node.gain.gain.setTargetAtTime(effectiveGain, this.ctx.currentTime, 0.02);
        if (node.panner) {
          node.panner.pan.setTargetAtTime(ch.pan, this.ctx.currentTime, 0.02);
        }
      }
    }
  }

  public setMasterVolume(vol: number) {
    this.initContext();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.02);
    }
  }

  public setBpm(bpm: number) {
    this.bpm = Math.max(40, Math.min(260, bpm));
  }

  public setSwing(swing: number) {
    this.swing = Math.max(0, Math.min(0.5, swing));
  }

  public setLooping(loop: boolean) {
    this.isLooping = loop;
  }

  public setMetronome(enabled: boolean) {
    this.metronomeEnabled = enabled;
  }

  public play() {
    this.initContext();
    if (this.isPlaying) return;
    if (!this.currentArrangement) return;

    this.isPlaying = true;
    if (this.onPlayStateChange) this.onPlayStateChange(true);
    if (this.onPlaybackUpdate) this.onPlaybackUpdate(this.currentBeatPosition, true);

    const secondsPerBeat = 60 / this.bpm;
    this.playbackStartTime = this.ctx!.currentTime - this.currentBeatPosition * secondsPerBeat;
    this.lastScheduledBeat = this.currentBeatPosition;
    this.mixbus?.start(this.ctx!.currentTime);

    this.startSchedulerLoop();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.ctx && this.mixbus) this.mixbus.stop(this.ctx.currentTime);
    if (this.onPlayStateChange) this.onPlayStateChange(false);
    if (this.onPlaybackUpdate) this.onPlaybackUpdate(this.currentBeatPosition, false);
  }

  public stop() {
    this.pause();
    this.currentBeatPosition = 0;
    this.lastScheduledBeat = 0;
    if (this.onPlaybackUpdate) this.onPlaybackUpdate(0, false);
    if (this.onPositionUpdate) {
      this.onPositionUpdate(0, 1, this.totalBars * this.beatsPerBar);
    }
  }

  public seekToBeat(beat: number) {
    const totalBeats = this.totalBars * this.beatsPerBar;
    this.currentBeatPosition = Math.max(0, Math.min(totalBeats, beat));
    this.lastScheduledBeat = this.currentBeatPosition;
    if (this.isPlaying && this.ctx) {
      const secondsPerBeat = 60 / this.bpm;
      this.playbackStartTime = this.ctx.currentTime - this.currentBeatPosition * secondsPerBeat;
    }
    if (this.onPositionUpdate) {
      const curBar = Math.floor(this.currentBeatPosition / this.beatsPerBar) + 1;
      this.onPositionUpdate(this.currentBeatPosition, curBar, totalBeats);
    }
  }

  private startSchedulerLoop() {
    if (this.timerId !== null) clearInterval(this.timerId);
    this.timerId = window.setInterval(() => {
      this.schedulerTick();
    }, this.lookaheadMs);
  }

  private schedulerTick() {
    if (!this.isPlaying || !this.ctx || !this.currentArrangement) return;

    const secondsPerBeat = 60 / this.bpm;
    const now = this.ctx.currentTime;
    const currentPlayingBeat = (now - this.playbackStartTime) / secondsPerBeat;
    const totalBeats = this.totalBars * this.beatsPerBar;

    if (currentPlayingBeat >= totalBeats) {
      if (this.isLooping) {
        this.playbackStartTime += totalBeats * secondsPerBeat;
        this.lastScheduledBeat = this.lastScheduledBeat % totalBeats;
      } else {
        this.stop();
        return;
      }
    }

    const currentWrappedBeat = ((currentPlayingBeat % totalBeats) + totalBeats) % totalBeats;
    this.currentBeatPosition = currentWrappedBeat;

    if (this.onPositionUpdate) {
      const curBar = Math.floor(currentWrappedBeat / this.beatsPerBar) + 1;
      this.onPositionUpdate(currentWrappedBeat, curBar, totalBeats);
    }
    if (this.onPlaybackUpdate) {
      this.onPlaybackUpdate(currentWrappedBeat, true);
    }

    // Schedule events up to scheduleAheadTime
    const scheduleUntilBeat = ((now + this.scheduleAheadTime) - this.playbackStartTime) / secondsPerBeat;
    this.scheduleNotesBetween(this.lastScheduledBeat, scheduleUntilBeat);
    this.lastScheduledBeat = scheduleUntilBeat;
  }

  private scheduleNotesBetween(startBeat: number, endBeat: number) {
    if (!this.ctx || !this.currentArrangement) return;
    const secondsPerBeat = 60 / this.bpm;
    const totalBeats = this.totalBars * this.beatsPerBar;

    const arr = this.currentArrangement;

    // Helper to calculate exact AudioContext timestamp for an arrangement event
    const getEventTime = (bar: number, beat: number): { time: number; absBeat: number } => {
      const absBeat = (bar - 1) * this.beatsPerBar + (beat - 1);
      
      // Calculate swing: if beat has odd eighth note (e.g. 1.5, 2.5, 3.5, 4.5), add swing delay
      const beatFraction = absBeat % 1;
      let swingOffset = 0;
      if (Math.abs(beatFraction - 0.5) < 0.05 && this.swing > 0) {
        swingOffset = this.swing * 0.15 * secondsPerBeat;
      }

      const time = this.playbackStartTime + absBeat * secondsPerBeat + swingOffset;
      return { time, absBeat };
    };

    // 1. Chords / Piano — Door EP voices
    const chordTrack = this.trackNodes.get('chords');
    if (chordTrack && this.mixbus && (!chordTrack.mute || chordTrack.solo)) {
      for (const c of arr.chords) {
        const { time, absBeat } = getEventTime(c.bar, c.beat);
        if (absBeat >= startBeat && absBeat < endBeat && time >= this.ctx.currentTime - 0.05) {
          const durSec = c.duration_beats * secondsPerBeat;
          const vel = c.velocity || 90;
          (c.notes || []).forEach((noteStr, idx) => {
            const midi = noteToMidi(noteStr);
            playChordVoice(
              this.ctx!,
              chordTrack.gain,
              this.mixbus!.assets,
              time + idx * 0.008,
              midiToHz(midi),
              durSec,
              vel,
            );
          });
        }
      }
    }

    // 2. Pad — Door pad voice on B's pad stem (not a hidden chord bed)
    const padTrack = this.trackNodes.get('pad');
    if (padTrack && this.mixbus && (!padTrack.mute || padTrack.solo) && arr.pad) {
      for (const p of arr.pad) {
        const { time, absBeat } = getEventTime(p.bar, p.beat);
        if (absBeat >= startBeat && absBeat < endBeat && time >= this.ctx.currentTime - 0.05) {
          const durSec = p.duration_beats * secondsPerBeat;
          const notes = p.midi_notes?.length ? p.midi_notes : (p.notes || []).map(noteToMidi);
          for (const midi of notes) {
            playPadVoice(this.ctx!, padTrack.gain, time, midiToHz(midi), durSec, p.velocity || 75);
          }
        }
      }
    }

    // 3. Bass
    const bassTrack = this.trackNodes.get('bass');
    if (bassTrack && this.mixbus && (!bassTrack.mute || bassTrack.solo)) {
      for (const b of arr.bass) {
        const { time, absBeat } = getEventTime(b.bar, b.beat);
        if (absBeat >= startBeat && absBeat < endBeat && time >= this.ctx.currentTime - 0.05) {
          const durSec = Math.max(0.15, b.duration_beats * secondsPerBeat - 0.05);
          playBassVoice(
            this.ctx!,
            bassTrack.gain,
            this.mixbus.assets,
            time,
            midiToHz(b.midi),
            durSec,
            b.velocity || 100,
          );
        }
      }
    }

    // 4. Drums
    const drumTrack = this.trackNodes.get('drums');
    if (drumTrack && this.mixbus && (!drumTrack.mute || drumTrack.solo)) {
      for (const d of arr.drums) {
        const { time, absBeat } = getEventTime(d.bar, d.beat);
        if (absBeat >= startBeat && absBeat < endBeat && time >= this.ctx.currentTime - 0.05) {
          playDrumMidi(
            this.ctx!,
            drumTrack.gain,
            this.mixbus.assets,
            time,
            drumPieceMidi(d.piece, d.midi_note),
            d.velocity || 100,
          );
        }
      }
    }

    // 5. Melody Guide
    const melodyTrack = this.trackNodes.get('melody');
    if (melodyTrack && (!melodyTrack.mute || melodyTrack.solo)) {
      for (const m of arr.melody) {
        const { time, absBeat } = getEventTime(m.bar, m.beat);
        if (absBeat >= startBeat && absBeat < endBeat && time >= this.ctx.currentTime - 0.05) {
          const durSec = Math.max(0.1, m.duration_beats * secondsPerBeat);
          playMelodyVoice(this.ctx!, melodyTrack.gain, time, midiToHz(m.midi), durSec, m.velocity || 105);
        }
      }
    }

    // 6. Metronome Click
    if (this.metronomeEnabled && this.masterGain) {
      const beatInt = Math.floor(startBeat);
      const endInt = Math.floor(endBeat);
      for (let b = beatInt; b <= endInt; b++) {
        if (b >= startBeat && b < endBeat) {
          const isDownbeat = b % this.beatsPerBar === 0;
          const clickTime = this.playbackStartTime + b * secondsPerBeat;
          this.playClick(clickTime, isDownbeat);
        }
      }
    }
  }


  public playPianoChord(notes: string[], time: number, duration: number, velocity: number, dest?: GainNode) {
    this.initContext();
    if (!this.ctx || !this.mixbus) return;
    this.mixbus.start(this.ctx.currentTime);
    const out = dest || this.trackNodes.get('chords')?.gain;
    if (!out) return;
    const now = Math.max(this.ctx.currentTime, time || 0);
    const vel = Math.round(Math.max(0, Math.min(1, velocity)) * 127);
    notes.forEach((noteStr, idx) => {
      playChordVoice(
        this.ctx!,
        out,
        this.mixbus!.assets,
        now + idx * 0.008,
        midiToHz(noteToMidi(noteStr)),
        duration,
        vel,
      );
    });
  }

  private playClick(time: number, isDownbeat: boolean) {
    if (!this.ctx || !this.masterGain) return;
    const now = Math.max(this.ctx.currentTime, time);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isDownbeat ? 1200 : 800, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }


  // --- VOCAL SCRATCH RECORDER ---

  public async startVocalRecording(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.recordedAudioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.recordedAudioUrl = URL.createObjectURL(this.recordedAudioBlob);
      };

      this.mediaRecorder.start();
      this.isRecordingVocal = true;

      // Also start playback from beginning so singer hears the track!
      this.seekToBeat(0);
      this.play();
      return true;
    } catch (err) {
      console.warn('Microphone permission not granted or unavailable:', err);
      return false;
    }
  }

  public stopVocalRecording(): { blob: Blob | null; url: string | null } {
    if (this.mediaRecorder && this.isRecordingVocal) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      this.isRecordingVocal = false;
    }
    this.pause();
    return {
      blob: this.recordedAudioBlob,
      url: this.recordedAudioUrl,
    };
  }

  public getRecordedVocal(): { blob: Blob | null; url: string | null } {
    return {
      blob: this.recordedAudioBlob,
      url: this.recordedAudioUrl,
    };
  }
}

export const audioEngine = new AudioEngine();
