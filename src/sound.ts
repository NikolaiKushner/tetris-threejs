export class SoundEngine {
  private ctx: AudioContext | null = null;

  private ensureCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  resume(): void {
    const ctx = this.ensureCtx();
    if (ctx.state === 'suspended') ctx.resume();
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
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
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
