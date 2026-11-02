import {
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * A procedurally built golden eagle (no external file): layered primary, secondary and covert
 * feathers on a jointed wing (shoulder, elbow, wrist), a fanned tail, hooked beak, brow ridge and
 * talons. Body length runs along +Z, wings along +/-X. Total wingspan is 3.1 units.
 *
 * It is a stylised real-time model, not a scan. Drop a scanned model at /models/eagle.glb to replace it.
 */

const rnd = (seed: number) => {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
};

type Kind = 'flight' | 'covert' | 'tail' | 'body' | 'nape';

/** Paints a feather vane: rachis at u = 0.32, barbs sweeping back, and species-style colouring. */
function paint(kind: Kind, seed: number): CanvasTexture {
  const W = 256;
  const H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const r = rnd(seed);
  const rach = W * 0.32;

  // base colour: v = 0 at the bottom of the canvas (feather base), tip at the top
  const grad = g.createLinearGradient(0, H, 0, 0);
  if (kind === 'flight') {
    grad.addColorStop(0, '#4a3523');
    grad.addColorStop(0.35, '#2c1d12');
    grad.addColorStop(0.85, '#1f140c');
    grad.addColorStop(1, '#2b2016');
  } else if (kind === 'covert') {
    grad.addColorStop(0, '#2f1f13');
    grad.addColorStop(0.55, '#3d2815');
    grad.addColorStop(0.9, '#8a6334');
    grad.addColorStop(1, '#b18a4f');
  } else if (kind === 'tail') {
    grad.addColorStop(0, '#6b6154');
    grad.addColorStop(0.55, '#4a4036');
    grad.addColorStop(0.82, '#2a2018');
    grad.addColorStop(0.9, '#17100a');
    grad.addColorStop(1, '#3a2c1d');
  } else if (kind === 'nape') {
    grad.addColorStop(0, '#6b4a22');
    grad.addColorStop(1, '#c9953f');
  } else {
    grad.addColorStop(0, '#2d1d11');
    grad.addColorStop(1, '#4a3019');
  }
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  // barring on flight/tail feathers
  if (kind === 'flight' || kind === 'tail') {
    g.globalAlpha = kind === 'tail' ? 0.35 : 0.22;
    g.fillStyle = '#8c8372';
    for (let y = H * 0.12; y < H * 0.78; y += kind === 'tail' ? 58 : 46) {
      g.fillRect(rach, H - y - 14, W - rach, 14);
    }
    g.globalAlpha = 1;
  }

  // body / nape: overlapping feather scales
  if (kind === 'body' || kind === 'nape') {
    for (let y = 0; y < H + 30; y += 22) {
      for (let x = -((y / 22) % 2) * 14; x < W + 30; x += 28) {
        const lift = r() * 0.1;
        g.fillStyle = `rgba(${kind === 'nape' ? '236,190,110' : '120,86,52'},${0.1 + lift})`;
        g.beginPath();
        g.ellipse(x, y, 13, 14, 0, 0, Math.PI);
        g.fill();
        g.strokeStyle = 'rgba(15,8,4,0.35)';
        g.lineWidth = 1.1;
        g.stroke();
      }
    }
  }

  // barbs: thousands of fine slanted hairlines either side of the shaft
  if (kind !== 'body' && kind !== 'nape') {
    g.lineWidth = 1;
    for (let y = 0; y < H; y += 1.6) {
      for (const side of [-1, 1]) {
        const edge = side < 0 ? 0 : W;
        const dx = Math.abs(edge - rach);
        g.strokeStyle = r() > 0.5 ? 'rgba(255,235,200,0.10)' : 'rgba(0,0,0,0.14)';
        g.beginPath();
        g.moveTo(rach, y);
        g.lineTo(edge, y - dx * 0.55 - r() * 6);
        g.stroke();
      }
    }
    // rachis (shaft)
    g.strokeStyle = 'rgba(235,215,170,0.55)';
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(rach, H);
    g.lineTo(rach, 0);
    g.stroke();
  }

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  if (kind === 'body' || kind === 'nape') {
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.repeat.set(2, 2);
  }
  return tex;
}

/** One feather blade lying in the X-Z plane, base at the origin, tip along +X. Leading vane is +Z. */
function feather(len: number, wid: number, opts: { curl?: number; notch?: number; round?: number } = {}): BufferGeometry {
  const { curl = 0.1, notch = 0, round = 2.2 } = opts;
  const segs = 8;
  const a = 0.32;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    let p = t < 0.1 ? 0.45 + (t / 0.1) * 0.55 : Math.pow(1 - Math.pow((t - 0.1) / 0.9, round), 0.7);
    p = Math.max(p, 0.02);
    const trail = wid * (1 - a) * p * (1 - notch * smooth(0.5, 0.78, t) * 0.7);
    const lead = wid * a * p * (1 - notch * smooth(0.5, 0.78, t) * 0.25);
    const x = len * t;
    const y = len * curl * t * t;
    const droop = 0.12 * wid * p;
    pos.push(x, y - droop * 0.3, lead, x, y, 0, x, y - droop, -trail);
    uv.push(0, t, a, t, 1, t);
    if (i < segs) {
      const k = i * 3;
      idx.push(k, k + 1, k + 3, k + 1, k + 4, k + 3, k + 1, k + 2, k + 4, k + 2, k + 5, k + 4);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export type EagleKit = {
  mats: Record<'flight' | 'covert' | 'tail' | 'body' | 'nape' | 'beak' | 'cere' | 'foot' | 'talon' | 'eye', MeshStandardMaterial>;
  geos: Record<string, BufferGeometry>;
  dispose: () => void;
};

export function buildEagleKit(): EagleKit {
  const std = (o: ConstructorParameters<typeof MeshStandardMaterial>[0]) => new MeshStandardMaterial({ roughness: 0.78, metalness: 0, ...o });
  const feat = (kind: Kind, seed: number, bump = 0.7) => {
    const map = paint(kind, seed);
    return std({ map, bumpMap: map, bumpScale: bump, side: DoubleSide });
  };
  const mats = {
    flight: feat('flight', 3),
    covert: feat('covert', 5),
    tail: feat('tail', 7),
    body: feat('body', 11, 1.4),
    nape: feat('nape', 13, 1.4),
    beak: std({ color: new Color('#26231f'), roughness: 0.35 }),
    cere: std({ color: new Color('#d9a92a'), roughness: 0.5 }),
    foot: std({ color: new Color('#d4a72c'), roughness: 0.6 }),
    talon: std({ color: new Color('#111010'), roughness: 0.3 }),
    eye: std({ color: new Color('#0c0807'), roughness: 0.08 }),
  };

  const geos: Record<string, BufferGeometry> = {};
  // Body: lathe profile (radius vs. length), rotated so its length runs along +Z
  const prof = [
    [0.0, -0.46], [0.045, -0.4], [0.1, -0.28], [0.15, -0.08], [0.175, 0.12], [0.16, 0.3], [0.115, 0.44], [0.07, 0.52], [0.0, 0.56],
  ].map(([r, y]) => new Vector2(r, y));
  geos.body = new LatheGeometry(prof, 20);
  geos.body.rotateX(Math.PI / 2);
  geos.body.scale(1, 0.9, 1.12);
  geos.head = new SphereGeometry(0.085, 18, 14);
  geos.head.scale(1, 0.95, 1.2);
  // Hooked beak: a cone bent downward at the tip
  const beak = new ConeGeometry(0.04, 0.16, 12, 6);
  beak.rotateX(Math.PI / 2);
  const bp = beak.getAttribute('position');
  for (let i = 0; i < bp.count; i++) {
    const z = bp.getZ(i);
    const t = Math.max(0, (z + 0.08) / 0.16);
    bp.setY(i, bp.getY(i) - 0.07 * t * t - 0.012);
    bp.setX(i, bp.getX(i) * (1 - 0.15 * t));
  }
  beak.computeVertexNormals();
  geos.beak = beak;
  geos.cere = new SphereGeometry(0.03, 10, 8);
  geos.eye = new SphereGeometry(0.014, 10, 8);
  geos.brow = new SphereGeometry(0.03, 10, 8);
  geos.thigh = new SphereGeometry(0.07, 12, 10);
  geos.toe = new CylinderGeometry(0.008, 0.011, 0.07, 6);
  geos.talon = new ConeGeometry(0.01, 0.045, 6);

  const f = (len: number, wid: number, o?: Parameters<typeof feather>[2]) => feather(len, wid, o);
  geos.primaries = f(0.74, 0.085, { curl: 0.12, notch: 0.9, round: 1.7 });
  geos.secondary = f(0.4, 0.105, { curl: 0.06 });
  geos.covert = f(0.17, 0.075, { curl: 0.1, round: 2.6 });
  geos.tailFeather = f(0.6, 0.12, { curl: 0.02, round: 3.4 });

  return {
    mats,
    geos,
    dispose() {
      Object.values(geos).forEach((x) => x.dispose());
      Object.values(mats).forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
    },
  };
}

const m4 = new Matrix4();
const place = (src: BufferGeometry, x: number, y: number, z: number, rotY: number, rotZ = 0, scale = 1) => {
  const g = src.clone();
  m4.makeRotationY(rotY);
  g.applyMatrix4(m4);
  if (rotZ) g.applyMatrix4(new Matrix4().makeRotationZ(rotZ));
  if (scale !== 1) g.scale(scale, scale, scale);
  g.translate(x, y, z);
  return g;
};

export type Eagle = {
  root: Group;
  /** phase advances with wingbeats; amp 0 = soaring, 1 = full flapping */
  update: (phase: number, amp: number, time: number, roll: number, climb: number) => void;
};

export function createEagle(kit: EagleKit, tone = 0): Eagle {
  const { mats, geos } = kit;
  const mat = (m: MeshStandardMaterial) => {
    if (!tone) return m;
    const c = m.clone();
    c.color.offsetHSL(0, 0, tone);
    return c;
  };
  const flightM = mat(mats.flight);
  const covertM = mat(mats.covert);
  const root = new Group();
  const body = new Group();
  root.add(body);

  body.add(new Mesh(geos.body, mats.body));
  // feathered thighs ("trousers")
  for (const s of [-1, 1]) {
    const th = new Mesh(geos.thigh, mats.covert);
    th.position.set(s * 0.09, -0.1, -0.2);
    th.scale.set(0.8, 1.1, 1.5);
    body.add(th);
    const foot = new Group();
    foot.position.set(s * 0.07, -0.2, -0.3);
    foot.rotation.x = 0.9; // legs trail behind the body in flight
    const toe = new Mesh(geos.toe, mats.foot);
    toe.position.y = -0.03;
    foot.add(toe);
    for (let k = -1; k <= 1; k++) {
      const t = new Mesh(geos.toe, mats.foot);
      t.position.set(k * 0.018, -0.075, 0.01);
      t.scale.setScalar(0.6);
      const claw = new Mesh(geos.talon, mats.talon);
      claw.position.set(k * 0.018, -0.12, 0.02);
      claw.rotation.x = Math.PI;
      foot.add(t, claw);
    }
    body.add(foot);
  }

  // head
  const head = new Group();
  head.position.set(0, 0.03, 0.55);
  body.add(head);
  head.add(new Mesh(geos.head, mats.body));
  const nape = new Mesh(geos.head, mats.nape);
  nape.scale.set(1.07, 1.02, 0.9);
  nape.position.set(0, 0.012, -0.03);
  head.add(nape);
  const beak = new Mesh(geos.beak, mats.beak);
  beak.position.set(0, -0.012, 0.15);
  head.add(beak);
  const cere = new Mesh(geos.cere, mats.cere);
  cere.position.set(0, 0.0, 0.1);
  cere.scale.set(1.1, 0.8, 1.3);
  head.add(cere);
  for (const s of [-1, 1]) {
    const eye = new Mesh(geos.eye, mats.eye);
    eye.position.set(s * 0.058, 0.026, 0.085);
    const brow = new Mesh(geos.brow, mats.body);
    brow.position.set(s * 0.05, 0.05, 0.08);
    brow.scale.set(1.1, 0.5, 1.5);
    head.add(eye, brow);
  }

  // tail: twelve feathers fanned
  const tail = new Group();
  tail.position.set(0, 0.0, -0.4);
  body.add(tail);
  const tailGeos: BufferGeometry[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i - 5.5) / 5.5;
    tailGeos.push(place(geos.tailFeather, 0, -0.004 * Math.abs(a), 0, Math.PI + a * 0.38, 0, 0.9 + 0.1 * (1 - Math.abs(a))));
  }
  tail.add(new Mesh(mergeGeometries(tailGeos)!, mats.tail));

  // wings
  type Wing = { sh: Object3D; el: Object3D; wr: Object3D; prim: Object3D[] };
  const wings: Wing[] = [];
  const rg = rnd(99);
  for (const s of [-1, 1]) {
    const wingRoot = new Group();
    wingRoot.position.set(s * 0.1, 0.05, 0.12);
    wingRoot.scale.x = s;
    body.add(wingRoot);

    const sh = new Group();
    wingRoot.add(sh);
    const upper: BufferGeometry[] = [];
    for (let i = 0; i < 6; i++) upper.push(place(geos.secondary, 0.05 + i * 0.06, 0, -0.03 - i * 0.004, Math.PI * 1.5 + 0.12 - i * 0.02, 0, 0.75));
    for (let row = 0; row < 3; row++)
      for (let i = 0; i < 7; i++)
        upper.push(place(geos.covert, 0.04 + i * 0.052, 0.012 + row * 0.006, 0.05 - row * 0.05, Math.PI * 1.5 + 0.1 * row, 0, 1.15 - row * 0.15));
    sh.add(new Mesh(mergeGeometries(upper)!, row3(covertM)));
    const sec: BufferGeometry[] = [];
    // (secondaries sit with the forearm so they follow the elbow)

    const el = new Group();
    el.position.x = 0.38;
    sh.add(el);
    for (let i = 0; i < 9; i++) {
      sec.push(place(geos.secondary, i * 0.04, 0, -0.04, Math.PI * 1.5 + 0.2 - i * 0.015, 0, 1 - i * 0.015));
    }
    for (let row = 0; row < 3; row++)
      for (let i = 0; i < 8; i++)
        sec.push(place(geos.covert, i * 0.045, 0.014 + row * 0.006, 0.06 - row * 0.05, Math.PI * 1.5 + 0.1 * row, 0, 1.2 - row * 0.18));
    const flightSec = new Mesh(mergeGeometries(sec.slice(0, 9))!, flightM);
    const covSec = new Mesh(mergeGeometries(sec.slice(9))!, covertM);
    el.add(flightSec, covSec);

    const wr = new Group();
    wr.position.x = 0.35;
    el.add(wr);
    const prim: Object3D[] = [];
    for (let i = 0; i < 10; i++) {
      const pv = new Group();
      // outermost primary points straight out; inner ones sweep progressively back
      const t = i / 9;
      pv.rotation.y = 0.12 - t * 0.78 + (rg() - 0.5) * 0.04;
      pv.position.z = 0.03 - t * 0.04;
      const len = 1 - Math.abs(0.12 - t) * 0.35 - (i === 0 ? 0.12 : 0);
      const fm = new Mesh(geos.primaries, flightM);
      fm.scale.setScalar(len);
      pv.add(fm);
      wr.add(pv);
      prim.push(pv);
    }
    const handCov: BufferGeometry[] = [];
    for (let row = 0; row < 3; row++)
      for (let i = 0; i < 6; i++) handCov.push(place(geos.covert, i * 0.05, 0.015 + row * 0.006, 0.06 - row * 0.05, Math.PI * 1.5 + 0.08 * row - 0.2, 0, 1.15 - row * 0.2));
    wr.add(new Mesh(mergeGeometries(handCov)!, covertM));
    wings.push({ sh, el, wr, prim });
  }

  function update(phase: number, amp: number, time: number, roll: number, climb: number) {
    const A = amp;
    const down = Math.sin(phase);
    const fold = Math.max(0, -Math.cos(phase));
    wings.forEach((w, i) => {
      const side = i === 0 ? -1 : 1;
      // banking tilts one wing up and the other down a little
      const bank = roll * 0.28 * -side;
      const soar = 0.11 + 0.035 * Math.sin(time * 0.9 + i);
      w.sh.rotation.z = soar * (1 - A) + (0.08 + A * 0.78 * down) + bank;
      w.sh.rotation.y = -0.05 - A * 0.05;
      w.el.rotation.z = A * 0.42 * Math.sin(phase - 0.8) - 0.03;
      w.el.rotation.y = 0.08 + A * 0.6 * fold;
      w.wr.rotation.z = A * 0.6 * Math.sin(phase - 1.7) + 0.05 * (1 - A);
      w.wr.rotation.y = -0.06 + A * 0.75 * fold;
      w.prim.forEach((p, k) => {
        // fingered tips lift when soaring and trail the beat when flapping
        p.rotation.z = (0.06 + k * 0.012) * (1 - A) + A * 0.14 * Math.sin(phase - 2.1 - k * 0.14) + 0.02 * Math.sin(time * 1.3 + k);
      });
    });
    tail.rotation.x = -0.05 - climb * 0.08 + 0.02 * Math.sin(time * 1.1);
    head.rotation.z = -roll * 0.45;
    head.rotation.x = 0.05 + climb * 0.05;
    body.rotation.x = -0.04 - climb * 0.05 + A * 0.04 * Math.cos(phase);
    body.position.y = A * 0.03 * Math.sin(phase + 0.4);
  }

  return { root, update };
}

// Per-wing coverts use the shared material; kept as a function to make the intent explicit.
function row3(m: MeshStandardMaterial) {
  return m;
}
