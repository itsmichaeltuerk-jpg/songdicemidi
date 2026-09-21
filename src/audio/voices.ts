/**
 * Producer-frontend voices, ported from the live Song Dice producer app
 * (song-dice-producer-frontend.vercel.app AudioEngine) and wired to the
 * unified Arrangement transport.
 *
 * Ear goals vs the previous HQ demo bus:
 * - Chords: EP hammer + closing lowpass + tanh (not thin triangle shimmer)
 * - Pad bed: slow detuned stack under the lowest chord tone
 * - Bass: folded 45–160 Hz sine sub + saturated saw so it locks with the kick
 * - Melody: saw+sine with delayed vibrato, sitting above the bed
 * - Drums: pitch-swept kick, buffered snare/clap, metallic hat
 */

export const DRUM_MIDI = {
  kick: 36,
  rim: 37,
  snare: 38,
  clap: 39,
  hatClosed: 42,
  hatOpen: 46,
  crash: 49,
} as const

export interface VoiceAssets {
  keysSaturation: Float32Array<ArrayBuffer>
  bassSaturation: Float32Array<ArrayBuffer>
  snareNoise: AudioBuffer
  hatNoise: AudioBuffer
  crashNoise: AudioBuffer
}

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

/** Keep bass in the producer’s audible pocket so it locks with the kick. */
export function foldBassHz(freq: number): number {
  let f = freq
  while (f < 45) f *= 2
  while (f > 160) f /= 2
  return f
}

function vel(raw: number, fallback: number, floor = 0.1): number {
  return Math.max(floor, Math.min(1, (raw || fallback) / 127))
}

function startNow(ctx: AudioContext, when: number): number {
  return Math.max(ctx.currentTime + 0.002, when)
}

export function makeSaturationCurves(): {
  keys: Float32Array<ArrayBuffer>
  bass: Float32Array<ArrayBuffer>
} {
  const n = 1024
  const keys = new Float32Array(new ArrayBuffer(n * 4))
  const bass = new Float32Array(new ArrayBuffer(n * 4))
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1
    bass[i] = (3.8 * x) / (1 + 2.8 * Math.abs(x))
    keys[i] = Math.tanh(x * 1.4)
  }
  return { keys, bass }
}

export function makeNoiseBuffers(
  ctx: BaseAudioContext,
): Omit<VoiceAssets, 'keysSaturation' | 'bassSaturation'> {
  const rate = ctx.sampleRate

  const snareLen = Math.floor(rate * 0.22)
  const snareNoise = ctx.createBuffer(1, snareLen, rate)
  const snareData = snareNoise.getChannelData(0)
  for (let i = 0; i < snareLen; i++) {
    const env = Math.exp(-i / (rate * 0.04)) * 0.8 + Math.exp(-i / (rate * 0.09)) * 0.2
    snareData[i] = (Math.random() * 2 - 1) * env
  }

  const hatLen = Math.floor(rate * 0.07)
  const hatNoise = ctx.createBuffer(1, hatLen, rate)
  const hatData = hatNoise.getChannelData(0)
  for (let i = 0; i < hatLen; i++) {
    const env = Math.exp(-i / (rate * 0.014))
    const t = i / rate
    const metallic =
      (Math.sin(t * 8320 * 2 * Math.PI) +
        Math.sin(t * 11450 * 2 * Math.PI) +
        Math.sin(t * 14200 * 2 * Math.PI)) *
      0.25
    hatData[i] = ((Math.random() * 2 - 1) * 0.75 + metallic) * env
  }

  const crashLen = Math.floor(rate * 0.65)
  const crashNoise = ctx.createBuffer(1, crashLen, rate)
  const crashData = crashNoise.getChannelData(0)
  for (let i = 0; i < crashLen; i++) {
    crashData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (rate * 0.18))
  }

  return { snareNoise, hatNoise, crashNoise }
}

export function playChordVoice(
  ctx: AudioContext,
  dest: AudioNode,
  assets: VoiceAssets,
  time: number,
  freq: number,
  duration: number,
  velocity: number,
): void {
  if (freq <= 0) return
  const v = vel(velocity, 90)
  const t = startNow(ctx, time)
  const dur = Math.max(0.08, duration)
  const mix = ctx.createGain()

  const click = ctx.createOscillator()
  const clickBp = ctx.createBiquadFilter()
  const clickGain = ctx.createGain()
  click.type = 'sine'
  click.frequency.setValueAtTime(Math.min(6000, freq * 2.756), t)
  clickBp.type = 'bandpass'
  clickBp.frequency.setValueAtTime(Math.min(4200, freq * 3.5), t)
  clickBp.Q.setValueAtTime(2.2, t)
  const clickPeak = v * 0.16
  clickGain.gain.setValueAtTime(1e-4, t)
  clickGain.gain.linearRampToValueAtTime(clickPeak, t + 0.003)
  clickGain.gain.exponentialRampToValueAtTime(1e-4, t + 0.08)
  click.connect(clickBp)
  clickBp.connect(clickGain)
  clickGain.connect(mix)

  const tri = ctx.createOscillator()
  const saw = ctx.createOscillator()
  const lp = ctx.createBiquadFilter()
  const body = ctx.createGain()
  tri.type = 'triangle'
  tri.frequency.setValueAtTime(freq, t)
  saw.type = 'sawtooth'
  saw.frequency.setValueAtTime(freq * 1.0022, t)
  lp.type = 'lowpass'
  lp.Q.setValueAtTime(1.5, t)
  const openHz = Math.min(4200, freq * 4.5 * (0.65 + v * 0.55))
  const closeHz = Math.min(1800, freq * 1.8)
  lp.frequency.setValueAtTime(openHz, t)
  lp.frequency.exponentialRampToValueAtTime(closeHz, t + Math.min(0.55, dur * 0.8))
  const peak = v * 0.22
  const sustain = Math.max(0.001, peak * 0.65)
  body.gain.setValueAtTime(1e-4, t)
  body.gain.linearRampToValueAtTime(peak, t + 0.012)
  body.gain.exponentialRampToValueAtTime(sustain, t + Math.min(0.35, dur * 0.5))
  body.gain.setValueAtTime(sustain, t + Math.max(0.04, dur - 0.05))
  body.gain.exponentialRampToValueAtTime(1e-4, t + dur + 0.08)
  tri.connect(lp)
  saw.connect(lp)
  lp.connect(body)

  const sat = ctx.createWaveShaper()
  sat.curve = assets.keysSaturation
  body.connect(sat)
  sat.connect(mix)
  mix.connect(dest)

  const stopAt = t + dur + 0.12
  click.start(t)
  tri.start(t)
  saw.start(t)
  click.stop(t + 0.09)
  tri.stop(stopAt)
  saw.stop(stopAt)
}

export function playMelodyVoice(
  ctx: AudioContext,
  dest: AudioNode,
  time: number,
  freq: number,
  duration: number,
  velocity: number,
): void {
  if (freq <= 0) return
  const v = vel(velocity, 88)
  const t = startNow(ctx, time)
  const dur = Math.max(0.06, duration)
  const mix = ctx.createGain()

  const saw = ctx.createOscillator()
  saw.type = 'sawtooth'
  saw.frequency.setValueAtTime(freq, t)
  const sine = ctx.createOscillator()
  sine.type = 'sine'
  sine.frequency.setValueAtTime(freq, t)

  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.type = 'sine'
  lfo.frequency.setValueAtTime(5.4, t)
  lfoGain.gain.setValueAtTime(0, t)
  lfoGain.gain.setValueAtTime(0, t + 0.14)
  lfoGain.gain.linearRampToValueAtTime(freq * 0.01, t + Math.min(0.4, dur))
  lfo.connect(lfoGain)
  lfoGain.connect(saw.frequency)
  lfoGain.connect(sine.frequency)

  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.Q.setValueAtTime(1.8, t)
  const peakHz = Math.min(2800, freq * 3.2 * (0.7 + v * 0.4))
  const closeHz = Math.min(1800, freq * 1.8)
  lp.frequency.setValueAtTime(Math.min(900, freq * 1.4), t)
  lp.frequency.exponentialRampToValueAtTime(peakHz, t + 0.025)
  lp.frequency.exponentialRampToValueAtTime(closeHz, t + dur)

  const g = ctx.createGain()
  const peak = v * 0.16
  g.gain.setValueAtTime(1e-4, t)
  g.gain.linearRampToValueAtTime(peak, t + 0.016)
  g.gain.setValueAtTime(peak * 0.88, t + Math.max(0.02, dur - 0.04))
  g.gain.linearRampToValueAtTime(1e-4, t + dur + 0.04)
  saw.connect(lp)
  sine.connect(lp)
  lp.connect(g)
  g.connect(mix)
  mix.connect(dest)

  const stopAt = t + dur + 0.06
  lfo.start(t)
  saw.start(t)
  sine.start(t)
  lfo.stop(stopAt)
  saw.stop(stopAt)
  sine.stop(stopAt)
}

export function playPadVoice(
  ctx: AudioContext,
  dest: AudioNode,
  time: number,
  freq: number,
  duration: number,
  velocity: number,
): void {
  if (freq <= 0) return
  const v = vel(velocity, 65)
  const t = startNow(ctx, time)
  const dur = Math.max(0.25, duration)
  const mix = ctx.createGain()

  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.Q.setValueAtTime(1.8, t)
  const openHz = Math.min(1600, freq * 2.8 * (0.75 + v * 0.45))
  lp.frequency.setValueAtTime(420, t)
  lp.frequency.linearRampToValueAtTime(openHz, t + Math.min(0.8, dur * 0.4))
  lp.frequency.linearRampToValueAtTime(Math.min(1000, openHz * 0.7), t + dur)

  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.type = 'sine'
  lfo.frequency.setValueAtTime(0.28, t)
  lfoGain.gain.setValueAtTime(120, t)
  lfo.connect(lfoGain)
  lfoGain.connect(lp.frequency)

  const tri = ctx.createOscillator()
  tri.type = 'triangle'
  tri.frequency.setValueAtTime(freq, t)
  const sawL = ctx.createOscillator()
  sawL.type = 'sawtooth'
  sawL.frequency.setValueAtTime(freq * 0.9985, t)
  const sawC = ctx.createOscillator()
  sawC.type = 'sawtooth'
  sawC.frequency.setValueAtTime(freq * 1.0015, t)
  const sawR = ctx.createOscillator()
  sawR.type = 'sawtooth'
  sawR.frequency.setValueAtTime(freq * 0.9965, t)
  const sine = ctx.createOscillator()
  sine.type = 'sine'
  sine.frequency.setValueAtTime(freq, t)
  tri.connect(lp)
  sawL.connect(lp)
  sawC.connect(lp)
  sawR.connect(lp)
  sine.connect(lp)

  const g = ctx.createGain()
  const peak = v * 0.16
  const attack = Math.min(0.35, dur * 0.25)
  const release = 0.45
  g.gain.setValueAtTime(1e-4, t)
  g.gain.linearRampToValueAtTime(peak, t + attack)
  g.gain.setValueAtTime(peak * 0.88, t + Math.max(attack, dur - 0.15))
  g.gain.linearRampToValueAtTime(1e-4, t + dur + release)
  lp.connect(g)
  g.connect(mix)
  mix.connect(dest)

  const stopAt = t + dur + release + 0.05
  lfo.start(t)
  tri.start(t)
  sawL.start(t)
  sawC.start(t)
  sawR.start(t)
  sine.start(t)
  lfo.stop(stopAt)
  tri.stop(stopAt)
  sawL.stop(stopAt)
  sawC.stop(stopAt)
  sawR.stop(stopAt)
  sine.stop(stopAt)
}

export function playBassVoice(
  ctx: AudioContext,
  dest: AudioNode,
  assets: VoiceAssets,
  time: number,
  freq: number,
  duration: number,
  velocity: number,
): void {
  if (freq <= 0) return
  const f = foldBassHz(freq)
  const v = vel(velocity, 110, 0.2)
  const t = startNow(ctx, time)
  const dur = Math.max(0.1, duration)
  const mix = ctx.createGain()

  const sub = ctx.createOscillator()
  const subGain = ctx.createGain()
  sub.type = 'sine'
  sub.frequency.setValueAtTime(f, t)
  const subPeak = v * 0.38
  subGain.gain.setValueAtTime(1e-4, t)
  subGain.gain.linearRampToValueAtTime(subPeak, t + 0.01)
  subGain.gain.setValueAtTime(subPeak * 0.92, t + dur - 0.03)
  subGain.gain.linearRampToValueAtTime(1e-4, t + dur)
  sub.connect(subGain)
  subGain.connect(mix)

  const saw = ctx.createOscillator()
  const lp = ctx.createBiquadFilter()
  const sawGain = ctx.createGain()
  saw.type = 'sawtooth'
  saw.frequency.setValueAtTime(f, t)
  lp.type = 'lowpass'
  lp.Q.setValueAtTime(3.2, t)
  lp.frequency.setValueAtTime(1400, t)
  lp.frequency.exponentialRampToValueAtTime(340, t + Math.min(0.22, dur))
  const sawPeak = v * 0.24
  sawGain.gain.setValueAtTime(1e-4, t)
  sawGain.gain.linearRampToValueAtTime(sawPeak, t + 0.008)
  sawGain.gain.setValueAtTime(sawPeak * 0.85, t + dur - 0.03)
  sawGain.gain.linearRampToValueAtTime(1e-4, t + dur)
  saw.connect(lp)
  lp.connect(sawGain)
  const sat = ctx.createWaveShaper()
  sat.curve = assets.bassSaturation
  sawGain.connect(sat)
  sat.connect(mix)

  const click = ctx.createOscillator()
  const clickGain = ctx.createGain()
  click.type = 'triangle'
  click.frequency.setValueAtTime(f * 2.2, t)
  click.frequency.exponentialRampToValueAtTime(f, t + 0.025)
  const clickPeak = v * 0.22
  clickGain.gain.setValueAtTime(1e-4, t)
  clickGain.gain.linearRampToValueAtTime(clickPeak, t + 0.003)
  clickGain.gain.exponentialRampToValueAtTime(1e-4, t + 0.035)
  click.connect(clickGain)
  clickGain.connect(mix)
  mix.connect(dest)

  const stopAt = t + dur + 0.02
  sub.start(t)
  saw.start(t)
  click.start(t)
  sub.stop(stopAt)
  saw.stop(stopAt)
  click.stop(t + 0.04)
}

function playKick(ctx: AudioContext, dest: AudioNode, t: number, v: number): void {
  const mix = ctx.createGain()
  const body = ctx.createOscillator()
  const bodyGain = ctx.createGain()
  body.frequency.setValueAtTime(145, t)
  body.frequency.exponentialRampToValueAtTime(44, t + 0.075)
  const peak = v * 0.42
  bodyGain.gain.setValueAtTime(1e-4, t)
  bodyGain.gain.linearRampToValueAtTime(peak, t + 0.003)
  bodyGain.gain.exponentialRampToValueAtTime(1e-4, t + 0.24)
  body.connect(bodyGain)
  bodyGain.connect(mix)

  const click = ctx.createOscillator()
  const clickGain = ctx.createGain()
  const bp = ctx.createBiquadFilter()
  click.type = 'triangle'
  click.frequency.setValueAtTime(2400, t)
  click.frequency.exponentialRampToValueAtTime(400, t + 0.015)
  bp.type = 'bandpass'
  bp.frequency.setValueAtTime(2200, t)
  bp.Q.setValueAtTime(1.5, t)
  clickGain.gain.setValueAtTime(1e-4, t)
  clickGain.gain.linearRampToValueAtTime(v * 0.12, t + 0.002)
  clickGain.gain.exponentialRampToValueAtTime(1e-4, t + 0.02)
  click.connect(bp)
  bp.connect(clickGain)
  clickGain.connect(mix)
  mix.connect(dest)

  body.start(t)
  click.start(t)
  body.stop(t + 0.25)
  click.stop(t + 0.03)
}

function playSnare(ctx: AudioContext, dest: AudioNode, assets: VoiceAssets, t: number, v: number): void {
  const mix = ctx.createGain()
  const noise = ctx.createBufferSource()
  noise.buffer = assets.snareNoise
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.setValueAtTime(2800, t)
  bp.Q.setValueAtTime(1.2, t)
  const noiseGain = ctx.createGain()
  const nPeak = v * 0.32
  noiseGain.gain.setValueAtTime(1e-4, t)
  noiseGain.gain.linearRampToValueAtTime(nPeak, t + 0.003)
  noiseGain.gain.exponentialRampToValueAtTime(1e-4, t + 0.18)
  noise.connect(bp)
  bp.connect(noiseGain)
  noiseGain.connect(mix)
  noise.start(t)
  noise.stop(t + 0.2)

  const body = ctx.createOscillator()
  const bodyGain = ctx.createGain()
  body.type = 'triangle'
  body.frequency.setValueAtTime(195, t)
  body.frequency.exponentialRampToValueAtTime(125, t + 0.045)
  const bPeak = v * 0.24
  bodyGain.gain.setValueAtTime(1e-4, t)
  bodyGain.gain.linearRampToValueAtTime(bPeak, t + 0.003)
  bodyGain.gain.exponentialRampToValueAtTime(1e-4, t + 0.09)
  body.connect(bodyGain)
  bodyGain.connect(mix)
  mix.connect(dest)
  body.start(t)
  body.stop(t + 0.1)
}

function playClap(ctx: AudioContext, dest: AudioNode, assets: VoiceAssets, t: number, v: number): void {
  const mix = ctx.createGain()
  const offsets = [0, 0.011, 0.022]
  offsets.forEach((off, i) => {
    const src = ctx.createBufferSource()
    src.buffer = assets.snareNoise
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.setValueAtTime(1600 + i * 250, t + off)
    bp.Q.setValueAtTime(2, t + off)
    const g = ctx.createGain()
    const last = i === offsets.length - 1
    const peak = v * (last ? 0.35 : 0.18)
    g.gain.setValueAtTime(1e-4, t + off)
    g.gain.linearRampToValueAtTime(peak, t + off + 0.002)
    g.gain.exponentialRampToValueAtTime(1e-4, t + off + (last ? 0.22 : 0.025))
    src.connect(bp)
    bp.connect(g)
    g.connect(mix)
    src.start(t + off)
    src.stop(t + off + (last ? 0.24 : 0.03))
  })
  mix.connect(dest)
}

function playOpenOrCrash(
  ctx: AudioContext,
  dest: AudioNode,
  assets: VoiceAssets,
  t: number,
  v: number,
  crash: boolean,
): void {
  const src = ctx.createBufferSource()
  src.buffer = assets.crashNoise
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.setValueAtTime(crash ? 3800 : 5200, t)
  const g = ctx.createGain()
  const peak = v * (crash ? 0.24 : 0.18)
  const dur = crash ? 0.55 : 0.35
  g.gain.setValueAtTime(1e-4, t)
  g.gain.linearRampToValueAtTime(peak, t + 0.004)
  g.gain.exponentialRampToValueAtTime(1e-4, t + dur)
  src.connect(hp)
  hp.connect(g)
  g.connect(dest)
  src.start(t)
  src.stop(t + (crash ? 0.6 : 0.38))
}

function playClosedHat(ctx: AudioContext, dest: AudioNode, assets: VoiceAssets, t: number, v: number): void {
  const src = ctx.createBufferSource()
  src.buffer = assets.hatNoise
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.setValueAtTime(6200, t)
  const peakEq = ctx.createBiquadFilter()
  peakEq.type = 'peaking'
  peakEq.frequency.setValueAtTime(7800, t)
  peakEq.gain.setValueAtTime(1.5, t)
  const g = ctx.createGain()
  g.gain.setValueAtTime(1e-4, t)
  g.gain.linearRampToValueAtTime(v * 0.16, t + 0.002)
  g.gain.exponentialRampToValueAtTime(1e-4, t + 0.055)
  src.connect(hp)
  hp.connect(peakEq)
  peakEq.connect(g)
  g.connect(dest)
  src.start(t)
  src.stop(t + 0.06)
}

export function playDrumMidi(
  ctx: AudioContext,
  dest: AudioNode,
  assets: VoiceAssets,
  time: number,
  midi: number,
  velocity: number,
): void {
  const v = vel(velocity, 100)
  const t = startNow(ctx, time)
  if (midi === DRUM_MIDI.kick) playKick(ctx, dest, t, v)
  else if (midi === DRUM_MIDI.snare || midi === DRUM_MIDI.rim) playSnare(ctx, dest, assets, t, v)
  else if (midi === DRUM_MIDI.clap) playClap(ctx, dest, assets, t, v)
  else if (midi === DRUM_MIDI.hatOpen) playOpenOrCrash(ctx, dest, assets, t, v, false)
  else if (midi === DRUM_MIDI.crash) playOpenOrCrash(ctx, dest, assets, t, v, true)
  else playClosedHat(ctx, dest, assets, t, v)
}
