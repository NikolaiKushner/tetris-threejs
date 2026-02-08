export const COLS = 10;
export const ROWS = 20;
export const BLOCK_SIZE = 1; // 1 unit in Three.js world space

// Neon colors per piece type (index 1-7)
export const PIECE_COLORS = [
  0x000000,   // 0: empty (unused)
  0x00ffff,   // 1: I - cyan
  0xffff00,   // 2: O - yellow
  0xff00ff,   // 3: T - purple
  0x00ff88,   // 4: S - green
  0xff0044,   // 5: Z - red
  0x4444ff,   // 6: J - blue
  0xff8800,   // 7: L - orange
];

// Scoring (NES-style, multiplied by level)
export const LINE_SCORES = [0, 100, 300, 500, 800];

// Lines needed to advance a level
export const LINES_PER_LEVEL = 10;

// Drop interval in ms per level (index = level - 1)
export const SPEED_TABLE = [
  800, 720, 630, 550, 470, 380, 300, 220, 150, 100,
  80, 70, 60, 50, 40, 30, 20, 15, 10, 8,
];

// Input timing
export const DAS_DELAY = 170;  // ms before auto-repeat starts
export const DAS_RATE = 50;    // ms between auto-repeat moves

// Lock delay
export const LOCK_DELAY = 500; // ms after landing before locking

export const SOFT_DROP_FACTOR = 20; // speed multiplier for soft drop
