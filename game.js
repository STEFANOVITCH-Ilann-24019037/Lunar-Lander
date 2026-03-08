/**
 * Lunar Lander — game.js
 * Controls: Arrow Up = main thruster | Arrow Left/Right = rotate | Arrow Down = retro-burn
 */

// ── Canvas Setup ─────────────────────────────────────────────────────────────
const canvas  = document.getElementById('gameCanvas');
const ctx     = canvas.getContext('2d');
const W       = canvas.width;   // 800
const H       = canvas.height;  // 600

// ── HUD Elements ─────────────────────────────────────────────────────────────
const hudAlt    = document.getElementById('hud-altitude');
const hudVspeed = document.getElementById('hud-vspeed');
const hudHspeed = document.getElementById('hud-hspeed');
const hudFuel   = document.getElementById('hud-fuel');
const hudScore  = document.getElementById('hud-score');

// ── Overlay Elements ──────────────────────────────────────────────────────────
const overlay       = document.getElementById('overlay');
const overlayTitle  = document.getElementById('overlay-title');
const overlayMsg    = document.getElementById('overlay-message');
const overlayStats  = document.getElementById('overlay-stats');
const controlsHint  = document.getElementById('controls-hint');
const actionBtn     = document.getElementById('action-btn');

// ── Constants ─────────────────────────────────────────────────────────────────
const GRAVITY           = 0.04;   // pixels/frame² downward
const THRUST_POWER      = 0.10;   // main thruster acceleration
const RETRO_POWER       = 0.06;   // downward retro burn (emergency brake)
const ROTATE_SPEED      = 2.2;    // degrees per frame
const SAFE_VSPEED       = 2.2;    // max vertical speed for safe landing (px/frame)
const SAFE_HSPEED       = 1.8;    // max horizontal speed for safe landing (px/frame)
const FUEL_MAX          = 100;
const FUEL_THRUST_COST  = 0.08;   // per frame while thrusting
const FUEL_RETRO_COST   = 0.05;
const FUEL_ROTATE_COST  = 0.02;
const STARS_COUNT       = 180;
const PARTICLE_LIFETIME = 28;     // frames

// ── Terrain Generation ────────────────────────────────────────────────────────
const SURFACE_Y = H - 90;   // base height of the rocky ground
const PAD_WIDTH = 90;

function generateTerrain() {
  const points = [];
  const segments = 24;
  const segW = W / segments;

  // choose a random segment for the landing pad
  const padSeg  = 4 + Math.floor(Math.random() * (segments - 8));
  const padX    = padSeg * segW;

  let y = SURFACE_Y;
  for (let i = 0; i <= segments; i++) {
    const x = i * segW;
    // keep pad area perfectly flat
    if (x >= padX && x <= padX + PAD_WIDTH) {
      points.push({ x, y: SURFACE_Y });
    } else {
      const roughness = 30;
      y = SURFACE_Y + (Math.random() - 0.5) * roughness;
      y = Math.max(SURFACE_Y - 45, Math.min(SURFACE_Y + 20, y));
      points.push({ x, y });
    }
  }

  return { points, padX: padX, padY: SURFACE_Y };
}

// ── Stars ─────────────────────────────────────────────────────────────────────
function generateStars() {
  const stars = [];
  for (let i = 0; i < STARS_COUNT; i++) {
    stars.push({
      x:         Math.random() * W,
      y:         Math.random() * (H - 100),
      r:         Math.random() * 1.2 + 0.2,
      brightness: 0.3 + Math.random() * 0.7,
      twinkle:   Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

// ── Game State ────────────────────────────────────────────────────────────────
let state;       // 'menu' | 'playing' | 'dead' | 'win'
let ship;
let terrain;
let stars;
let particles;   // thruster flame particles
let keys;
let difficulty;  // tracks how many successful landings for scaling
let startTime;

function resetGame() {
  terrain   = generateTerrain();
  stars     = generateStars();
  particles = [];
  keys      = { up: false, left: false, right: false, down: false };
  difficulty = (difficulty || 0);

  const gravityScale = 1 + difficulty * 0.15;

  ship = {
    x:       W / 2,
    y:       80,
    vx:      (Math.random() - 0.5) * (1 + difficulty * 0.4),
    vy:      0.5,
    angle:   0,          // degrees, 0 = upright
    width:   22,
    height:  32,
    fuel:    FUEL_MAX,
    alive:   true,
    landed:  false,
    gravity: GRAVITY * gravityScale,
  };

  startTime = performance.now();
}

// ── Particle System ───────────────────────────────────────────────────────────
function spawnParticles(x, y, angle, isRetro) {
  const count = isRetro ? 2 : 3;
  for (let i = 0; i < count; i++) {
    const spread = (Math.random() - 0.5) * 0.6;
    // flame shoots opposite to thrust direction
    const baseAngle = isRetro
      ? (angle + 180) * Math.PI / 180   // retro fires upward
      : angle * Math.PI / 180;          // main fires downward (ship points up = angle 0)

    const speed = 1.2 + Math.random() * 1.5;
    particles.push({
      x,
      y,
      vx: Math.sin(baseAngle + spread) * speed,
      vy: -Math.cos(baseAngle + spread) * speed,
      life: PARTICLE_LIFETIME,
      maxLife: PARTICLE_LIFETIME,
      size: 2 + Math.random() * 2,
      isRetro,
    });
  }
}

function spawnExplosion(x, y) {
  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 40 + Math.random() * 30,
      maxLife: 70,
      size: 1 + Math.random() * 4,
      isExplosion: true,
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (!p.isExplosion) p.vy += 0.04; // slight gravity on flame
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    const t = p.life / p.maxLife;

    if (p.isExplosion) {
      const r = Math.floor(255);
      const g = Math.floor(180 * t);
      const b = 0;
      ctx.globalAlpha = t * 0.8;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
    } else if (p.isRetro) {
      ctx.globalAlpha = t * 0.6;
      ctx.fillStyle = `rgb(100,180,255)`;
    } else {
      // main thruster: white → orange → transparent
      const r = 255;
      const g = Math.floor(200 * t);
      const b = Math.floor(80 * t);
      ctx.globalAlpha = t * 0.7;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Collision Detection ───────────────────────────────────────────────────────
/**
 * Returns { hit: bool, onPad: bool, groundY: number } for the ship's bottom center.
 */
function checkCollision() {
  const radians = ship.angle * Math.PI / 180;
  // Bottom tip of the ship in world coords
  const tipX = ship.x + Math.sin(radians) * (ship.height / 2);
  const tipY = ship.y + Math.cos(radians) * (ship.height / 2);  // cos because angle=0 means pointing up

  // Find terrain Y at tipX by linear interpolation
  const pts = terrain.points;
  let groundY = H;
  for (let i = 0; i < pts.length - 1; i++) {
    if (tipX >= pts[i].x && tipX <= pts[i + 1].x) {
      const t = (tipX - pts[i].x) / (pts[i + 1].x - pts[i].x);
      groundY = pts[i].y + t * (pts[i + 1].y - pts[i].y);
      break;
    }
  }

  const hit   = tipY >= groundY;
  const onPad = tipX >= terrain.padX && tipX <= terrain.padX + PAD_WIDTH;

  return { hit, onPad, groundY, tipX, tipY };
}

// ── Ship Physics Update ────────────────────────────────────────────────────────
function updateShip() {
  if (!ship.alive || ship.landed) return;

  const thrusting = keys.up   && ship.fuel > 0;
  const retro     = keys.down && ship.fuel > 0;
  const rotLeft   = keys.left;
  const rotRight  = keys.right;

  // Rotation
  if (rotLeft)  { ship.angle -= ROTATE_SPEED; ship.fuel = Math.max(0, ship.fuel - FUEL_ROTATE_COST); }
  if (rotRight) { ship.angle += ROTATE_SPEED; ship.fuel = Math.max(0, ship.fuel - FUEL_ROTATE_COST); }

  // Clamp angle for playability
  ship.angle = Math.max(-75, Math.min(75, ship.angle));

  const radians = ship.angle * Math.PI / 180;

  // Main thruster (Up key)
  if (thrusting) {
    ship.vx += Math.sin(radians) * THRUST_POWER;
    ship.vy -= Math.cos(radians) * THRUST_POWER;  // negative = upward
    ship.fuel = Math.max(0, ship.fuel - FUEL_THRUST_COST);

    // Flame particles at bottom of ship
    const flameX = ship.x + Math.sin(radians)  * (ship.height / 2 + 4);
    const flameY = ship.y + Math.cos(radians)  * (ship.height / 2 + 4);
    spawnParticles(flameX, flameY, ship.angle, false);
  }

  // Retro-burn (Down key) — counters downward motion
  if (retro) {
    ship.vx -= Math.sin(radians) * RETRO_POWER;
    ship.vy += Math.cos(radians) * RETRO_POWER;  // push upward against descent
    ship.fuel = Math.max(0, ship.fuel - FUEL_RETRO_COST);

    const retroX = ship.x - Math.sin(radians) * (ship.height / 2 + 4);
    const retroY = ship.y - Math.cos(radians) * (ship.height / 2 + 4);
    spawnParticles(retroX, retroY, ship.angle, true);
  }

  // Gravity
  ship.vy += ship.gravity;

  // Apply velocity
  ship.x += ship.vx;
  ship.y += ship.vy;

  // Wrap horizontally
  if (ship.x < -20)  ship.x = W + 20;
  if (ship.x > W + 20) ship.x = -20;

  // Collision
  const col = checkCollision();
  if (col.hit) {
    const absVy    = Math.abs(ship.vy);
    const absVx    = Math.abs(ship.vx);
    const tiltOk   = Math.abs(ship.angle) <= 15;

    if (col.onPad && absVy <= SAFE_VSPEED && absVx <= SAFE_HSPEED && tiltOk) {
      // Safe landing!
      ship.landed = true;
      ship.vy = 0;
      ship.vx = 0;
      // Snap ship onto pad
      ship.y = col.groundY - ship.height / 2 - 2;

      const elapsed = (performance.now() - startTime) / 1000;
      triggerWin(absVy, absVx, elapsed);

    } else {
      // Crash
      ship.alive = false;
      spawnExplosion(ship.x, ship.y);
      triggerDeath(col.onPad, col.tiltOk, ship.vy);
    }
  }
}

// ── HUD Update ────────────────────────────────────────────────────────────────
function updateHUD() {
  const alt     = Math.max(0, Math.round(terrain.padY - ship.y));
  const vspeed  = ship.vy.toFixed(1);
  const hspeed  = ship.vx.toFixed(1);
  const fuelPct = Math.round(ship.fuel);

  hudAlt.textContent    = `${alt} m`;
  hudVspeed.textContent = `${vspeed} m/s`;
  hudHspeed.textContent = `${hspeed} m/s`;
  hudFuel.textContent   = `${fuelPct}%`;

  // Colour-code vspeed
  const vs = Math.abs(ship.vy);
  hudVspeed.className = 'hud-value' +
    (vs > SAFE_VSPEED * 1.5 ? ' danger' : vs > SAFE_VSPEED ? ' warning' : '');

  const hs = Math.abs(ship.vx);
  hudHspeed.className = 'hud-value' +
    (hs > SAFE_HSPEED * 1.5 ? ' danger' : hs > SAFE_HSPEED ? ' warning' : '');

  hudFuel.className = 'hud-value' +
    (fuelPct < 15 ? ' danger' : fuelPct < 30 ? ' warning' : '');
}

// ── End-game triggers ─────────────────────────────────────────────────────────
function triggerWin(vy, vx, elapsed) {
  state = 'win';
  difficulty++;

  // Score: slower landing + leftover fuel + speed bonus
  const speedBonus = Math.round((SAFE_VSPEED - vy) / SAFE_VSPEED * 300);
  const fuelBonus  = Math.round(ship.fuel * 3);
  const timeBonus  = Math.round(Math.max(0, 60 - elapsed) * 2);
  const total      = Math.max(0, speedBonus + fuelBonus + timeBonus);

  hudScore.textContent = total;

  overlayTitle.textContent = 'LANDED!';
  overlayTitle.className   = 'win';
  overlayMsg.innerHTML     = 'Perfect landing. Mission success!';
  overlayStats.innerHTML   =
    `V-Speed: ${vy.toFixed(2)} m/s &nbsp;|&nbsp; H-Speed: ${vx.toFixed(2)} m/s<br>` +
    `Fuel remaining: ${Math.round(ship.fuel)}% &nbsp;|&nbsp; Time: ${elapsed.toFixed(1)}s<br>` +
    `<strong>Score: ${total}</strong>`;
  overlayStats.classList.remove('hidden');
  controlsHint.style.display = 'none';
  actionBtn.textContent = 'LAUNCH AGAIN';
  showOverlay();
}

function triggerDeath(onPad, tiltOk, vy) {
  state = 'dead';
  let reason = '';
  if (!onPad)        reason = 'Missed the landing pad!';
  else if (!tiltOk)  reason = 'Ship tilted too much on landing!';
  else               reason = `Impact velocity too high (${Math.abs(vy).toFixed(1)} m/s)!`;

  overlayTitle.textContent = 'MISSION FAILED';
  overlayTitle.className   = 'crash';
  overlayMsg.innerHTML     = reason;
  overlayStats.classList.add('hidden');
  controlsHint.style.display = 'none';
  actionBtn.textContent = 'TRY AGAIN';
  // Small delay so the explosion is visible
  setTimeout(showOverlay, 900);
}

function showOverlay() {
  overlay.classList.add('active');
}

function hideOverlay() {
  overlay.classList.remove('active');
}

// ── Drawing ───────────────────────────────────────────────────────────────────
function drawStars(frame) {
  for (const s of stars) {
    s.twinkle += 0.02;
    const alpha = s.brightness * (0.7 + 0.3 * Math.sin(s.twinkle));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPlanet() {
  // Rocky planet surface — filled polygon from terrain to bottom
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(terrain.points[0].x, terrain.points[0].y);
  for (let i = 1; i < terrain.points.length; i++) {
    ctx.lineTo(terrain.points[i].x, terrain.points[i].y);
  }
  ctx.lineTo(W, H);
  ctx.closePath();

  // Subtle gradient for the surface
  const grad = ctx.createLinearGradient(0, SURFACE_Y - 40, 0, H);
  grad.addColorStop(0, '#2a3a50');
  grad.addColorStop(1, '#111a26');
  ctx.fillStyle = grad;
  ctx.fill();

  // Surface outline
  ctx.beginPath();
  ctx.moveTo(terrain.points[0].x, terrain.points[0].y);
  for (let i = 1; i < terrain.points.length; i++) {
    ctx.lineTo(terrain.points[i].x, terrain.points[i].y);
  }
  ctx.strokeStyle = '#4a6a90';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawLandingPad();
}

function drawLandingPad() {
  const px = terrain.padX;
  const py = terrain.padY;

  // Pad base
  ctx.fillStyle = '#1a3a5a';
  ctx.fillRect(px, py, PAD_WIDTH, 6);

  // Pad top line (lit)
  ctx.fillStyle = '#50aaff';
  ctx.fillRect(px, py - 2, PAD_WIDTH, 3);

  // Blinking beacon lights
  const blink = (Math.floor(performance.now() / 400) % 2 === 0);
  const lightColor = blink ? '#ff4444' : '#882222';
  ctx.fillStyle = lightColor;
  ctx.beginPath();
  ctx.arc(px + 6, py - 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px + PAD_WIDTH - 6, py - 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // "LAND HERE" label
  ctx.font = 'bold 9px Courier New';
  ctx.fillStyle = 'rgba(80,170,255,0.7)';
  ctx.textAlign = 'center';
  ctx.fillText('LAND HERE', px + PAD_WIDTH / 2, py + 16);
  ctx.textAlign = 'left';
}

function drawShip() {
  if (!ship.alive && !ship.landed) return;

  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle * Math.PI / 180);

  const w = ship.width;
  const h = ship.height;

  // Thruster glow when firing
  if (keys.up && ship.fuel > 0 && ship.alive) {
    ctx.shadowColor = 'rgba(255,160,40,0.85)';
    ctx.shadowBlur  = 18;
  }

  // Main body (lander capsule)
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);          // top tip
  ctx.lineTo(w / 2, h / 4);       // right shoulder
  ctx.lineTo(w / 2.5, h / 2);     // right leg mount
  ctx.lineTo(-w / 2.5, h / 2);    // left leg mount
  ctx.lineTo(-w / 2, h / 4);      // left shoulder
  ctx.closePath();
  ctx.fillStyle = '#8ab4d8';
  ctx.fill();
  ctx.strokeStyle = '#c8dff0';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Cockpit window
  ctx.beginPath();
  ctx.ellipse(0, -h / 6, w / 5.5, h / 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = keys.up && ship.fuel > 0 ? '#ffe080' : '#4af';
  ctx.fill();
  ctx.strokeStyle = '#aadaff';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Landing legs
  ctx.strokeStyle = '#6a8faa';
  ctx.lineWidth = 1.8;
  // Left leg
  ctx.beginPath();
  ctx.moveTo(-w / 2.5, h / 2);
  ctx.lineTo(-w / 1.5, h / 2 + 8);
  ctx.stroke();
  // Right leg
  ctx.beginPath();
  ctx.moveTo(w / 2.5, h / 2);
  ctx.lineTo(w / 1.5, h / 2 + 8);
  ctx.stroke();
  // Foot pads
  ctx.fillStyle = '#6a8faa';
  ctx.fillRect(-w / 1.5 - 5, h / 2 + 8, 10, 2.5);
  ctx.fillRect(w / 1.5  - 5, h / 2 + 8, 10, 2.5);

  // Antenna
  ctx.strokeStyle = '#aadaff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.lineTo(0, -h / 2 - 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -h / 2 - 9, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#aadaff';
  ctx.fill();

  // Flame from main thruster
  if (keys.up && ship.fuel > 0 && ship.alive) {
    const flameLen = 14 + Math.random() * 10;
    const grad = ctx.createLinearGradient(0, h / 2, 0, h / 2 + flameLen);
    grad.addColorStop(0, 'rgba(255,255,200,0.95)');
    grad.addColorStop(0.4, 'rgba(255,160,40,0.8)');
    grad.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.beginPath();
    ctx.moveTo(-w / 6, h / 2);
    ctx.lineTo(0, h / 2 + flameLen);
    ctx.lineTo(w / 6, h / 2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  ctx.restore();
}

function drawBackground() {
  // Deep space gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#000510');
  grad.addColorStop(0.6, '#000d1f');
  grad.addColorStop(1, '#001428');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawDistantPlanet() {
  // A large distant planet for atmosphere
  const grad = ctx.createRadialGradient(680, 120, 10, 680, 120, 90);
  grad.addColorStop(0, 'rgba(60,80,130,0.5)');
  grad.addColorStop(0.6, 'rgba(40,55,100,0.25)');
  grad.addColorStop(1, 'rgba(30,40,80,0)');
  ctx.beginPath();
  ctx.arc(680, 120, 90, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

// ── Main Game Loop ────────────────────────────────────────────────────────────
let frame = 0;

function gameLoop() {
  requestAnimationFrame(gameLoop);
  frame++;

  ctx.clearRect(0, 0, W, H);

  drawBackground();
  drawDistantPlanet();
  drawStars(frame);
  drawPlanet();

  if (state === 'playing') {
    updateShip();
    updateParticles();
    updateHUD();
  }

  drawParticles();
  if (ship) drawShip();
}

// ── Input Handling ────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (state !== 'playing') return;
  switch (e.code) {
    case 'ArrowUp':    keys.up    = true; e.preventDefault(); break;
    case 'ArrowDown':  keys.down  = true; e.preventDefault(); break;
    case 'ArrowLeft':  keys.left  = true; e.preventDefault(); break;
    case 'ArrowRight': keys.right = true; e.preventDefault(); break;
  }
});

document.addEventListener('keyup', e => {
  switch (e.code) {
    case 'ArrowUp':    keys.up    = false; break;
    case 'ArrowDown':  keys.down  = false; break;
    case 'ArrowLeft':  keys.left  = false; break;
    case 'ArrowRight': keys.right = false; break;
  }
});

// ── Button Action ─────────────────────────────────────────────────────────────
actionBtn.addEventListener('click', () => {
  // On first launch reset difficulty fully
  if (state === 'menu') difficulty = 0;

  hideOverlay();
  resetGame();
  state = 'playing';
});

// ── Boot ──────────────────────────────────────────────────────────────────────
state = 'menu';
keys  = { up: false, left: false, right: false, down: false };
resetGame(); // pre-generate terrain so it's visible behind the menu
gameLoop();
