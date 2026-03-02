import { Game } from './game';
import { Renderer } from './renderer';
import { InputHandler } from './input';
import { TouchHandler } from './touch';
import { HUD } from './hud';
import { ScoreHistory } from './scores';
import { SoundEngine } from './sound';
import { settingsManager } from './settings';

const app = document.getElementById('app')!;
const game = new Game();
const renderer = new Renderer(app);
const scores = new ScoreHistory();
const hud = new HUD(renderer, scores);
const sound = new SoundEngine();

// ── Settings UI ──
const settingsBtn = document.getElementById('settings-btn')!;
const settingsPanel = document.getElementById('settings-panel')!;
const settingsBackdrop = document.getElementById('settings-backdrop')!;
const settingsClose = document.getElementById('settings-close')!;

const setMusic = document.getElementById('set-music') as HTMLInputElement;
const setMusicVal = document.getElementById('set-music-val')!;
const setSfx = document.getElementById('set-sfx') as HTMLInputElement;
const setSfxVal = document.getElementById('set-sfx-val')!;
const setDasDelay = document.getElementById('set-das-delay') as HTMLInputElement;
const setDasDelayVal = document.getElementById('set-das-delay-val')!;
const setDasRate = document.getElementById('set-das-rate') as HTMLInputElement;
const setDasRateVal = document.getElementById('set-das-rate-val')!;
const setShake = document.getElementById('set-shake') as HTMLInputElement;
const setBloom = document.getElementById('set-bloom') as HTMLInputElement;
const setTheme = document.getElementById('set-theme') as HTMLSelectElement;

// Initialize settings UI from stored values
function initSettingsUI(): void {
  const s = settingsManager.settings;
  setMusic.value = String(Math.round(s.musicVolume * 100));
  setMusicVal.textContent = `${Math.round(s.musicVolume * 100)}%`;
  setSfx.value = String(Math.round(s.sfxVolume * 100));
  setSfxVal.textContent = `${Math.round(s.sfxVolume * 100)}%`;
  setDasDelay.value = String(s.dasDelay);
  setDasDelayVal.textContent = `${s.dasDelay}ms`;
  setDasRate.value = String(s.dasRate);
  setDasRateVal.textContent = `${s.dasRate}ms`;
  setShake.checked = s.screenShake;
  setBloom.checked = s.bloom;
  setTheme.value = s.theme;
}

initSettingsUI();

function openSettings(): void {
  settingsPanel.classList.remove('hidden');
  settingsBackdrop.classList.remove('hidden');
  if (game.state === 'playing') {
    game.togglePause();
  }
}

function closeSettings(): void {
  settingsPanel.classList.add('hidden');
  settingsBackdrop.classList.add('hidden');
}

settingsBtn.addEventListener('click', openSettings);
settingsClose.addEventListener('click', closeSettings);
settingsBackdrop.addEventListener('click', closeSettings);

// Handle Escape key to close settings
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !settingsPanel.classList.contains('hidden')) {
    closeSettings();
    e.preventDefault();
  }
});

// Settings change handlers
setMusic.addEventListener('input', () => {
  const v = parseInt(setMusic.value, 10);
  setMusicVal.textContent = `${v}%`;
  sound.setMusicVolume(v / 100);
});

setSfx.addEventListener('input', () => {
  const v = parseInt(setSfx.value, 10);
  setSfxVal.textContent = `${v}%`;
  sound.setSfxVolume(v / 100);
});

setDasDelay.addEventListener('input', () => {
  const v = parseInt(setDasDelay.value, 10);
  setDasDelayVal.textContent = `${v}ms`;
  settingsManager.update({ dasDelay: v });
});

setDasRate.addEventListener('input', () => {
  const v = parseInt(setDasRate.value, 10);
  setDasRateVal.textContent = `${v}ms`;
  settingsManager.update({ dasRate: v });
});

setShake.addEventListener('change', () => {
  renderer.setScreenShakeEnabled(setShake.checked);
});

setBloom.addEventListener('change', () => {
  renderer.setBloomEnabled(setBloom.checked);
});

setTheme.addEventListener('change', () => {
  renderer.setTheme(setTheme.value as 'neon' | 'gameboy-dark' | 'gameboy-light');
});

// ── Game Setup ──
const startGame = () => {
  sound.resume(); // Unlock AudioContext on first user gesture
  sound.startMusic(); // Start background music
  game.start();
};

const input = new InputHandler(game, startGame);
const touch = new TouchHandler(game, startGame);

// Sound + visual callbacks
game.onMove = () => sound.move();
game.onRotate = () => sound.rotate();
game.onLock = () => sound.lock();
game.onHold = () => sound.hold();
game.onHardDrop = () => sound.hardDrop();

game.onLineClear = (count, score) => {
  sound.lineClear(count);
  hud.showClearPopup(count, score);
  // Shake intensity scales with lines cleared (world units; viewH ≈ 26 units = ~1080px)
  const shakeIntensity = [0, 0.30, 0.55, 0.85, 1.4][count] ?? 0.30;
  renderer.triggerShake(shakeIntensity);
};

game.onLevelUp = () => {
  sound.levelUp();
  hud.showLevelUpPopup();
  // Speed up music tempo as level increases (base 70 BPM + 2 per level)
  sound.setMusicTempo(70 + (game.level - 1) * 2);
};

// Save score when game ends
game.onGameOver = () => {
  sound.gameOver();
  sound.stopMusic(); // Stop background music
  scores.save({
    score: game.score,
    level: game.level,
    lines: game.lines,
    date: Date.now(),
  });
};

let lastTime = 0;

function gameLoop(time: number): void {
  const dt = lastTime ? time - lastTime : 0;
  lastTime = time;

  input.update(dt);
  touch.update(dt);
  game.update(dt);
  hud.update(game);
  renderer.render(game);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
