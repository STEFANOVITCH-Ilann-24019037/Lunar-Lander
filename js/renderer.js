/**
 * renderer.js — All canvas drawing functions.
 *
 * Every function receives the CanvasRenderingContext2D as its first argument,
 * keeping this module free of global state.
 */

import { W, H, SURFACE_Y, PAD_WIDTH } from './constants.js';

/**
 * Fills the canvas with the deep-space background gradient.
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawBackground(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   '#000510');
  grad.addColorStop(0.6, '#000d1f');
  grad.addColorStop(1,   '#001428');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

/**
 * Draws a faint distant planet in the upper-right corner for atmosphere.
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawDistantPlanet(ctx) {
  const grad = ctx.createRadialGradient(680, 120, 10, 680, 120, 90);
  grad.addColorStop(0,   'rgba(60,80,130,0.5)');
  grad.addColorStop(0.6, 'rgba(40,55,100,0.25)');
  grad.addColorStop(1,   'rgba(30,40,80,0)');
  ctx.beginPath();
  ctx.arc(680, 120, 90, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

/**
 * Draws the animated star field. Mutates each star's `twinkle` phase.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x,y,r,brightness,twinkle }[]} stars
 */
export function drawStars(ctx, stars) {
  ctx.fillStyle = '#ffffff';
  for (const s of stars) {
    s.twinkle      += 0.02;
    ctx.globalAlpha = s.brightness * (0.7 + 0.3 * Math.sin(s.twinkle));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * Draws the rocky planet surface and the landing pad.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} terrain
 */
export function drawPlanet(ctx, terrain) {
  const pts = terrain.points;

  // Filled surface polygon
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.lineTo(W, H);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, SURFACE_Y - 40, 0, H);
  grad.addColorStop(0, '#2a3a50');
  grad.addColorStop(1, '#111a26');
  ctx.fillStyle = grad;
  ctx.fill();

  // Surface silhouette line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = '#4a6a90';
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  drawLandingPad(ctx, terrain);
}

/**
 * Draws the landing pad (called by drawPlanet).
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} terrain
 */
function drawLandingPad(ctx, terrain) {
  const px = terrain.padX;
  const py = terrain.padY;

  // Pad base
  ctx.fillStyle = '#1a3a5a';
  ctx.fillRect(px, py, PAD_WIDTH, 6);

  // Lit top edge
  ctx.fillStyle = '#50aaff';
  ctx.fillRect(px, py - 2, PAD_WIDTH, 3);

  // Blinking beacon lights
  const blink = Math.floor(performance.now() / 400) % 2 === 0;
  ctx.fillStyle = blink ? '#ff4444' : '#882222';
  ctx.beginPath(); ctx.arc(px + 6,           py - 2, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(px + PAD_WIDTH - 6, py - 2, 4, 0, Math.PI * 2); ctx.fill();

  // Label
  ctx.font      = 'bold 9px Courier New';
  ctx.fillStyle = 'rgba(80,170,255,0.7)';
  ctx.textAlign = 'center';
  ctx.fillText('LAND HERE', px + PAD_WIDTH / 2, py + 16);
  ctx.textAlign = 'left';
}

/**
 * Draws the player's spaceship.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} ship
 * @param {{ up: boolean }} keys  Only the `up` key is needed for the flame glow
 */
export function drawShip(ctx, ship, keys) {
  if (!ship || (!ship.alive && !ship.landed)) return;

  const { width: w, height: h } = ship;
  const firing = keys.up && ship.fuel > 0 && ship.alive;

  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle * Math.PI / 180);

  // Thruster glow
  if (firing) {
    ctx.shadowColor = 'rgba(255,160,40,0.85)';
    ctx.shadowBlur  = 18;
  }

  // Main capsule body
  ctx.beginPath();
  ctx.moveTo(0,          -h / 2);
  ctx.lineTo( w / 2,      h / 4);
  ctx.lineTo( w / 2.5,    h / 2);
  ctx.lineTo(-w / 2.5,    h / 2);
  ctx.lineTo(-w / 2,      h / 4);
  ctx.closePath();
  ctx.fillStyle   = '#8ab4d8';
  ctx.fill();
  ctx.strokeStyle = '#c8dff0';
  ctx.lineWidth   = 1.2;
  ctx.stroke();

  // Cockpit window
  ctx.beginPath();
  ctx.ellipse(0, -h / 6, w / 5.5, h / 7, 0, 0, Math.PI * 2);
  ctx.fillStyle   = firing ? '#ffe080' : '#4af';
  ctx.fill();
  ctx.strokeStyle = '#aadaff';
  ctx.lineWidth   = 1;
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Landing legs
  ctx.strokeStyle = '#6a8faa';
  ctx.lineWidth   = 1.8;
  ctx.beginPath(); ctx.moveTo(-w / 2.5, h / 2); ctx.lineTo(-w / 1.5, h / 2 + 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( w / 2.5, h / 2); ctx.lineTo( w / 1.5, h / 2 + 8); ctx.stroke();

  // Foot pads
  ctx.fillStyle = '#6a8faa';
  ctx.fillRect(-w / 1.5 - 5, h / 2 + 8, 10, 2.5);
  ctx.fillRect( w / 1.5 - 5, h / 2 + 8, 10, 2.5);

  // Antenna
  ctx.strokeStyle = '#aadaff';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(0, -h / 2 - 8); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -h / 2 - 9, 2, 0, Math.PI * 2); ctx.fillStyle = '#aadaff'; ctx.fill();

  // Flame cone from main thruster
  if (firing) {
    const flameLen = 14 + Math.random() * 10;
    const grad = ctx.createLinearGradient(0, h / 2, 0, h / 2 + flameLen);
    grad.addColorStop(0,   'rgba(255,255,200,0.95)');
    grad.addColorStop(0.4, 'rgba(255,160,40,0.8)');
    grad.addColorStop(1,   'rgba(255,60,0,0)');
    ctx.beginPath();
    ctx.moveTo(-w / 6, h / 2);
    ctx.lineTo(0,       h / 2 + flameLen);
    ctx.lineTo( w / 6, h / 2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  ctx.restore();
}
