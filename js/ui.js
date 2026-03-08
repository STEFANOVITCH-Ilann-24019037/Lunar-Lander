/**
 * ui.js — HUD readouts, overlay screens, and the settings panel.
 *
 * Settings state is exported as live ESM bindings so main.js can read
 * `settingsOpen` and `listeningFor` without calling a getter.
 */

import { SAFE_VSPEED, SAFE_HSPEED } from './constants.js';
import { bindings, DEFAULT_BINDINGS, saveBindings, formatKey, resetKeys } from './input.js';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const hudAlt    = document.getElementById('hud-altitude');
const hudVspeed = document.getElementById('hud-vspeed');
const hudHspeed = document.getElementById('hud-hspeed');
const hudFuel   = document.getElementById('hud-fuel');
const hudScore  = document.getElementById('hud-score');

const overlay      = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg   = document.getElementById('overlay-message');
const overlayStats = document.getElementById('overlay-stats');

export const controlsHint = document.getElementById('controls-hint');
export const actionBtn    = document.getElementById('action-btn');

const settingsBtn   = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsClose = document.getElementById('settings-close');
const settingsReset = document.getElementById('settings-reset');
const keyBtns       = document.querySelectorAll('.key-btn');

// ── Settings state (live ESM exports) ─────────────────────────────────────────
/** True while the settings panel is visible. */
export let settingsOpen = false;
/** The action key ('up'|'down'|'left'|'right') waiting for a new binding, or null. */
export let listeningFor = null;

// ── HUD ───────────────────────────────────────────────────────────────────────
/**
 * Updates all HUD value elements to reflect the current ship state.
 * @param {object} ship
 * @param {object} terrain
 */
export function updateHUD(ship, terrain) {
  const alt     = Math.max(0, Math.round(terrain.padY - ship.y));
  const fuelPct = Math.round(ship.fuel);

  hudAlt.textContent    = `${alt} m`;
  hudVspeed.textContent = `${ship.vy.toFixed(1)} m/s`;
  hudHspeed.textContent = `${ship.vx.toFixed(1)} m/s`;
  hudFuel.textContent   = `${fuelPct}%`;

  const vs = Math.abs(ship.vy);
  hudVspeed.className = 'hud-value' +
    (vs > SAFE_VSPEED * 1.5 ? ' danger' : vs > SAFE_VSPEED ? ' warning' : '');

  const hs = Math.abs(ship.vx);
  hudHspeed.className = 'hud-value' +
    (hs > SAFE_HSPEED * 1.5 ? ' danger' : hs > SAFE_HSPEED ? ' warning' : '');

  hudFuel.className = 'hud-value' +
    (fuelPct < 15 ? ' danger' : fuelPct < 30 ? ' warning' : '');
}

// ── Overlay screens ───────────────────────────────────────────────────────────
export function showOverlay() { overlay.classList.add('active');    }
export function hideOverlay() { overlay.classList.remove('active'); }

/**
 * Shows the victory screen with the calculated score.
 * @param {number} vy       Absolute vertical speed at landing
 * @param {number} vx       Absolute horizontal speed at landing
 * @param {number} fuel     Remaining fuel percentage
 * @param {number} elapsed  Time in seconds since the run started
 */
export function showWinScreen(vy, vx, fuel, elapsed) {
  const speedBonus = Math.round((SAFE_VSPEED - vy) / SAFE_VSPEED * 300);
  const fuelBonus  = Math.round(fuel * 3);
  const timeBonus  = Math.round(Math.max(0, 60 - elapsed) * 2);
  const total      = Math.max(0, speedBonus + fuelBonus + timeBonus);

  hudScore.textContent = total;

  overlayTitle.textContent = 'LANDED!';
  overlayTitle.className   = 'win';
  overlayMsg.innerHTML     = 'Perfect landing. Mission success!';
  overlayStats.innerHTML   =
    `V-Speed: ${vy.toFixed(2)} m/s &nbsp;|&nbsp; H-Speed: ${vx.toFixed(2)} m/s<br>` +
    `Fuel remaining: ${Math.round(fuel)}% &nbsp;|&nbsp; Time: ${elapsed.toFixed(1)}s<br>` +
    `<strong>Score: ${total}</strong>`;

  overlayStats.classList.remove('hidden');
  controlsHint.style.display = 'none';
  actionBtn.textContent      = 'LAUNCH AGAIN';
  showOverlay();
}

/**
 * Shows the crash / game-over screen.
 * @param {boolean} onPad   Whether the ship hit the pad (vs bare terrain)
 * @param {boolean} tiltOk  Whether the ship angle was within the safe limit
 * @param {number}  vy      Raw vertical velocity at impact
 */
export function showDeathScreen(onPad, tiltOk, vy) {
  let reason;
  if (!onPad)       reason = 'Missed the landing pad!';
  else if (!tiltOk) reason = 'Ship tilted too much on landing!';
  else              reason = `Impact velocity too high (${Math.abs(vy).toFixed(1)} m/s)!`;

  overlayTitle.textContent = 'MISSION FAILED';
  overlayTitle.className   = 'crash';
  overlayMsg.innerHTML     = reason;
  overlayStats.classList.add('hidden');
  controlsHint.style.display = 'none';
  actionBtn.textContent      = 'TRY AGAIN';
  // Delay so the explosion plays out before the screen appears
  setTimeout(showOverlay, 900);
}

// ── Controls hint ─────────────────────────────────────────────────────────────
/** Rebuilds the controls hint block using the current key bindings. */
export function updateControlsHint() {
  controlsHint.style.display = '';
  controlsHint.innerHTML =
    `<p><kbd>${formatKey(bindings.up)}</kbd> Propulseur &nbsp; ` +
    `<kbd>${formatKey(bindings.left)}</kbd><kbd>${formatKey(bindings.right)}</kbd> Rotation</p>` +
    `<p><kbd>${formatKey(bindings.down)}</kbd> Rétro-fusée (frein d'urgence)</p>` +
    `<p style="color:rgba(160,210,255,0.35);font-size:10px;margin-top:8px">` +
    `<kbd>Échap</kbd> Ouvrir les paramètres</p>`;
}

// ── Settings panel ────────────────────────────────────────────────────────────
function refreshKeyButtons() {
  keyBtns.forEach(btn => {
    btn.textContent = formatKey(bindings[btn.dataset.action]);
    btn.classList.remove('listening');
  });
}

export function stopListening() {
  listeningFor = null;
  refreshKeyButtons();
}

export function openSettings() {
  settingsOpen = true;
  listeningFor = null;
  resetKeys();
  refreshKeyButtons();
  settingsModal.classList.add('active');
}

export function closeSettings() {
  listeningFor = null;
  refreshKeyButtons();
  settingsModal.classList.remove('active');
  settingsOpen = false;
}

export function toggleSettings() {
  if (settingsOpen) closeSettings(); else openSettings();
}

// ── Settings event listeners ──────────────────────────────────────────────────
settingsBtn.addEventListener('click', toggleSettings);
settingsClose.addEventListener('click', closeSettings);

settingsReset.addEventListener('click', () => {
  Object.assign(bindings, DEFAULT_BINDINGS);
  saveBindings();
  updateControlsHint();
  refreshKeyButtons();
});

keyBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    stopListening();
    listeningFor        = btn.dataset.action;
    btn.textContent     = '…';
    btn.classList.add('listening');
  });
});
