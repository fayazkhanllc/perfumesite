/**
 * Flight simulation for the eagle flock. Pure maths, no rendering.
 * Tweak the numbers in CONFIG to change speed, mouse sensitivity, flock size or flyby rhythm.
 */
export const CONFIG = {
  /** Supporting birds next to the primary one. */
  supportDesktop: 4,
  supportMobile: 2,
  fov: 38,
  /** Spring stiffness / damping that give the birds weight and lag. */
  stiffness: 2.1,
  damping: 2.5,
  maxSpeed: 5,
  /** How far the mouse can pull the flight path (fraction of the visible area). */
  mouseX: 0.42,
  mouseY: 0.36,
  /** Seconds between near-camera flybys of the primary eagle, and how long each lasts. */
  flybyEvery: 32,
  flybyLength: 7,
  /** Primary wingspan in world units (supporting birds are smaller). */
  primarySpan: 2.4,
};

export type V3 = { x: number; y: number; z: number };

export type Bird = {
  pos: V3;
  vel: V3;
  acc: V3;
  /** smoothed values read by the renderer */
  roll: number;
  flap: number; // animation speed multiplier
  fwd: V3;
  phase: number;
  speedMul: number;
  /** formation slot relative to the primary (view-space fractions) */
  slot: { x: number; y: number; d: number };
  scale: number;
  primary: boolean;
};

export type Inputs = {
  mx: number; // -1..1 (damped)
  my: number; // -1..1, up is positive (damped)
  scroll: number; // 0..1 page progress
  scrollVel: number; // smoothed, px/s
  calm: boolean; // reduced motion
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

export function visible(d: number, aspect: number) {
  const hh = d * Math.tan((CONFIG.fov * Math.PI) / 360);
  return { hh, hw: hh * aspect };
}

export function makeFlock(count: number): Bird[] {
  const birds: Bird[] = [];
  for (let i = 0; i <= count; i++) {
    const primary = i === 0;
    const side = i % 2 ? 1 : -1;
    const rank = Math.ceil(i / 2);
    birds.push({
      pos: { x: -2 + i * 0.6, y: 7 + i, z: -14 - i * 2 }, // start above the top of the view
      vel: { x: 0.3, y: -0.8, z: 0.2 },
      acc: { x: 0, y: 0, z: 0 },
      roll: 0,
      flap: 0.6,
      fwd: { x: 1, y: 0, z: 0 },
      phase: i * 1.7,
      speedMul: 0.9 + ((i * 37) % 20) / 100,
      slot: { x: -side * rank * 0.2, y: rank * 0.08 + (i % 3) * 0.05, d: 9 + rank * 1.8 + (i % 2) * 1.2 },
      scale: primary ? 1 : 0.55 + ((i * 13) % 20) / 100,
      primary,
    });
  }
  return birds;
}

/** Where the primary eagle wants to be: an autonomous path, nudged by mouse and scroll. */
function primaryTarget(t: number, aspect: number, input: Inputs, flyby: number, side: number): V3 {
  const calm = input.calm ? 0.45 : 1;
  const tt = t * calm;
  let nx = 0.6 * Math.sin(0.11 * tt) + 0.22 * Math.sin(0.27 * tt + 1);
  let ny = 0.3 * Math.sin(0.083 * tt + 0.6) + 0.14 * Math.sin(0.19 * tt);
  let d = 7.5 + 1.4 * Math.sin(0.05 * tt);
  // The journey continues down the page: path drifts with scroll progress, and dips or lifts with scroll speed.
  nx += 0.24 * Math.cos(input.scroll * Math.PI * 3);
  ny += 0.32 * Math.sin(input.scroll * Math.PI * 4);
  ny -= clamp(input.scrollVel * 0.0004, -0.35, 0.35);
  // Mouse steers the path; it never positions the bird directly.
  if (!input.calm) {
    nx += input.mx * CONFIG.mouseX;
    ny += input.my * CONFIG.mouseY;
  }
  if (flyby > 0) {
    const f = smooth(flyby);
    d = d + (2.7 - d) * f;
    nx = nx * (1 - f) + side * 0.62 * f;
    ny = ny * (1 - f) + 0.18 * f;
  }
  const v = visible(d, aspect);
  return { x: nx * v.hw, y: ny * v.hh, z: -d };
}

export type FlockState = { t: number; flyby: number; nextFlyby: number; flybySide: number };

export function newFlockState(): FlockState {
  return { t: 0, flyby: 0, nextFlyby: 14, flybySide: 1 };
}

export function stepFlock(birds: Bird[], s: FlockState, dt: number, aspect: number, input: Inputs) {
  s.t += dt;
  // Flyby envelope: rises, holds, falls
  if (!input.calm) {
    if (s.flyby === 0 && s.t > s.nextFlyby) s.flyby = 0.0001;
    if (s.flyby > 0) {
      const k = s.t - s.nextFlyby;
      const L = CONFIG.flybyLength;
      s.flyby = k < 0 ? 0 : k > L ? 0 : Math.sin((k / L) * Math.PI);
      if (k > L) {
        s.flyby = 0;
        s.nextFlyby = s.t + CONFIG.flybyEvery * (0.8 + ((s.t * 7) % 5) / 10);
        s.flybySide = -s.flybySide;
      }
    }
  }
  const lead = birds[0];
  const leadTarget = primaryTarget(s.t, aspect, input, s.flyby, s.flybySide);
  // Formation reshuffles slowly so the group never looks locked in place
  const shuffle = Math.sin(s.t * 0.05);

  for (let i = 0; i < birds.length; i++) {
    const b = birds[i];
    let tx: number, ty: number, tz: number;
    if (b.primary) {
      tx = leadTarget.x;
      ty = leadTarget.y;
      tz = leadTarget.z;
    } else {
      const v = visible(Math.abs(lead.pos.z) + b.slot.d - 7.5, aspect);
      const wob = (a: number, f: number) => Math.sin(s.t * f + b.phase * a);
      tx = lead.pos.x + (b.slot.x * (1 + 0.5 * shuffle) + 0.06 * wob(1, 0.31)) * v.hw - Math.sign(lead.vel.x) * 0.5;
      ty = lead.pos.y + (b.slot.y + 0.05 * wob(2, 0.23)) * v.hh * 2 - 0.2;
      tz = -Math.max(3.5, Math.abs(lead.pos.z) + b.slot.d - 7.5 + 1.2 * wob(3, 0.17));
    }

    // spring with damping = inertia and a slight response delay
    const ax = CONFIG.stiffness * (tx - b.pos.x) - CONFIG.damping * b.vel.x;
    const ay = CONFIG.stiffness * (ty - b.pos.y) - CONFIG.damping * b.vel.y;
    const az = CONFIG.stiffness * (tz - b.pos.z) - CONFIG.damping * b.vel.z;
    b.acc.x += (ax - b.acc.x) * Math.min(1, dt * 3);
    b.acc.y += (ay - b.acc.y) * Math.min(1, dt * 3);
    b.acc.z += (az - b.acc.z) * Math.min(1, dt * 3);

    // separation: never stack or collide
    for (let j = 0; j < birds.length; j++) {
      if (j === i) continue;
      const o = birds[j];
      const dx = b.pos.x - o.pos.x;
      const dy = b.pos.y - o.pos.y;
      const dz = b.pos.z - o.pos.z;
      const dist = Math.hypot(dx, dy, dz);
      const min = 2.6 * (b.scale + o.scale) * 0.5 + 0.7;
      if (dist < min && dist > 0.001) {
        const push = ((min - dist) / min) * 6;
        b.acc.x += (dx / dist) * push;
        b.acc.y += (dy / dist) * push;
        b.acc.z += (dz / dist) * push;
      }
    }

    const speedLimit = CONFIG.maxSpeed * b.speedMul * (input.calm ? 0.5 : 1);
    b.vel.x += b.acc.x * dt;
    b.vel.y += b.acc.y * dt;
    b.vel.z += b.acc.z * dt;
    const sp = Math.hypot(b.vel.x, b.vel.y, b.vel.z);
    if (sp > speedLimit) {
      const k = speedLimit / sp;
      b.vel.x *= k;
      b.vel.y *= k;
      b.vel.z *= k;
    }
    b.pos.x += b.vel.x * dt;
    b.pos.y += b.vel.y * dt;
    b.pos.z += b.vel.z * dt;

    // Heading follows velocity, smoothed. Birds always keep a little forward motion so they never hover.
    const speed = Math.hypot(b.vel.x, b.vel.y, b.vel.z);
    if (speed > 0.15) {
      const k = Math.min(1, dt * 2.2);
      b.fwd.x += (b.vel.x / speed - b.fwd.x) * k;
      b.fwd.y += (b.vel.y / speed - b.fwd.y) * k;
      b.fwd.z += (b.vel.z / speed - b.fwd.z) * k;
      const n = Math.hypot(b.fwd.x, b.fwd.y, b.fwd.z) || 1;
      b.fwd.x /= n;
      b.fwd.y /= n;
      b.fwd.z /= n;
    }

    // Bank into turns (from lateral acceleration), smoothed
    const rollTarget = clamp(-b.acc.x * 0.32 * Math.sign(b.fwd.x || 1), -0.85, 0.85);
    b.roll += (rollTarget - b.roll) * Math.min(1, dt * 2.5);

    // Wing speed: flap when climbing, accelerating or turning hard; glide when descending or steady
    const climbing = clamp(b.vel.y, -1, 2);
    const effort = clamp(Math.abs(b.acc.x) * 0.25 + Math.abs(b.acc.y) * 0.5 + Math.max(0, climbing) * 0.5, 0, 1.6);
    const glide = 0.18;
    const flapTarget = glide + effort * 1.1 + (b.primary ? 0 : 0.1);
    b.flap += (flapTarget - b.flap) * Math.min(1, dt * 1.6);
  }
}
