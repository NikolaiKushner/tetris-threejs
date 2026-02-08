import { Game } from './game';
import { Renderer } from './renderer';
import { InputHandler } from './input';
import { TouchHandler } from './touch';
import { HUD } from './hud';
import { ScoreHistory } from './scores';

const app = document.getElementById('app')!;
const game = new Game();
const renderer = new Renderer(app);
const scores = new ScoreHistory();
const hud = new HUD(renderer, scores);

const startGame = () => {
  game.start();
};

const input = new InputHandler(game, startGame);
const touch = new TouchHandler(game, startGame);

// Save score when game ends
game.onGameOver = () => {
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
