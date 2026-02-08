import { Game } from './game';
import { DAS_DELAY, DAS_RATE } from './constants';

type Direction = 'left' | 'right';

export class TouchHandler {
  private game: Game;
  private onStart: () => void;

  private heldDir: Direction | null = null;
  private dasTimer = 0;
  private dasActive = false;
  private holdInterval: ReturnType<typeof setInterval> | null = null;

  // Swipe tracking
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private isSwiping = false;

  constructor(game: Game, onStart: () => void) {
    this.game = game;
    this.onStart = onStart;
    this.setupButtons();
    this.setupSwipeGestures();
    this.setupOverlayTap();
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

  private setupButtons(): void {
    this.bindButton('btn-left', () => {
      this.game.moveLeft();
      this.startHold('left');
    }, () => this.stopHold());

    this.bindButton('btn-right', () => {
      this.game.moveRight();
      this.startHold('right');
    }, () => this.stopHold());

    this.bindButton('btn-rotate-cw', () => {
      if (this.game.state === 'idle' || this.game.state === 'gameover') {
        this.onStart();
      } else {
        this.game.rotateCW();
      }
    });

    this.bindButton('btn-rotate-ccw', () => {
      this.game.rotateCCW();
    });

    this.bindButton('btn-soft-drop', () => {
      this.game.softDrop = true;
      this.game.dropTimer = Infinity;
    }, () => {
      this.game.softDrop = false;
    });

    this.bindButton('btn-hard-drop', () => {
      if (this.game.state === 'idle' || this.game.state === 'gameover') {
        this.onStart();
      } else {
        this.game.hardDrop();
      }
    });

    // Pause button
    this.bindButton('btn-pause', () => {
      if (this.game.state === 'playing' || this.game.state === 'paused') {
        this.game.togglePause();
      }
    });
  }

  private bindButton(
    id: string,
    onDown: () => void,
    onUp?: () => void,
  ): void {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      onDown();
    });

    if (onUp) {
      el.addEventListener('pointerup', (e) => {
        e.preventDefault();
        onUp();
      });
      el.addEventListener('pointerleave', (e) => {
        e.preventDefault();
        onUp();
      });
      el.addEventListener('pointercancel', (e) => {
        e.preventDefault();
        onUp();
      });
    }
  }

  private startHold(dir: Direction): void {
    this.heldDir = dir;
    this.dasTimer = 0;
    this.dasActive = false;
  }

  private stopHold(): void {
    this.heldDir = null;
    this.dasTimer = 0;
    this.dasActive = false;
  }

  private setupOverlayTap(): void {
    const overlay = document.getElementById('overlay');
    if (!overlay) return;

    overlay.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.game.state === 'idle' || this.game.state === 'gameover') {
        this.onStart();
      } else if (this.game.state === 'paused') {
        this.game.togglePause();
      }
    });
  }

  private setupSwipeGestures(): void {
    const canvas = document.querySelector('#app canvas');
    if (!canvas) return;

    canvas.addEventListener('touchstart', (e) => {
      const ev = e as TouchEvent;
      if (ev.touches.length !== 1) return;
      const touch = ev.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = Date.now();
      this.isSwiping = false;
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      const ev = e as TouchEvent;
      if (ev.touches.length !== 1) return;
      const touch = ev.touches[0];
      const dx = touch.clientX - this.touchStartX;
      const dy = touch.clientY - this.touchStartY;

      if (!this.isSwiping && (Math.abs(dx) > 30 || Math.abs(dy) > 30)) {
        this.isSwiping = true;

        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe
          if (dx > 0) this.game.moveRight();
          else this.game.moveLeft();
        } else if (dy > 0) {
          // Swipe down
          this.game.hardDrop();
        }

        // Reset start for continuous swiping
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
      }
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
      const elapsed = Date.now() - this.touchStartTime;

      // Quick tap = rotate
      if (!this.isSwiping && elapsed < 200) {
        if (this.game.state === 'idle' || this.game.state === 'gameover') {
          this.onStart();
        } else if (this.game.state === 'playing') {
          this.game.rotateCW();
        }
      }
    }, { passive: true });
  }

  dispose(): void {
    if (this.holdInterval) {
      clearInterval(this.holdInterval);
    }
  }
}
