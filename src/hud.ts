import { Game } from './game';
import { Renderer } from './renderer';
import { ScoreHistory } from './scores';

export class HUD {
  private scoreEl: HTMLElement;
  private levelEl: HTMLElement;
  private linesEl: HTMLElement;
  private overlay: HTMLElement;
  private nextCanvas: HTMLCanvasElement;
  private holdCanvas: HTMLCanvasElement;
  private popupsEl: HTMLElement;
  private renderer: Renderer;
  private scores: ScoreHistory;

  private lastNextPiece = -1;
  private lastHoldPiece: number = -1; // -1 = never rendered
  private lastCanHold = true;
  private lastState = '';

  constructor(renderer: Renderer, scores: ScoreHistory) {
    this.scoreEl = document.getElementById('score')!;
    this.levelEl = document.getElementById('level')!;
    this.linesEl = document.getElementById('lines')!;
    this.overlay = document.getElementById('overlay')!;
    this.nextCanvas = document.getElementById('next-preview') as HTMLCanvasElement;
    this.holdCanvas = document.getElementById('hold-preview') as HTMLCanvasElement;
    this.popupsEl = document.getElementById('popups')!;
    this.renderer = renderer;
    this.scores = scores;
  }

  update(game: Game): void {
    this.scoreEl.textContent = game.score.toLocaleString();
    this.levelEl.textContent = String(game.level);
    this.linesEl.textContent = String(game.lines);

    // Next piece preview
    if (game.nextPiece !== this.lastNextPiece) {
      this.lastNextPiece = game.nextPiece;
      this.renderer.renderNextPreview(game.nextPiece, this.nextCanvas);
    }

    // Hold piece preview — re-render when piece changes
    if ((game.holdPiece as number | null) !== this.lastHoldPiece) {
      this.lastHoldPiece = game.holdPiece as number | null as number;
      if (game.holdPiece === null) {
        const ctx = this.holdCanvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        this.holdCanvas.width = 80; // reset canvas (clears it)
      } else {
        this.renderer.renderNextPreview(game.holdPiece, this.holdCanvas);
      }
    }

    // Dim hold canvas when hold is locked for this piece
    if (game.canHold !== this.lastCanHold) {
      this.lastCanHold = game.canHold;
      this.holdCanvas.style.opacity = game.canHold ? '1' : '0.3';
    }

    // Overlay — only update DOM when state changes
    if (game.state !== this.lastState) {
      this.lastState = game.state;
      // Reset hold preview tracking so it re-renders on next game start
      if (game.state === 'idle' || game.state === 'gameover') {
        this.lastHoldPiece = -1;
        this.lastNextPiece = -1;
        this.lastCanHold = true;
        this.holdCanvas.style.opacity = '1';
      }

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

  showClearPopup(count: number, score: number): void {
    const labels  = ['', '', 'DOUBLE!', 'TRIPLE!', 'TETRIS!'];
    const colors  = ['', '#ffffff', '#00ffff', '#ff00ff', '#ffff00'];
    const sizes   = ['', '1.1rem',  '1.3rem',  '1.5rem',  '2.2rem'];
    const shadows = ['', '8px',     '12px',    '16px',    '24px'];

    const label  = count >= 2 ? labels[count]  ?? 'CLEAR!' : '';
    const color  = colors[count]  ?? '#fff';
    const size   = sizes[count]   ?? '1.1rem';
    const blur   = shadows[count] ?? '8px';

    const text = label
      ? `${label}  +${score.toLocaleString()}`
      : `+${score.toLocaleString()}`;

    this.spawnPopup(text, color, size, blur);
  }

  showLevelUpPopup(): void {
    this.spawnPopup('LEVEL UP!', '#ff8800', '1.6rem', '18px');
  }

  private spawnPopup(text: string, color: string, fontSize: string, glowBlur: string): void {
    const el = document.createElement('div');
    el.className = 'popup';
    el.style.color = color;
    el.style.fontSize = fontSize;
    el.style.textShadow = `0 0 ${glowBlur} ${color}, 0 0 calc(${glowBlur} * 2) ${color}`;
    el.textContent = text;
    this.popupsEl.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
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
