// ──Canvas dimensions ─────────────────────────────────────────────────────────
export const W = 800;
export const H = 600;

// ── Physics ───────────────────────────────────────────────────────────────────
export const GRAVITY          = 0.04;  // px/frame² downward
export const THRUST_POWER     = 0.10;  // main thruster acceleration
export const RETRO_POWER      = 0.06;  // retro-burn counter-acceleration
export const ROTATE_SPEED     = 2.2;   // degrees per frame

// ── Landing thresholds ────────────────────────────────────────────────────────
export const SAFE_VSPEED      = 2.2;   // max vert. speed for safe landing (px/frame)
export const SAFE_HSPEED      = 1.8;   // max horiz. speed for safe landing (px/frame)
export const MAX_TILT_DEG     = 15;    // max angle for safe landing (degrees)

// ── Fuel ──────────────────────────────────────────────────────────────────────
export const FUEL_MAX         = 100;
export const FUEL_THRUST_COST = 0.08;  // per frame while thrusting
export const FUEL_RETRO_COST  = 0.05;  // per frame while retro-burning
export const FUEL_ROTATE_COST = 0.02;  // per frame while rotating

// ── World ─────────────────────────────────────────────────────────────────────
export const SURFACE_Y        = H - 90;  // base height of the rocky ground
export const PAD_WIDTH        = 90;      // landing pad width in pixels
export const STARS_COUNT      = 180;

// ── Particles ─────────────────────────────────────────────────────────────────
export const PARTICLE_LIFETIME = 28;  // frames
