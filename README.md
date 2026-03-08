# Lunar Lander

A minimalist browser-based Lunar Lander game built with pure **HTML5, CSS3, and vanilla JavaScript** — no frameworks, no dependencies.

## Live Gameplay

Open `index.html` directly in any modern browser to play. No build step or server required.

---

## Controls

| Key             | Action                                |
| --------------- | ------------------------------------- |
| `↑` Arrow Up    | Fire main thruster (slows descent)    |
| `↓` Arrow Down  | Retro-burn (emergency counter-thrust) |
| `←` Arrow Left  | Rotate ship counter-clockwise         |
| `→` Arrow Right | Rotate ship clockwise                 |

---

## Objective

Guide your spacecraft to the **blue landing pad** at the bottom of the screen.  
Land safely by keeping your speeds within the safe limits shown in the HUD.

### Safe Landing Requirements

| Parameter                | Safe Limit |
| ------------------------ | ---------- |
| Vertical speed           | ≤ 2.2 m/s  |
| Horizontal speed         | ≤ 1.8 m/s  |
| Ship tilt                | ≤ 15°      |
| Must land **on the pad** | ✓          |

If any condition is violated → **CRASH**.

---

## Features

### Core Mechanics

- **Gravity** constantly pulls the ship downward — thrust to fight it
- **Fuel system** — all thrusters and rotation consume fuel; run out and you can only fall
- **Rotation** — tilt the ship to steer horizontally
- **Collision detection** — landing-leg tip checked against procedural terrain

### HUD (Heads-Up Display)

- **Altitude** — height above the landing pad
- **V-Speed** — vertical velocity (turns yellow/red when too fast)
- **H-Speed** — horizontal velocity (turns yellow/red when too fast)
- **Fuel** — remaining thruster fuel in percent
- **Score** — calculated on successful landing

### Scoring (on successful landing)

```
Score = Speed Bonus + Fuel Bonus + Time Bonus
      = (how gently you landed) + (fuel remaining × 3) + (max(0, 60s − elapsed) × 2)
```

### Visual Effects

- Procedurally generated rocky terrain every run
- Twinkling star field
- Thruster flame with animated particle trail
- Retro-burn blue particle burst
- Explosion particle system on crash
- Blinking beacon lights on the landing pad
- Distant background planet

### Difficulty Scaling

Each successful landing increases gravity strength and the ship's initial horizontal drift, keeping the challenge fresh.

---

## Project Structure

```
Lunar-Lander/
├── index.html   ← Game shell, HUD elements, overlay screens
├── style.css    ← Dark space theme, HUD styling, overlay/button styles
├── game.js      ← All game logic: physics, rendering, input, particles
└── README.md    ← This file
```

---

## Browser Compatibility

Works in any browser supporting the **HTML5 Canvas API** (Chrome, Firefox, Edge, Safari — all modern versions).

---

## Possible Extensions

- [ ] Mobile touch controls
- [ ] Multiple landing pad sizes (narrow = more points)
- [ ] Wind gusts as a random hazard
- [ ] High-score persistence with `localStorage`
- [ ] Sound effects via the Web Audio API
- [ ] Animated planet scroll (parallax layers)
