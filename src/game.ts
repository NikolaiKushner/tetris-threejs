import { LINE_SCORES, LINES_PER_LEVEL, LOCK_DELAY, SOFT_DROP_FACTOR, SPEED_TABLE } from './constants';
import { createGrid, isValidPosition, lockPiece, clearLines, getGhostY } from './board';
import type { Grid } from './board';
import { getKicks, getSpawnX, getSpawnY } from './tetromino';
import type { PieceType } from './tetromino';

export type GameState = 'idle' | 'playing' | 'paused' | 'gameover';

export interface ActivePiece {
  type: PieceType;
  rotation: number;
  x: number;
  y: number;
}

export class Game {
  grid: Grid = createGrid();
  state: GameState = 'idle';
  piece: ActivePiece | null = null;
  nextPiece: PieceType = 1;
  score = 0;
  level = 1;
  lines = 0;
  dropTimer = 0;
  lockTimer = 0;
  isLocking = false;
  softDrop = false;
  startTime = 0;
  onGameOver: (() => void) | null = null;

  private bag: PieceType[] = [];

  constructor() {
    this.nextPiece = this.drawFromBag();
  }

  start(): void {
    this.grid = createGrid();
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.isLocking = false;
    this.bag = [];
    this.nextPiece = this.drawFromBag();
    this.startTime = Date.now();
    this.state = 'playing';
    this.spawnPiece();
  }

  togglePause(): void {
    if (this.state === 'playing') this.state = 'paused';
    else if (this.state === 'paused') this.state = 'playing';
  }

  update(dt: number): void {
    if (this.state !== 'playing' || !this.piece) return;

    const dropInterval = this.getDropInterval();

    this.dropTimer += dt;

    if (this.dropTimer >= dropInterval) {
      this.dropTimer = 0;
      if (!this.moveDown()) {
        // Piece can't move down
        if (!this.isLocking) {
          this.isLocking = true;
          this.lockTimer = 0;
        }
      }
    }

    // Lock delay
    if (this.isLocking) {
      this.lockTimer += dt;
      // If piece can move down again (e.g., line cleared beneath), cancel lock
      if (this.piece && isValidPosition(this.grid, this.piece.type, this.piece.rotation, this.piece.x, this.piece.y + 1)) {
        this.isLocking = false;
        this.lockTimer = 0;
      } else if (this.lockTimer >= LOCK_DELAY) {
        this.lock();
      }
    }
  }

  private getDropInterval(): number {
    const base = SPEED_TABLE[Math.min(this.level - 1, SPEED_TABLE.length - 1)];
    return this.softDrop ? base / SOFT_DROP_FACTOR : base;
  }

  moveLeft(): boolean {
    return this.tryMove(-1, 0);
  }

  moveRight(): boolean {
    return this.tryMove(1, 0);
  }

  moveDown(): boolean {
    const moved = this.tryMove(0, 1);
    if (!moved && !this.isLocking) {
      this.isLocking = true;
      this.lockTimer = 0;
    }
    return moved;
  }

  hardDrop(): void {
    if (!this.piece || this.state !== 'playing') return;
    const ghostY = getGhostY(this.grid, this.piece.type, this.piece.rotation, this.piece.x, this.piece.y);
    const distance = ghostY - this.piece.y;
    this.score += distance * 2;
    this.piece.y = ghostY;
    this.lock();
  }

  rotateCW(): boolean {
    return this.tryRotate(1);
  }

  rotateCCW(): boolean {
    return this.tryRotate(-1);
  }

  getGhostY(): number {
    if (!this.piece) return 0;
    return getGhostY(this.grid, this.piece.type, this.piece.rotation, this.piece.x, this.piece.y);
  }

  private tryMove(dx: number, dy: number): boolean {
    if (!this.piece) return false;
    const newX = this.piece.x + dx;
    const newY = this.piece.y + dy;
    if (isValidPosition(this.grid, this.piece.type, this.piece.rotation, newX, newY)) {
      this.piece.x = newX;
      this.piece.y = newY;
      // Reset lock timer on successful move
      if (this.isLocking && dy === 0) {
        this.lockTimer = 0;
      }
      return true;
    }
    return false;
  }

  private tryRotate(dir: number): boolean {
    if (!this.piece) return false;
    const fromRot = this.piece.rotation;
    const toRot = ((fromRot + dir) % 4 + 4) % 4;
    const kicks = getKicks(this.piece.type, fromRot, toRot);

    for (const [kx, ky] of kicks) {
      const newX = this.piece.x + kx;
      const newY = this.piece.y - ky; // SRS kick y is inverted relative to our grid
      if (isValidPosition(this.grid, this.piece.type, toRot, newX, newY)) {
        this.piece.rotation = toRot;
        this.piece.x = newX;
        this.piece.y = newY;
        if (this.isLocking) this.lockTimer = 0;
        return true;
      }
    }
    return false;
  }

  private lock(): void {
    if (!this.piece) return;
    lockPiece(this.grid, this.piece.type, this.piece.rotation, this.piece.x, this.piece.y);
    this.isLocking = false;
    this.lockTimer = 0;

    const cleared = clearLines(this.grid);
    if (cleared > 0) {
      this.lines += cleared;
      this.score += LINE_SCORES[cleared] * this.level;
      this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
    }

    this.spawnPiece();
  }

  private spawnPiece(): void {
    const type = this.nextPiece;
    this.nextPiece = this.drawFromBag();
    const x = getSpawnX(type);
    const y = getSpawnY(type);

    if (!isValidPosition(this.grid, type, 0, x, y)) {
      this.state = 'gameover';
      this.piece = null;
      this.onGameOver?.();
      return;
    }

    this.piece = { type, rotation: 0, x, y };
    this.dropTimer = 0;
  }

  private drawFromBag(): PieceType {
    if (this.bag.length === 0) {
      this.bag = [1, 2, 3, 4, 5, 6, 7] as PieceType[];
      // Fisher-Yates shuffle
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }
}
