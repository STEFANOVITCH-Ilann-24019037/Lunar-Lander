/**
 * main.js — Game loop, state machine, and input wiring.
 *
 * This is the entry point loaded by index.html as a module.
 * It owns all mutable game state and orchestrates the other modules.
 */

import { W, H }                                          from './constants.js';
import { bindings, keys, resetKeys, saveBindings }       from './input.js';
import { generateTerrain, generateStars }                from './terrain.js';
import { resetParticles, updateParticles, drawParticles } from './particles.js';
import { createShip, updateShip }                        from './ship.js';
import {
  drawBackground, drawDistantPlanet,
  drawStars, drawPlanet, drawShip,
}                                                        from './renderer.js';
import {
  updateHUD, showWinScreen, showDeathScreen,
  hideOverlay, updateControlsHint,
  toggleSettings, stopListening,
  settingsOpen, listeningFor,
  actionBtn,
}                                                        from './ui.js';

// ── Canvas ────────────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ── Game State ────────────────────────────────────────────────────────────────
/** @type {'menu' | 'playing' | 'dead' | 'win'} */
let gameState  = 'menu';
let ship       = null;
let terrain    = null;
let stars      = null;
let difficulty = 0;
let startTime  = 0;

// ── Game Lifecycle ────────────────────────────────────────────────────────────
function resetGame() {
  terrain   = generateTerrain();
  stars     = generateStars();
  resetParticles();
  resetKeys();
  ship      = createShip(difficulty);
  startTime = performance.now();
}

// ── Game Loop ─────────────────────────────────────────────────────────────────
function gameLoop() {
  requestAnimationFrame(gameLoop);

  ctx.clearRect(0, 0, W, H);
  drawBackground(ctx);
  drawDistantPlanet(ctx);
  drawStars(ctx, stars);
  drawPlanet(ctx, terrain);

  if (gameState === 'playing') {
    const outcome = updateShip(ship, keys, terrain);

    if (outcome?.result === 'win') {
      gameState = 'win';
      difficulty++;
      const elapsed = (performance.now() - startTime) / 1000;
      showWinScreen(outcome.vy, outcome.vx, ship.fuel, elapsed);

    } else if (outcome?.result === 'crash') {
      gameState = 'dead';
      showDeathScreen(outcome.onPad, outcome.tiltOk, outcome.vy);
    }

    updateParticles();
    updateHUD(ship, terrain);
  }

  drawParticles(ctx);
  if (ship) drawShip(ctx, ship, keys);
}

// ── Input Handling ────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  // Key-capture mode: next keypress rebinds an action
  if (listeningFor) {
    e.preventDefault();
    if (e.code !== 'Escape') {
      bindings[listeningFor] = e.code;
      saveBindings();
      updateControlsHint();
    }
    stopListening();
    return;
  }

  // Escape always toggles the settings panel
  if (e.code === 'Escape') {
    toggleSettings();
    return;
  }

  if (gameState !== 'playing' || settingsOpen) return;

  if (e.code === bindings.up)    { keys.up    = true; e.preventDefault(); }
  if (e.code === bindings.down)  { keys.down  = true; e.preventDefault(); }
  if (e.code === bindings.left)  { keys.left  = true; e.preventDefault(); }
  if (e.code === bindings.right) { keys.right = true; e.preventDefault(); }
});

document.addEventListener('keyup', e => {
  if (e.code === bindings.up)    keys.up    = false;
  if (e.code === bindings.down)  keys.down  = false;
  if (e.code === bindings.left)  keys.left  = false;
  if (e.code === bindings.right) keys.right = false;
});

// ── Launch Button ─────────────────────────────────────────────────────────────
actionBtn.addEventListener('click', () => {
  if (gameState === 'menu') difficulty = 0;
  hideOverlay();
  resetGame();
  gameState = 'playing';
});

// ── Boot ──────────────────────────────────────────────────────────────────────
resetGame();            // pre-render terrain behind the menu overlay
updateControlsHint();   // populate hint with loaded bindings
gameLoop();
