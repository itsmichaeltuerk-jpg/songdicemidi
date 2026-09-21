/**
 * Door mix graph (HQ voices + limiter), with an independent pad bus.
 * Track faders/pan still live on audioEngine; these gains are stem trims.
 */
import { makeNoiseBuffers, makeSaturationCurves, type VoiceAssets } from './voices.ts';

export type BusId = 'melody' | 'chords' | 'pad' | 'bass' | 'drums';

export class MixBus {
  readonly assets: VoiceAssets;
  private fade: GainNode;
  private master: GainNode;
  private inputs: Record<BusId, GainNode>;
  private limiter: DynamicsCompressorNode;

  constructor(ctx: AudioContext, dest: AudioNode) {
    const curves = makeSaturationCurves();
    const noise = makeNoiseBuffers(ctx);
    this.assets = {
      keysSaturation: curves.keys,
      bassSaturation: curves.bass,
      ...noise,
    };

    this.fade = ctx.createGain();
    this.fade.gain.value = 1e-4;
    this.fade.connect(dest);

    const safety = ctx.createWaveShaper();
    const n = 2048;
    const curve = new Float32Array(new ArrayBuffer(n * 4));
    const amount = 1.15;
    const denom = Math.tanh(amount);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      curve[i] = Math.tanh(amount * x) / denom;
    }
    safety.curve = curve;
    safety.oversample = '2x';
    safety.connect(this.fade);

    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.setValueAtTime(-6, ctx.currentTime);
    this.limiter.knee.setValueAtTime(6, ctx.currentTime);
    this.limiter.ratio.setValueAtTime(12, ctx.currentTime);
    this.limiter.attack.setValueAtTime(0.0015, ctx.currentTime);
    this.limiter.release.setValueAtTime(0.1, ctx.currentTime);
    this.limiter.connect(safety);

    const deharsh = ctx.createBiquadFilter();
    deharsh.type = 'highshelf';
    deharsh.frequency.setValueAtTime(7200, ctx.currentTime);
    deharsh.gain.setValueAtTime(-2.5, ctx.currentTime);
    deharsh.connect(this.limiter);

    const masterHpf = ctx.createBiquadFilter();
    masterHpf.type = 'highpass';
    masterHpf.frequency.setValueAtTime(25, ctx.currentTime);
    masterHpf.connect(deharsh);

    this.master = ctx.createGain();
    this.master.gain.setValueAtTime(0.62, ctx.currentTime);
    this.master.connect(masterHpf);

    const chordsHpf = ctx.createBiquadFilter();
    chordsHpf.type = 'highpass';
    chordsHpf.frequency.setValueAtTime(160, ctx.currentTime);
    chordsHpf.connect(this.master);

    const padHpf = ctx.createBiquadFilter();
    padHpf.type = 'highpass';
    padHpf.frequency.setValueAtTime(150, ctx.currentTime);
    const padShelf = ctx.createBiquadFilter();
    padShelf.type = 'highshelf';
    padShelf.frequency.setValueAtTime(3200, ctx.currentTime);
    padShelf.gain.setValueAtTime(1, ctx.currentTime);
    padHpf.connect(padShelf);
    padShelf.connect(this.master);

    const melodyHpf = ctx.createBiquadFilter();
    melodyHpf.type = 'highpass';
    melodyHpf.frequency.setValueAtTime(200, ctx.currentTime);
    melodyHpf.connect(this.master);

    const delay = ctx.createDelay(1);
    delay.delayTime.setValueAtTime(0.24, ctx.currentTime);
    const delayFb = ctx.createGain();
    delayFb.gain.setValueAtTime(0.22, ctx.currentTime);
    const delayLp = ctx.createBiquadFilter();
    delayLp.type = 'lowpass';
    delayLp.frequency.setValueAtTime(2400, ctx.currentTime);
    delay.connect(delayLp);
    delayLp.connect(delayFb);
    delayFb.connect(delay);
    delayLp.connect(this.master);
    const delaySend = ctx.createGain();
    delaySend.gain.setValueAtTime(0.2, ctx.currentTime);
    melodyHpf.connect(delaySend);
    delaySend.connect(delay);

    const bassBody = ctx.createBiquadFilter();
    bassBody.type = 'peaking';
    bassBody.frequency.setValueAtTime(105, ctx.currentTime);
    bassBody.Q.setValueAtTime(1.4, ctx.currentTime);
    bassBody.gain.setValueAtTime(3.5, ctx.currentTime);
    const bassPresence = ctx.createBiquadFilter();
    bassPresence.type = 'peaking';
    bassPresence.frequency.setValueAtTime(800, ctx.currentTime);
    bassPresence.Q.setValueAtTime(1.8, ctx.currentTime);
    bassPresence.gain.setValueAtTime(2.5, ctx.currentTime);
    bassBody.connect(bassPresence);
    bassPresence.connect(this.master);

    const drumsAir = ctx.createBiquadFilter();
    drumsAir.type = 'peaking';
    drumsAir.frequency.setValueAtTime(3200, ctx.currentTime);
    drumsAir.gain.setValueAtTime(1.5, ctx.currentTime);
    drumsAir.connect(this.master);

    const chordsIn = ctx.createGain();
    chordsIn.connect(chordsHpf);
    const padIn = ctx.createGain();
    padIn.connect(padHpf);
    const melodyIn = ctx.createGain();
    melodyIn.connect(melodyHpf);
    const bassIn = ctx.createGain();
    bassIn.connect(bassBody);
    const drumsIn = ctx.createGain();
    drumsIn.connect(drumsAir);

    this.inputs = {
      chords: chordsIn,
      pad: padIn,
      melody: melodyIn,
      bass: bassIn,
      drums: drumsIn,
    };

    chordsIn.gain.setValueAtTime(0.74, ctx.currentTime);
    padIn.gain.setValueAtTime(0.62, ctx.currentTime);
    melodyIn.gain.setValueAtTime(0.5, ctx.currentTime);
    bassIn.gain.setValueAtTime(1, ctx.currentTime);
    drumsIn.gain.setValueAtTime(0.9, ctx.currentTime);
  }

  stemInput(stem: BusId): GainNode {
    return this.inputs[stem];
  }

  start(time: number): void {
    const g = this.fade.gain;
    g.cancelScheduledValues(time);
    g.setValueAtTime(Math.max(1e-4, g.value), time);
    g.linearRampToValueAtTime(1, time + 0.02);
  }

  stop(time: number): void {
    const g = this.fade.gain;
    g.cancelScheduledValues(time);
    g.setValueAtTime(Math.max(1e-4, g.value), time);
    g.linearRampToValueAtTime(1e-4, time + 0.12);
  }
}
