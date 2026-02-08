import { Game } from './game';
import { Renderer } from './renderer';
import { ScoreHistory } from './scores';

export class HUD {
  private scoreEl: HTMLElement;
  private levelEl: HTMLElement;
  private linesEl: HTMLElement;
  private overlay: HTMLElement;
  private nextCanvas: HTMLCanvasElement;
  private renderer: Renderer;
  private scores: ScoreHistory;

  private lastNextPiece = -1;
  private lastState = '';

  constructor(renderer: Renderer, scores: ScoreHistory) {
    this.scoreEl = document.getElementById('score')!;
    this.levelEl = document.getElementById('level')!;
    this.linesEl = document.getElementById('lines')!;
    this.overlay = document.getElementById('overlay')!;
    this.nextCanvas = document.getElementById('next-preview') as HTMLCanvasElement;
    this.renderer = renderer;
    this.scores = scores;
  }

  update(game: Game): void {
    this.scoreEl.textContent = game.score.toLocaleString();
    this.levelEl.textContent = String(game.level);
    this.linesEl.textContent = String(game.lines);

    // Update next piece preview only when it changes
    if (game.nextPiece !== this.lastNextPiece) {
      this.lastNextPiece = game.nextPiece;
      this.renderer.renderNextPreview(game.nextPiece, this.nextCanvas);
    }

    // Overlay management — only update DOM when state changes
    if (game.state !== this.lastState) {
      this.lastState = game.state;
      const best = this.scores.getBest();
      const bestHtml = best
        ? `<div class="best-score">Best: ${best.score.toLocaleString()}</div>`
        : '';
      const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
      const startHint = isTouchDevice ? 'Tap to play' : 'Press ENTER to play';
      const restartHint = isTouchDevice ? 'Tap to restart' : 'Press ENTER to restart';

      switch (game.state) {
        case 'idle':
          this.overlay.classList.remove('hidden');
          this.overlay.innerHTML = `
            <h1>MR. TET</h1>
            ${bestHtml}
            <div class="subtitle">${startHint}</div>
          `;
          break;
        case 'gameover':
          this.overlay.classList.remove('hidden');
          this.overlay.innerHTML = `
            <h1>GAME OVER</h1>
            <div class="score-display">Score: ${game.score.toLocaleString()}</div>
            ${bestHtml}
            ${this.renderHistory()}
            <div class="subtitle">${restartHint}</div>
          `;
          break;
        case 'paused':
          this.overlay.classList.remove('hidden');
          this.overlay.innerHTML = `
            <h1>PAUSED</h1>
            <div class="subtitle">Press P to resume</div>
          `;
          break;
        case 'playing':
          this.overlay.classList.add('hidden');
          break;
      }
    }
  }

  private renderHistory(): string {
    const records = this.scores.load().slice(0, 5);
    if (records.length === 0) return '';

    const rows = records.map((r, i) => {
      const date = new Date(r.date);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      return `<div class="row"><span class="rank">${i + 1}.</span> ${r.score.toLocaleString()} &nbsp; L${r.level} &nbsp; ${dateStr}</div>`;
    }).join('');

    return `
      <div class="history-table">
        <div class="header">Top Scores</div>
        ${rows}
      </div>
    `;
  }
}
