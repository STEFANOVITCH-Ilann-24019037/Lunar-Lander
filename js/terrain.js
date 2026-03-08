/**
 * terrain.js — Procedural terrain and star-field generation.
 */

import { W, H, SURFACE_Y, PAD_WIDTH, STARS_COUNT } from './constants.js';

/**
 * Generates a randomised terrain with a flat landing pad.
 * @returns {{ points: {x,y}[], padX: number, padY: number }}
 */
export function generateTerrain() {
  const segments = 24;
  const segW     = W / segments;
  const padSeg   = 4 + Math.floor(Math.random() * (segments - 8));
  const padX     = padSeg * segW;

  const points = [];
  let y = SURFACE_Y;

  for (let i = 0; i <= segments; i++) {
    const x = i * segW;
    if (x >= padX && x <= padX + PAD_WIDTH) {
      points.push({ x, y: SURFACE_Y });
    } else {
      y = SURFACE_Y + (Math.random() - 0.5) * 30;
      y = Math.max(SURFACE_Y - 45, Math.min(SURFACE_Y + 20, y));
      points.push({ x, y });
    }
  }

  return { points, padX, padY: SURFACE_Y };
}

/**
 * Generates a randomised star field.
 * @returns {{ x,y,r,brightness,twinkle }[]}
 */
export function generateStars() {
  const stars = [];
  for (let i = 0; i < STARS_COUNT; i++) {
    stars.push({
      x:          Math.random() * W,
      y:          Math.random() * (H - 100),
      r:          Math.random() * 1.2 + 0.2,
      brightness: 0.3 + Math.random() * 0.7,
      twinkle:    Math.random() * Math.PI * 2,
    });
  }
  return stars;
}
