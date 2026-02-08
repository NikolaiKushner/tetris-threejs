import { COLS, ROWS } from './constants';
import { getShape } from './tetromino';
import type { PieceType } from './tetromino';

export type Grid = number[][];

export function createGrid(): Grid {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

export function isValidPosition(
  grid: Grid,
  pieceType: PieceType,
  rotation: number,
  x: number,
  y: number,
): boolean {
  const shape = getShape(pieceType, rotation);
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (!shape[row][col]) continue;
      const boardX = x + col;
      const boardY = y + row;
      if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return false;
      if (boardY < 0) continue; // Allow pieces above the board
      if (grid[boardY][boardX] !== 0) return false;
    }
  }
  return true;
}

export function lockPiece(
  grid: Grid,
  pieceType: PieceType,
  rotation: number,
  x: number,
  y: number,
): void {
  const shape = getShape(pieceType, rotation);
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (!shape[row][col]) continue;
      const boardX = x + col;
      const boardY = y + row;
      if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
        grid[boardY][boardX] = pieceType;
      }
    }
  }
}

export function clearLines(grid: Grid): number {
  let linesCleared = 0;
  for (let row = ROWS - 1; row >= 0; row--) {
    if (grid[row].every(cell => cell !== 0)) {
      grid.splice(row, 1);
      grid.unshift(new Array(COLS).fill(0));
      linesCleared++;
      row++; // Re-check this row index since rows shifted down
    }
  }
  return linesCleared;
}

export function getGhostY(
  grid: Grid,
  pieceType: PieceType,
  rotation: number,
  x: number,
  y: number,
): number {
  let ghostY = y;
  while (isValidPosition(grid, pieceType, rotation, x, ghostY + 1)) {
    ghostY++;
  }
  return ghostY;
}
