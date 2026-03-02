import { settingsManager } from './settings';

// Classic Tetris Theme A (Korobeiniki) - slower, more relaxed arrangement
// Note frequencies with longer durations for a mellow feel
const MELODY_NOTES = [
  // Phrase 1 - iconic opening
  { freq: 659, dur: 0.5 },  // E5
  { freq: 494, dur: 0.25 }, // B4
  { freq: 523, dur: 0.25 }, // C5
  { freq: 587, dur: 0.5 },  // D5
  { freq: 523, dur: 0.25 }, // C5
  { freq: 494, dur: 0.25 }, // B4
  { freq: 440, dur: 0.5 },  // A4
  { freq: 440, dur: 0.25 }, // A4
  { freq: 523, dur: 0.25 }, // C5
  { freq: 659, dur: 0.5 },  // E5
  { freq: 587, dur: 0.25 }, // D5
  { freq: 523, dur: 0.25 }, // C5
  { freq: 494, dur: 0.75 }, // B4
  { freq: 523, dur: 0.25 }, // C5
  { freq: 587, dur: 0.5 },  // D5
  { freq: 659, dur: 0.5 },  // E5
  // Phrase 2
  { freq: 523, dur: 0.5 },  // C5
  { freq: 440, dur: 0.5 },  // A4
  { freq: 440, dur: 0.5 },  // A4
  { freq: 0, dur: 0.5 },    // rest
  // Phrase 3 - second half
  { freq: 587, dur: 0.5 },  // D5
  { freq: 698, dur: 0.25 }, // F5
  { freq: 880, dur: 0.5 },  // A5
  { freq: 784, dur: 0.25 }, // G5
  { freq: 698, dur: 0.25 }, // F5
  { freq: 659, dur: 0.75 }, // E5
  { freq: 523, dur: 0.25 }, // C5
  { freq: 659, dur: 0.5 },  // E5
  { freq: 587, dur: 0.25 }, // D5
  { freq: 523, dur: 0.25 }, // C5
  // Phrase 4 - resolution
  { freq: 494, dur: 0.5 },  // B4
  { freq: 494, dur: 0.25 }, // B4
  { freq: 523, dur: 0.25 }, // C5
  { freq: 587, dur: 0.5 },  // D5
  { freq: 659, dur: 0.5 },  // E5
  { freq: 523, dur: 0.5 },  // C5
  { freq: 440, dur: 0.5 },  // A4
  { freq: 440, dur: 0.5 },  // A4
  { freq: 0, dur: 1.0 },    // rest
];

// Bass line - simple, supportive
const BASS_NOTES = [
  { freq: 165, dur: 1.0 }, // E3
  { freq: 165, dur: 1.0 }, // E3
  { freq: 110, dur: 1.0 }, // A2
  { freq: 110, dur: 1.0 }, // A2
  { freq: 147, dur: 1.0 }, // D3
  { freq: 147, dur: 1.0 }, // D3
  { freq: 165, dur: 1.0 }, // E3
  { freq: 165, dur: 1.0 }, // E3
  { freq: 110, dur: 1.0 }, // A2
  { freq: 110, dur: 1.0 }, // A2
  { freq: 147, dur: 1.0 }, // D3
  { freq: 123, dur: 1.0 }, // B2
  { freq: 110, dur: 1.0 }, // A2
  { freq: 110, dur: 1.0 }, // A2
];

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Music playback state
  private musicPlaying = false;
  private musicScheduledUntil = 0;
  private musicStartTime = 0;
  private musicTempo = 70; // BPM - slow, relaxed classic Tetris feel
  private musicScheduleTimer: number | null = null;

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      // Create gain node hierarchy
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 1.0;

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.sfxGain.gain.value = settingsManager.settings.sfxVolume;

      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain);
      this.musicGain.gain.value = settingsManager.settings.musicVolume;
    }
    return this.ctx;
  }

  resume(): void {
    const ctx = this.ensureCtx();
    if (ctx.state === 'suspended') ctx.resume();
  }

  setMasterVolume(v: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, v));
    }
  }

  setSfxVolume(v: number): void {
    const vol = Math.max(0, Math.min(1, v));
    settingsManager.update({ sfxVolume: vol });
    if (this.sfxGain) {
      this.sfxGain.gain.value = vol;
    }
  }

  setMusicVolume(v: number): void {
    const vol = Math.max(0, Math.min(1, v));
    settingsManager.update({ musicVolume: vol });
    if (this.musicGain) {
      this.musicGain.gain.value = vol;
    }
  }

  setMusicTempo(bpm: number): void {
    this.musicTempo = Math.max(60, Math.min(140, bpm));
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    gain = 0.2,
    freqEnd?: number,
    delay = 0,
  ): void {
    try {
      const ctx = this.ensureCtx();
      if (!this.sfxGain) return;

      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(this.sfxGain);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (freqEnd !== undefined) {
        osc.frequency.linearRampToValueAtTime(freqEnd, now + duration);
      }
      gainNode.gain.setValueAtTime(gain, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch {
      // Silently ignore audio errors (e.g. context not yet allowed)
    }
  }

  // Schedule music notes for the next few seconds
  private scheduleMusicNotes(): void {
    if (!this.musicPlaying || !this.ctx || !this.musicGain) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const scheduleAhead = 2; // Schedule 2 seconds ahead

    // If we've already scheduled past this point, wait
    if (this.musicScheduledUntil > now + scheduleAhead) return;

    const beatDuration = 60 / this.musicTempo;
    let scheduleTime = Math.max(this.musicScheduledUntil, now);

    // Calculate total loop duration
    let melodyDuration = 0;
    for (const note of MELODY_NOTES) {
      melodyDuration += note.dur * beatDuration;
    }

    // Schedule until we're scheduleAhead seconds in the future
    while (scheduleTime < now + scheduleAhead + 1) {
      // Calculate position within the loop
      const loopTime = (scheduleTime - this.musicStartTime) % melodyDuration;
      let noteTime = 0;

      // Find and schedule melody notes
      for (const note of MELODY_NOTES) {
        const noteDuration = note.dur * beatDuration;
        if (noteTime >= loopTime && noteTime < loopTime + scheduleAhead) {
          const delay = scheduleTime - now + (noteTime - loopTime);
          if (note.freq > 0 && delay >= 0) {
            this.scheduleMusicNote(note.freq, noteDuration * 0.85, 'square', 0.08, delay);
          }
        }
        noteTime += noteDuration;
      }

      // Schedule bass notes
      let bassDuration = 0;
      for (const note of BASS_NOTES) {
        bassDuration += note.dur * beatDuration;
      }
      const bassLoopTime = (scheduleTime - this.musicStartTime) % bassDuration;
      let bassNoteTime = 0;

      for (const note of BASS_NOTES) {
        const noteDuration = note.dur * beatDuration;
        if (bassNoteTime >= bassLoopTime && bassNoteTime < bassLoopTime + scheduleAhead) {
          const delay = scheduleTime - now + (bassNoteTime - bassLoopTime);
          if (note.freq > 0 && delay >= 0) {
            this.scheduleMusicNote(note.freq, noteDuration * 0.8, 'triangle', 0.08, delay);
          }
        }
        bassNoteTime += noteDuration;
      }

      scheduleTime += 0.5; // Move forward in 0.5s increments
    }

    this.musicScheduledUntil = scheduleTime;
  }

  private scheduleMusicNote(
    freq: number,
    duration: number,
    type: OscillatorType,
    gain: number,
    delay: number,
  ): void {
    try {
      const ctx = this.ctx;
      if (!ctx || !this.musicGain) return;

      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(this.musicGain);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gainNode.gain.setValueAtTime(gain, now);
      gainNode.gain.setValueAtTime(gain, now + duration * 0.7);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch {
      // Silently ignore audio errors
    }
  }

  startMusic(): void {
    if (this.musicPlaying) return;

    this.ensureCtx();
    if (!this.ctx) return;

    this.musicPlaying = true;
    this.musicStartTime = this.ctx.currentTime;
    this.musicScheduledUntil = this.ctx.currentTime;

    // Schedule notes immediately and set up recurring scheduler
    this.scheduleMusicNotes();
    this.musicScheduleTimer = window.setInterval(() => {
      this.scheduleMusicNotes();
    }, 200);
  }

  stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicScheduleTimer !== null) {
      clearInterval(this.musicScheduleTimer);
      this.musicScheduleTimer = null;
    }
  }

  move(): void {
    this.tone(180, 0.04, 'square', 0.12);
  }

  rotate(): void {
    this.tone(320, 0.05, 'square', 0.12);
  }

  lock(): void {
    this.tone(100, 0.12, 'square', 0.22);
    this.tone(60, 0.14, 'sawtooth', 0.15);
  }

  hold(): void {
    this.tone(440, 0.04, 'square', 0.12);
    this.tone(330, 0.06, 'square', 0.10, undefined, 0.03);
  }

  hardDrop(): void {
    this.tone(140, 0.09, 'square', 0.28, 50);
  }

  lineClear(count: number): void {
    if (count === 4) {
      // Tetris! — ascending fanfare
      const notes = [523, 659, 784, 1047, 1319];
      notes.forEach((f, i) => this.tone(f, 0.16, 'square', 0.28, undefined, i * 0.075));
    } else {
      // 1–3 lines — shorter ascending run
      const notes = [262, 330, 392];
      for (let i = 0; i < count; i++) {
        this.tone(notes[i], 0.13, 'square', 0.22, undefined, i * 0.065);
      }
    }
  }

  levelUp(): void {
    const notes = [392, 523, 659, 784];
    notes.forEach((f, i) => this.tone(f, 0.11, 'square', 0.22, undefined, i * 0.055));
  }

  gameOver(): void {
    const notes = [440, 370, 311, 277, 220];
    notes.forEach((f, i) => this.tone(f, 0.18, 'sawtooth', 0.28, undefined, i * 0.13));
  }
}
