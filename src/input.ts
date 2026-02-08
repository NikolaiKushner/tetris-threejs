import { Game } from './game';
import { DAS_DELAY, DAS_RATE } from './constants';

type Direction = 'left' | 'right';

export class InputHandler {
  private game: Game;
  private onStart: () => void;

  private heldDir: Direction | null = null;
  private dasTimer = 0;
  private dasActive = false;

  constructor(game: Game, onStart: () => void) {
    this.game = game;
    this.onStart = onStart;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  update(dt: number): void {
    if (!this.heldDir || this.game.state !== 'playing') return;

    this.dasTimer += dt;

    if (!this.dasActive && this.dasTimer >= DAS_DELAY) {
      this.dasActive = true;
      this.dasTimer = 0;
      this.doMove(this.heldDir);
    } else if (this.dasActive && this.dasTimer >= DAS_RATE) {
      this.dasTimer = 0;
      this.doMove(this.heldDir);
    }
  }

  private doMove(dir: Direction): void {
    if (dir === 'left') this.game.moveLeft();
    else this.game.moveRight();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat) return;

    // Start game
    if ((this.game.state === 'idle' || this.game.state === 'gameover') && e.key === 'Enter') {
      this.onStart();
      e.preventDefault();
      return;
    }

    // Pause toggle works in both playing and paused states
    if (e.key === 'p' || e.key === 'P') {
      if (this.game.state === 'playing' || this.game.state === 'paused') {
        this.game.togglePause();
        e.preventDefault();
      }
      return;
    }

    if (this.game.state !== 'playing') return;

    switch (e.key) {
      case 'ArrowLeft':
        this.game.moveLeft();
        this.heldDir = 'left';
        this.dasTimer = 0;
        this.dasActive = false;
        e.preventDefault();
        break;
      case 'ArrowRight':
        this.game.moveRight();
        this.heldDir = 'right';
        this.dasTimer = 0;
        this.dasActive = false;
        e.preventDefault();
        break;
      case 'ArrowDown':
        this.game.softDrop = true;
        this.game.dropTimer = Infinity; // Trigger immediate drop on next update
        e.preventDefault();
        break;
      case 'ArrowUp':
      case 'z':
      case 'Z':
        this.game.rotateCW();
        e.preventDefault();
        break;
      case 'x':
      case 'X':
        this.game.rotateCCW();
        e.preventDefault();
        break;
      case ' ':
        this.game.hardDrop();
        e.preventDefault();
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    switch (e.key) {
      case 'ArrowLeft':
        if (this.heldDir === 'left') this.heldDir = null;
        break;
      case 'ArrowRight':
        if (this.heldDir === 'right') this.heldDir = null;
        break;
      case 'ArrowDown':
        this.game.softDrop = false;
        break;
    }
  };

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
