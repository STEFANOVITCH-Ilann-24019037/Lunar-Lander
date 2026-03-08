/**
 * ship.js — Ship creation, physics update, and collision detection.
 *
 * `updateShip` is a pure-ish function: it mutates the ship object in place and
 * returns a typed result describing what happened this frame.
 */

import {
  W, H,
  GRAVITY, THRUST_POWER, RETRO_POWER, ROTATE_SPEED,
  SAFE_VSPEED, SAFE_HSPEED, MAX_TILT_DEG,
  FUEL_MAX, FUEL_THRUST_COST, FUEL_RETRO_COST, FUEL_ROTATE_COST,
  PAD_WIDTH,
} from './constants.js';
import { spawnParticles, spawnExplosion } from './particles.js';

/**
 * Creates a fresh ship state object.
 * @param {number} difficulty  0 = default, higher = more gravity / initial drift
 * @returns {object}
 */
export function createShip(difficulty = 0) {
  return {
    x:       W / 2,
    y:       80,
    vx:      (Math.random() - 0.5) * (1 + difficulty * 0.4),
    vy:      0.5,
    angle:   0,      // degrees; 0 = upright
    width:   22,
    height:  32,
    fuel:    FUEL_MAX,
    alive:   true,
    landed:  false,
    gravity: GRAVITY * (1 + difficulty * 0.15),
  };
}

/**
 * Tests whether the ship's bottom tip has hit the terrain.
 * @param {object} ship
 * @param {object} terrain
 * @returns {{ hit: boolean, onPad: boolean, groundY: number }}
 */
export function checkCollision(ship, terrain) {
  const rad  = ship.angle * Math.PI / 180;
  const tipX = ship.x + Math.sin(rad) * (ship.height / 2);
  const tipY = ship.y + Math.cos(rad) * (ship.height / 2);

  // Interpolate terrain height at tipX
  const pts = terrain.points;
  let groundY = H;
  for (let i = 0; i < pts.length - 1; i++) {
    if (tipX >= pts[i].x && tipX <= pts[i + 1].x) {
      const t = (tipX - pts[i].x) / (pts[i + 1].x - pts[i].x);
      groundY  = pts[i].y + t * (pts[i + 1].y - pts[i].y);
      break;
    }
  }

  return {
    hit:    tipY >= groundY,
    onPad:  tipX >= terrain.padX && tipX <= terrain.padX + PAD_WIDTH,
    groundY,
  };
}

/**
 * Advances ship physics by one frame.
 *
 * @param {object} ship     Mutable ship state
 * @param {object} keys     Current key-press state { up, down, left, right }
 * @param {object} terrain  Terrain data for collision
 * @returns {null | { result: 'win', vy: number, vx: number }
 *                 | { result: 'crash', onPad: boolean, tiltOk: boolean, vy: number }}
 */
export function updateShip(ship, keys, terrain) {
  if (!ship.alive || ship.landed) return null;

  // ── Rotation ───────────────────────────────────────────────────────────────
  if (keys.left) {
    ship.angle -= ROTATE_SPEED;
    ship.fuel   = Math.max(0, ship.fuel - FUEL_ROTATE_COST);
  }
  if (keys.right) {
    ship.angle += ROTATE_SPEED;
    ship.fuel   = Math.max(0, ship.fuel - FUEL_ROTATE_COST);
  }
  ship.angle = Math.max(-75, Math.min(75, ship.angle));

  const rad = ship.angle * Math.PI / 180;

  // ── Main thruster (↑) ───────────────────────────────────────────────────────
  if (keys.up && ship.fuel > 0) {
    ship.vx  += Math.sin(rad) * THRUST_POWER;
    ship.vy  -= Math.cos(rad) * THRUST_POWER;
    ship.fuel = Math.max(0, ship.fuel - FUEL_THRUST_COST);
    spawnParticles(
      ship.x + Math.sin(rad) * (ship.height / 2 + 4),
      ship.y + Math.cos(rad) * (ship.height / 2 + 4),
      ship.angle, false,
    );
  }

  // ── Retro-burn (↓) ───────────────────────────────────────────────────────────
  if (keys.down && ship.fuel > 0) {
    ship.vx  -= Math.sin(rad) * RETRO_POWER;
    ship.vy  += Math.cos(rad) * RETRO_POWER;
    ship.fuel = Math.max(0, ship.fuel - FUEL_RETRO_COST);
    spawnParticles(
      ship.x - Math.sin(rad) * (ship.height / 2 + 4),
      ship.y - Math.cos(rad) * (ship.height / 2 + 4),
      ship.angle, true,
    );
  }

  // ── Gravity + integrate ────────────────────────────────────────────────────
  ship.vy  += ship.gravity;
  ship.x   += ship.vx;
  ship.y   += ship.vy;

  // Horizontal screen wrap
  if (ship.x < -20)     ship.x = W + 20;
  if (ship.x > W + 20)  ship.x = -20;

  // ── Collision ─────────────────────────────────────────────────────────────
  const col    = checkCollision(ship, terrain);
  if (!col.hit) return null;

  const absVy  = Math.abs(ship.vy);
  const absVx  = Math.abs(ship.vx);
  const tiltOk = Math.abs(ship.angle) <= MAX_TILT_DEG;

  if (col.onPad && absVy <= SAFE_VSPEED && absVx <= SAFE_HSPEED && tiltOk) {
    // Safe landing — freeze the ship on the pad
    ship.landed = true;
    ship.vx     = 0;
    ship.vy     = 0;
    ship.y      = col.groundY - ship.height / 2 - 2;
    return { result: 'win', vy: absVy, vx: absVx };
  }

  // Crash
  ship.alive = false;
  spawnExplosion(ship.x, ship.y);
  return { result: 'crash', onPad: col.onPad, tiltOk, vy: ship.vy };
}
