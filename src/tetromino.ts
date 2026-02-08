export type PieceType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Each shape is a 2D grid where 1 = filled cell.
// 4 rotation states per piece (0=spawn, 1=CW, 2=180, 3=CCW).

const I_STATES = [
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
  [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
  [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
];

const O_STATES = [
  [[1,1],[1,1]],
  [[1,1],[1,1]],
  [[1,1],[1,1]],
  [[1,1],[1,1]],
];

const T_STATES = [
  [[0,1,0],[1,1,1],[0,0,0]],
  [[0,1,0],[0,1,1],[0,1,0]],
  [[0,0,0],[1,1,1],[0,1,0]],
  [[0,1,0],[1,1,0],[0,1,0]],
];

const S_STATES = [
  [[0,1,1],[1,1,0],[0,0,0]],
  [[0,1,0],[0,1,1],[0,0,1]],
  [[0,0,0],[0,1,1],[1,1,0]],
  [[1,0,0],[1,1,0],[0,1,0]],
];

const Z_STATES = [
  [[1,1,0],[0,1,1],[0,0,0]],
  [[0,0,1],[0,1,1],[0,1,0]],
  [[0,0,0],[1,1,0],[0,1,1]],
  [[0,1,0],[1,1,0],[1,0,0]],
];

const J_STATES = [
  [[1,0,0],[1,1,1],[0,0,0]],
  [[0,1,1],[0,1,0],[0,1,0]],
  [[0,0,0],[1,1,1],[0,0,1]],
  [[0,1,0],[0,1,0],[1,1,0]],
];

const L_STATES = [
  [[0,0,1],[1,1,1],[0,0,0]],
  [[0,1,0],[0,1,0],[0,1,1]],
  [[0,0,0],[1,1,1],[1,0,0]],
  [[1,1,0],[0,1,0],[0,1,0]],
];

export const SHAPES: Record<PieceType, number[][][]> = {
  1: I_STATES,
  2: O_STATES,
  3: T_STATES,
  4: S_STATES,
  5: Z_STATES,
  6: J_STATES,
  7: L_STATES,
};

// SRS wall kick data
// Kicks for J, L, S, T, Z pieces
const KICKS_JLSTZ: Record<string, [number, number][]> = {
  '0>1': [[ 0, 0],[-1, 0],[-1, 1],[ 0,-2],[-1,-2]],
  '1>0': [[ 0, 0],[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]],
  '1>2': [[ 0, 0],[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]],
  '2>1': [[ 0, 0],[-1, 0],[-1, 1],[ 0,-2],[-1,-2]],
  '2>3': [[ 0, 0],[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]],
  '3>2': [[ 0, 0],[-1, 0],[-1,-1],[ 0, 2],[-1, 2]],
  '3>0': [[ 0, 0],[-1, 0],[-1,-1],[ 0, 2],[-1, 2]],
  '0>3': [[ 0, 0],[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]],
};

// Kicks for I piece
const KICKS_I: Record<string, [number, number][]> = {
  '0>1': [[ 0, 0],[-2, 0],[ 1, 0],[-2,-1],[ 1, 2]],
  '1>0': [[ 0, 0],[ 2, 0],[-1, 0],[ 2, 1],[-1,-2]],
  '1>2': [[ 0, 0],[-1, 0],[ 2, 0],[-1, 2],[ 2,-1]],
  '2>1': [[ 0, 0],[ 1, 0],[-2, 0],[ 1,-2],[-2, 1]],
  '2>3': [[ 0, 0],[ 2, 0],[-1, 0],[ 2, 1],[-1,-2]],
  '3>2': [[ 0, 0],[-2, 0],[ 1, 0],[-2,-1],[ 1, 2]],
  '3>0': [[ 0, 0],[ 1, 0],[-2, 0],[ 1,-2],[-2, 1]],
  '0>3': [[ 0, 0],[-1, 0],[ 2, 0],[-1, 2],[ 2,-1]],
};

export function getKicks(pieceType: PieceType, fromRot: number, toRot: number): [number, number][] {
  const key = `${fromRot}>${toRot}`;
  if (pieceType === 1) return KICKS_I[key] || [[0, 0]];
  if (pieceType === 2) return [[0, 0]]; // O piece doesn't kick
  return KICKS_JLSTZ[key] || [[0, 0]];
}

export function getShape(pieceType: PieceType, rotation: number): number[][] {
  return SHAPES[pieceType][rotation];
}

// Spawn positions (column offset so piece is centered)
export function getSpawnX(pieceType: PieceType): number {
  if (pieceType === 1) return 3; // I piece: 4 wide
  if (pieceType === 2) return 4; // O piece: 2 wide
  return 3; // 3-wide pieces
}

export function getSpawnY(_pieceType: PieceType): number {
  return 0; // Top of the board
}
