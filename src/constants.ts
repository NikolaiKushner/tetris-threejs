export const COLS = 10;
export const ROWS = 20;
export const BLOCK_SIZE = 1; // 1 unit in Three.js world space

// Theme definitions
export type Theme = 'neon' | 'gameboy-dark' | 'gameboy-light';

// Neon colors per piece type (index 1-7) - vibrant like modern Tetris
export const PIECE_COLORS = [
  0x000000,   // 0: empty (unused)
  0x00e8ff,   // 1: I - bright cyan
  0xffee00,   // 2: O - bright yellow
  0xaa00ff,   // 3: T - deep purple
  0x44ff44,   // 4: S - lime green
  0xff2222,   // 5: Z - bright red
  0x2266ff,   // 6: J - royal blue
  0xff9900,   // 7: L - bright orange
];

// Gameboy Dark theme - muted retro colors on dark background
export const GAMEBOY_DARK_COLORS = [
  0x1a1a2e,   // 0: empty (dark blue-gray)
  0x4ecdc4,   // 1: I - teal
  0xffe66d,   // 2: O - muted yellow
  0x9b59b6,   // 3: T - muted purple
  0x2ecc71,   // 4: S - muted green
  0xe74c3c,   // 5: Z - muted red
  0x3498db,   // 6: J - muted blue
  0xe67e22,   // 7: L - muted orange
];

// Gameboy Light theme - pastel colors on light background
export const GAMEBOY_LIGHT_COLORS = [
  0xe8e8e8,   // 0: empty (light gray)
  0x00b4d8,   // 1: I - soft cyan
  0xffd60a,   // 2: O - golden yellow
  0x7b2cbf,   // 3: T - violet
  0x06d6a0,   // 4: S - mint green
  0xef476f,   // 5: Z - coral red
  0x118ab2,   // 6: J - ocean blue
  0xf77f00,   // 7: L - tangerine
];

// Theme backgrounds
export const THEME_BACKGROUNDS = {
  'neon': 0x0a0a1a,
  'gameboy-dark': 0x1a1a2e,
  'gameboy-light': 0xe8e8e8,
};

// Grid line colors per theme
export const THEME_GRID_COLORS = {
  'neon': 0x2a2a5a,
  'gameboy-dark': 0x2a2a4a,
  'gameboy-light': 0xcccccc,
};

// Border colors per theme
export const THEME_BORDER_COLORS = {
  'neon': 0x4444aa,
  'gameboy-dark': 0x4a4a6a,
  'gameboy-light': 0x888888,
};

// Get piece colors for a theme
export function getColorsForTheme(theme: Theme): number[] {
  switch (theme) {
    case 'gameboy-dark': return GAMEBOY_DARK_COLORS;
    case 'gameboy-light': return GAMEBOY_LIGHT_COLORS;
    default: return PIECE_COLORS;
  }
}

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
