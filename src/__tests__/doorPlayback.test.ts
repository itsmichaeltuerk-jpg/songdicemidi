import { describe, expect, it } from 'vitest';
import { noteToMidi } from '../services/chordParser';
import {
  AI_MISSED_TOAST,
  collapsedNoteTop,
  drumPieceMidi,
  landProduceOrLocal,
  seekBeatFromClick,
} from '../audio/doorPlayback';
import { DRUM_MIDI, foldBassHz, midiToHz } from '../audio/voices';

describe('Door voices helpers', () => {
  it('keeps A4 at 440 and folds bass into the kick pocket', () => {
    expect(midiToHz(69)).toBeCloseTo(440, 8);
    expect(foldBassHz(midiToHz(36))).toBeGreaterThanOrEqual(45);
    expect(foldBassHz(midiToHz(36))).toBeLessThanOrEqual(160);
  });
});

describe('drum piece map', () => {
  it('maps songdicemidi pieces onto Door GM midi', () => {
    expect(drumPieceMidi('kick')).toBe(DRUM_MIDI.kick);
    expect(drumPieceMidi('hat')).toBe(DRUM_MIDI.hatClosed);
    expect(drumPieceMidi('open_hat')).toBe(DRUM_MIDI.hatOpen);
    expect(drumPieceMidi('clap')).toBe(DRUM_MIDI.clap);
  });
});

describe('produce honesty', () => {
  it('stamps AI only when Gemini actually returned a take', () => {
    expect(landProduceOrLocal({ id: 'ai' }, { id: 'local' })).toEqual({
      arrangement: { id: 'ai' },
      missed: false,
      source: 'ai',
    });
    expect(landProduceOrLocal(null, () => ({ id: 'quick' }))).toEqual({
      arrangement: { id: 'quick' },
      missed: true,
      source: 'local',
    });
    expect(AI_MISSED_TOAST).toMatch(/AI missed/);
  });
});

describe('compact piano roll', () => {
  it('places higher pitch-class notes higher in a lane', () => {
    expect(collapsedNoteTop(71, 0, 28)).toBeLessThan(collapsedNoteTop(60, 0, 28));
  });

  it('maps a mid-timeline tap to beat 16 on an 8-bar 4/4 loop', () => {
    expect(seekBeatFromClick(0.5, 8, 4)).toBeCloseTo(16, 5);
  });
});

describe('chord parser midi', () => {
  it('reads note names the Door voices expect', () => {
    expect(noteToMidi('A4')).toBe(69);
    expect(noteToMidi('C4')).toBe(60);
  });
});
