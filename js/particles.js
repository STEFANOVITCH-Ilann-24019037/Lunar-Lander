/**
 * particles.js — Thruster flame and explosion particle system.
 *
 * The `particles` array is module-private; callers use the exported API.
 */

import { PARTICLE_LIFETIME } from './constants.js';

const particles = [];

/** Empties the particle pool (call on game reset). */
export function resetParticles() {
  particles.length = 0;
}

/**
 * Spawns thruster flame particles at a given world position.
 * @param {number}  x
 * @param {number}  y
 * @param {number}  angle    Ship angle in degrees
 * @param {boolean} isRetro  True = retro-burn (blue), false = main thruster (orange)
 */
export function spawnParticles(x, y, angle, isRetro) {
  const count = isRetro ? 2 : 3;
  for (let i = 0; i < count; i++) {
    const spread    = (Math.random() - 0.5) * 0.6;
    const baseAngle = isRetro
      ? (angle + 180) * Math.PI / 180   // retro fires toward nose
      : angle         * Math.PI / 180;  // main fires away from nose

    const speed = 1.2 + Math.random() * 1.5;
    particles.push({
      x, y,
      vx:      Math.sin(baseAngle + spread) * speed,
      vy:     -Math.cos(baseAngle + spread) * speed,
      life:    PARTICLE_LIFETIME,
      maxLife: PARTICLE_LIFETIME,
      size:    2 + Math.random() * 2,
      isRetro,
    });
  }
}

/**
 * Spawns an explosion burst at a given world position.
 * @param {number} x
 * @param {number} y
 */
export function spawnExplosion(x, y) {
  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 4;
    particles.push({
      x, y,
      vx:          Math.cos(angle) * speed,
      vy:          Math.sin(angle) * speed,
      life:        40 + Math.random() * 30,
      maxLife:     70,
      size:        1  + Math.random() * 4,
      isExplosion: true,
    });
  }
}

/** Advances all particles by one frame and removes dead ones. */
export function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (!p.isExplosion) p.vy += 0.04;  // slight drag / gravity on flame
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

/**
 * Draws all active particles onto the given canvas context.
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawParticles(ctx) {
  for (const p of particles) {
    const t = p.life / p.maxLife;

    if (p.isExplosion) {
      ctx.globalAlpha = t * 0.8;
      ctx.fillStyle   = `rgb(255,${Math.floor(180 * t)},0)`;
    } else if (p.isRetro) {
      ctx.globalAlpha = t * 0.6;
      ctx.fillStyle   = 'rgb(100,180,255)';
    } else {
      ctx.globalAlpha = t * 0.7;
      ctx.fillStyle   = `rgb(255,${Math.floor(200 * t)},${Math.floor(80 * t)})`;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
