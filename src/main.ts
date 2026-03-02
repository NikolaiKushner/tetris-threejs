import { Game } from './game';
import { Renderer } from './renderer';
import { InputHandler } from './input';
import { TouchHandler } from './touch';
import { HUD } from './hud';
import { ScoreHistory } from './scores';
import { SoundEngine } from './sound';

const app = document.getElementById('app')!;
const game = new Game();
const renderer = new Renderer(app);
const scores = new ScoreHistory();
const hud = new HUD(renderer, scores);
const sound = new SoundEngine();

const startGame = () => {
  sound.resume(); // Unlock AudioContext on first user gesture
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
};

// Save score when game ends
game.onGameOver = () => {
  sound.gameOver();
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
