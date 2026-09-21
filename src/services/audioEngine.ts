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

  // Mixer nodes
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

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // Initialize track channels: melody, chords, pad, bass, drums
      const trackIds = ['melody', 'chords', 'pad', 'bass', 'drums'];
      for (const id of trackIds) {
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.8, this.ctx.currentTime);

        let panner: StereoPannerNode | null = null;
        if (this.ctx.createStereoPanner) {
          panner = this.ctx.createStereoPanner();
          gain.connect(panner);
          panner.connect(this.masterGain);
        } else {
          gain.connect(this.masterGain);
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

    this.startSchedulerLoop();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
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

    // 1. Chords / Piano
    const chordTrack = this.trackNodes.get('chords');
    if (chordTrack && (!chordTrack.mute || chordTrack.solo)) {
      for (const c of arr.chords) {
        const { time, absBeat } = getEventTime(c.bar, c.beat);
        if (absBeat >= startBeat && absBeat < endBeat && time >= this.ctx.currentTime - 0.05) {
          const durSec = c.duration_beats * secondsPerBeat;
          this.playPianoChord(c.notes, time, durSec, (c.velocity || 90) / 127, chordTrack.gain);
        }
      }
    }

    // 2. Pad
    const padTrack = this.trackNodes.get('pad');
    if (padTrack && (!padTrack.mute || padTrack.solo) && arr.pad) {
      for (const p of arr.pad) {
        const { time, absBeat } = getEventTime(p.bar, p.beat);
        if (absBeat >= startBeat && absBeat < endBeat && time >= this.ctx.currentTime - 0.05) {
          const durSec = p.duration_beats * secondsPerBeat;
          this.playWarmPad(p.notes, time, durSec, (p.velocity || 75) / 127, padTrack.gain);
        }
      }
    }

    // 3. Bass
    const bassTrack = this.trackNodes.get('bass');
    if (bassTrack && (!bassTrack.mute || bassTrack.solo)) {
      for (const b of arr.bass) {
        const { time, absBeat } = getEventTime(b.bar, b.beat);
        if (absBeat >= startBeat && absBeat < endBeat && time >= this.ctx.currentTime - 0.05) {
          const durSec = Math.max(0.15, b.duration_beats * secondsPerBeat - 0.05);
          this.playBassNote(b.midi, time, durSec, (b.velocity || 100) / 127, bassTrack.gain, b.articulation);
        }
      }
    }

    // 4. Drums
    const drumTrack = this.trackNodes.get('drums');
    if (drumTrack && (!drumTrack.mute || drumTrack.solo)) {
      for (const d of arr.drums) {
        const { time, absBeat } = getEventTime(d.bar, d.beat);
        if (absBeat >= startBeat && absBeat < endBeat && time >= this.ctx.currentTime - 0.05) {
          this.playDrumPiece(d.piece, time, (d.velocity || 100) / 127, drumTrack.gain);
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
          this.playMelodyLead(m.midi, time, durSec, (m.velocity || 105) / 127, melodyTrack.gain);
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

  // --- SYNTHESIZERS ---

  private noteToFreq(note: string | number): number {
    let midi = 60;
    if (typeof note === 'number') {
      midi = note;
    } else {
      const match = note.match(/^([A-Ga-g][#b]?)(-?\d+)$/);
      if (match) {
        const pitch = match[1].toUpperCase();
        const oct = parseInt(match[2], 10);
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        let idx = notes.indexOf(pitch);
        if (idx === -1) {
          const flats = ['C', 'DB', 'D', 'EB', 'E', 'F', 'GB', 'G', 'AB', 'A', 'BB', 'B'];
          idx = flats.indexOf(pitch);
        }
        if (idx !== -1) midi = (oct + 1) * 12 + idx;
      }
    }
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Piano Synthesizer with rich harmonics, hammer attack transient, and warm decay
  public playPianoChord(notes: string[], time: number, duration: number, velocity: number, dest: GainNode) {
    if (!this.ctx || !notes || notes.length === 0) return;
    const now = Math.max(this.ctx.currentTime, time);

    notes.forEach((noteStr, idx) => {
      const freq = this.noteToFreq(noteStr);
      const noteTime = now + idx * 0.008; // subtle strum spread

      // Fundamental oscillator (warm triangle)
      const osc1 = this.ctx!.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, noteTime);

      // Harmonic overtone (sine)
      const osc2 = this.ctx!.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, noteTime);

      // Filter for acoustic piano warmth
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(6500, freq * 4), noteTime);
      filter.frequency.exponentialRampToValueAtTime(Math.min(1200, freq * 1.5), noteTime + duration);

      // Amplitude Envelope
      const gainNode = this.ctx!.createGain();
      const peakVol = velocity * 0.28;
      gainNode.gain.setValueAtTime(0.0001, noteTime);
      gainNode.gain.exponentialRampToValueAtTime(peakVol, noteTime + 0.008); // snappy attack
      gainNode.gain.exponentialRampToValueAtTime(peakVol * 0.45, noteTime + 0.35); // initial decay
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteTime + duration + 0.2); // sustain release

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(dest);

      osc1.start(noteTime);
      osc2.start(noteTime);
      osc1.stop(noteTime + duration + 0.25);
      osc2.stop(noteTime + duration + 0.25);
    });
  }

  // Warm Pad / Strings Synthesizer
  public playWarmPad(notes: string[], time: number, duration: number, velocity: number, dest: GainNode) {
    if (!this.ctx || !notes || notes.length === 0) return;
    const now = Math.max(this.ctx.currentTime, time);

    notes.forEach((noteStr) => {
      const freq = this.noteToFreq(noteStr);

      const osc1 = this.ctx!.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq * 0.998, now); // slight chorus detune

      const osc2 = this.ctx!.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.002, now);

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.linearRampToValueAtTime(2800, now + duration * 0.5);
      filter.frequency.linearRampToValueAtTime(1200, now + duration);

      const gain = this.ctx!.createGain();
      const peakVol = velocity * 0.16;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peakVol, now + 0.4); // soft pad swell
      gain.gain.setValueAtTime(peakVol, now + Math.max(0.4, duration - 0.3));
      gain.gain.linearRampToValueAtTime(0.0001, now + duration + 0.5); // long release

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration + 0.6);
      osc2.stop(now + duration + 0.6);
    });
  }

  // Bass Synthesizer (punchy sub + round body)
  public playBassNote(midi: number, time: number, duration: number, velocity: number, dest: GainNode, articulation?: string) {
    if (!this.ctx) return;
    const now = Math.max(this.ctx.currentTime, time);
    const freq = this.noteToFreq(midi);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq * 0.5, now);

    // Punchy pitch drop at start for 808/plucked bass
    if (articulation === 'slide') {
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + duration * 0.6);
    } else {
      osc.frequency.setValueAtTime(freq * 1.15, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.04);
    }

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(800, freq * 6), now);
    filter.frequency.exponentialRampToValueAtTime(Math.min(300, freq * 2), now + duration);

    const gain = this.ctx.createGain();
    const peakVol = velocity * 0.38;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peakVol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(peakVol * 0.7, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + duration + 0.05);
    subOsc.stop(now + duration + 0.05);
  }

  // Vocal Guide / Topline Lead Synth
  public playMelodyLead(midi: number, time: number, duration: number, velocity: number, dest: GainNode) {
    if (!this.ctx) return;
    const now = Math.max(this.ctx.currentTime, time);
    const freq = this.noteToFreq(midi);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Subtle vibrato LFO after 0.2s
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(5.5, now);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0, now);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.02, now + 0.3);
    lfo.connect(osc.frequency);

    const gain = this.ctx.createGain();
    const peakVol = velocity * 0.25;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peakVol, now + 0.03); // smooth vocal attack
    gain.gain.setValueAtTime(peakVol * 0.85, now + Math.max(0.05, duration - 0.08));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.08);

    osc.connect(gain);
    gain.connect(dest);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + duration + 0.1);
    osc.stop(now + duration + 0.1);
  }

  // Drum Synthesizer Engine
  public playDrumPiece(piece: string, time: number, velocity: number, dest: GainNode) {
    if (!this.ctx) return;
    const now = Math.max(this.ctx.currentTime, time);

    switch (piece) {
      case 'kick': {
        // Pitch swept sine + transient click
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

        const gain = this.ctx.createGain();
        const vol = velocity * 0.55;
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(now);
        osc.stop(now + 0.36);
        break;
      }

      case 'snare': {
        // Tone body + noise burst
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(velocity * 0.3, now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc.connect(oscGain);
        oscGain.connect(dest);

        // White noise
        const noise = this.createNoiseBuffer(0.2);
        if (noise) {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = noise;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(1000, now);

          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(velocity * 0.4, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

          noiseSrc.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(dest);

          noiseSrc.start(now);
        }

        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }

      case 'clap': {
        const noise = this.createNoiseBuffer(0.25);
        if (noise) {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = noise;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1200, now);
          filter.Q.setValueAtTime(1.5, now);

          const gain = this.ctx.createGain();
          const vol = velocity * 0.35;
          // Clap multi-burst
          gain.gain.setValueAtTime(vol * 0.6, now);
          gain.gain.setValueAtTime(vol * 0.8, now + 0.015);
          gain.gain.setValueAtTime(vol, now + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

          noiseSrc.connect(filter);
          filter.connect(gain);
          gain.connect(dest);

          noiseSrc.start(now);
        }
        break;
      }

      case 'hat': {
        // Closed hi-hat
        const noise = this.createNoiseBuffer(0.06);
        if (noise) {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = noise;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(7500, now);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(velocity * 0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

          noiseSrc.connect(filter);
          filter.connect(gain);
          gain.connect(dest);

          noiseSrc.start(now);
        }
        break;
      }

      case 'open_hat':
      case 'crash': {
        const dur = piece === 'crash' ? 0.9 : 0.4;
        const noise = this.createNoiseBuffer(dur);
        if (noise) {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = noise;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(piece === 'crash' ? 4500 : 6000, now);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(velocity * 0.28, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

          noiseSrc.connect(filter);
          filter.connect(gain);
          gain.connect(dest);

          noiseSrc.start(now);
        }
        break;
      }

      case 'rim': {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1800, now);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }

      case 'shaker': {
        const noise = this.createNoiseBuffer(0.08);
        if (noise) {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = noise;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(6500, now);
          filter.Q.setValueAtTime(2.0, now);
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(velocity * 0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
          noiseSrc.connect(filter);
          filter.connect(gain);
          gain.connect(dest);
          noiseSrc.start(now);
        }
        break;
      }

      default:
        break;
    }
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

  private createNoiseBuffer(durationSec: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = Math.max(1, Math.round(this.ctx.sampleRate * durationSec));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
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
