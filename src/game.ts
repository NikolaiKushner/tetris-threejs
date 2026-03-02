import { LINE_SCORES, LINES_PER_LEVEL, LOCK_DELAY, SOFT_DROP_FACTOR, SPEED_TABLE } from './constants';
import { createGrid, isValidPosition, lockPiece, clearLines, findFullRows, getGhostY } from './board';
import type { Grid } from './board';
import { getKicks, getSpawnX, getSpawnY } from './tetromino';
import type { PieceType } from './tetromino';

export const CLEAR_DURATION = 500; // ms for line-clear animation

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
  holdPiece: PieceType | null = null;
  canHold = true;
  score = 0;
  level = 1;
  lines = 0;
  dropTimer = 0;
  lockTimer = 0;
  isLocking = false;
  softDrop = false;
  startTime = 0;
  clearingRows: number[] = [];
  clearTimer = 0;

  // Sound / event callbacks
  onMove: (() => void) | null = null;
  onRotate: (() => void) | null = null;
  onLock: (() => void) | null = null;
  onHold: (() => void) | null = null;
  onHardDrop: (() => void) | null = null;
  onLineClear: ((count: number, score: number) => void) | null = null;
  onLevelUp: (() => void) | null = null;
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
    this.clearingRows = [];
    this.clearTimer = 0;
    this.holdPiece = null;
    this.canHold = true;
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
    if (this.state !== 'playing') return;

    // Line-clear animation — wait before actually clearing and spawning
    if (this.clearingRows.length > 0) {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) {
        clearLines(this.grid);
        const count = this.clearingRows.length;
        this.lines += count;
        const prevLevel = this.level;
        this.score += LINE_SCORES[count] * this.level;
        this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
        if (this.level > prevLevel) this.onLevelUp?.();
        this.clearingRows = [];
        this.clearTimer = 0;
        this.spawnPiece();
      }
      return;
    }

    if (!this.piece) return;

    const dropInterval = this.getDropInterval();

    this.dropTimer += dt;

    if (this.dropTimer >= dropInterval) {
      this.dropTimer = 0;
      if (!this.moveDown()) {
        if (!this.isLocking) {
          this.isLocking = true;
          this.lockTimer = 0;
        }
      }
    }

    // Lock delay
    if (this.isLocking) {
      this.lockTimer += dt;
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
    const moved = this.tryMove(-1, 0);
    if (moved) this.onMove?.();
    return moved;
  }

  moveRight(): boolean {
    const moved = this.tryMove(1, 0);
    if (moved) this.onMove?.();
    return moved;
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
    this.onHardDrop?.();
    this.lock();
  }

  rotateCW(): boolean {
    const rotated = this.tryRotate(1);
    if (rotated) this.onRotate?.();
    return rotated;
  }

  rotateCCW(): boolean {
    const rotated = this.tryRotate(-1);
    if (rotated) this.onRotate?.();
    return rotated;
  }

  hold(): void {
    if (!this.piece || !this.canHold || this.state !== 'playing') return;

    const currentType = this.piece.type;
    const prevHeld = this.holdPiece;

    this.holdPiece = currentType;
    this.piece = null;
    this.isLocking = false;
    this.lockTimer = 0;
    this.onHold?.();

    if (prevHeld === null) {
      // No piece was held: draw next from bag (spawnPiece resets canHold=true, we override)
      this.spawnPiece();
      this.canHold = false;
    } else {
      this.canHold = false;
      this.spawnFromType(prevHeld);
    }
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
      const newY = this.piece.y - ky;
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
    this.onLock?.();
    this.isLocking = false;
    this.lockTimer = 0;
    this.piece = null;

    const rows = findFullRows(this.grid);
    if (rows.length > 0) {
      this.clearingRows = rows;
      this.clearTimer = CLEAR_DURATION;
      const scoreGained = LINE_SCORES[rows.length] * this.level;
      this.onLineClear?.(rows.length, scoreGained);
    } else {
      this.spawnPiece();
    }
  }

  private spawnPiece(): void {
    this.canHold = true; // Reset hold ability when a new piece comes from the bag
    const type = this.nextPiece;
    this.nextPiece = this.drawFromBag();
    this.spawnFromType(type);
  }

  private spawnFromType(type: PieceType): void {
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
    this.isLocking = false;
    this.lockTimer = 0;
  }

  private drawFromBag(): PieceType {
    if (this.bag.length === 0) {
      this.bag = [1, 2, 3, 4, 5, 6, 7] as PieceType[];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }
}
