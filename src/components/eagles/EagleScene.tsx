import { useEffect, useRef } from 'react';
import {
  AnimationMixer,
  Box3,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  Object3D,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  type AnimationClip,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { buildEagleKit, createEagle, type Eagle, type EagleKit } from './eagleModel';
import { CONFIG, makeFlock, newFlockState, stepFlock, type Inputs } from './flight';

/**
 * MODEL SOURCES
 *  1. /models/eagle.glb — if you add a rigged, animated eagle here it is used automatically
 *     (its first animation clip is played and sped up or slowed down with the flight effort).
 *  2. Otherwise a procedural golden eagle is built in code (see eagleModel.ts): layered feathers on
 *     a jointed wing, fanned tail, hooked beak and talons.
 */
const EAGLE_URL = '/models/eagle.glb';
/** Rotates a loaded GLB so its beak points along +Z. Not used by the procedural eagle. */
const MODEL_YAW = 0;

type Loaded =
  | { kind: 'glb'; scene: Object3D; clip: AnimationClip | null }
  | { kind: 'photo'; tex: Texture }
  | { kind: 'procedural' };

/** Real bald-eagle photograph (background removed). Drawn as a bending, banking sprite in the 3D scene. */
const PHOTO_URL = '/images/eagle.webp';

async function loadModel(): Promise<Loaded> {
  try {
    const head = await fetch(EAGLE_URL, { method: 'HEAD' });
    const type = head.headers.get('content-type') ?? '';
    if (head.ok && !type.includes('html')) {
      const g = await new GLTFLoader().loadAsync(EAGLE_URL);
      return { kind: 'glb', scene: g.scene, clip: g.animations[0] ?? null };
    }
  } catch {
    /* fall through to the photograph */
  }
  try {
    const tex = await new TextureLoader().loadAsync(PHOTO_URL);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 4;
    return { kind: 'photo', tex };
  } catch {
    console.warn(`[eagles] ${PHOTO_URL} missing; using the procedural eagle.`);
    return { kind: 'procedural' };
  }
}

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function EagleScene() {
  const host = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = host.current;
    if (!canvas || !webglAvailable()) return;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: !coarse, powerPreference: 'high-performance' });
    } catch (err) {
      console.warn('[eagles] WebGL failed, continuing without the 3D flock.', err);
      return;
    }
    let pixelRatio = Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.75);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);

    const scene = new Scene();
    const camera = new PerspectiveCamera(CONFIG.fov, 1, 0.1, 80);
    scene.add(new HemisphereLight(new Color('#e6d4ff'), new Color('#3a1b78'), 1.5));
    const key = new DirectionalLight(new Color('#ffe2b0'), 3.4);
    key.position.set(-4, 6, 3);
    scene.add(key);
    const rim = new DirectionalLight(new Color('#b69cff'), 1.2);
    rim.position.set(5, 2, -4);
    scene.add(rim);

    const inputs: Inputs = { mx: 0, my: 0, scroll: 0, scrollVel: 0, calm };
    let rawX = 0;
    let rawY = 0;
    let lastScroll = window.scrollY;
    let scrollVelRaw = 0;
    let aspect = 1;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      aspect = w / h;
      renderer.setSize(w, h, false);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    };
    const onPointer = (e: PointerEvent) => {
      const k = e.pointerType === 'mouse' ? 1 : 0.5; // touch steers gently
      rawX = ((e.clientX / window.innerWidth) * 2 - 1) * k;
      rawY = -((e.clientY / window.innerHeight) * 2 - 1) * k;
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      inputs.scroll = max > 0 ? window.scrollY / max : 0;
    };
    resize();
    onScroll();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    const group = new Group();
    scene.add(group);
    const disposables: { dispose: () => void }[] = [];
    let raf = 0;
    let stopped = false;
    let hidden = document.hidden;

    const onVis = () => {
      hidden = document.hidden;
      if (!hidden && !stopped) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    let last = performance.now();
    let frame: (now: number) => void = () => {};

    loadModel()
      .then((loaded) => {
        if (stopped) return;
        canvas.dataset.model = `eagle-${loaded.kind}`;
        const flock = makeFlock(coarse ? CONFIG.supportMobile : CONFIG.supportDesktop);
        type Rig = { holder: Group; bird: (typeof flock)[number]; step: (dt: number) => void };
        let rigs: Rig[] = [];
        let kit: EagleKit | null = null;

        if (loaded.kind === 'photo') {
          const tex = loaded.tex;
          const img = tex.image as { width: number; height: number };
          const W = CONFIG.primarySpan * 1.12;
          const H = (W * img.height) / img.width;
          // Hinge at the eagle's shoulders (measured on the photo): wings above it bend when flapping.
          const hx = (0.4 - 0.5) * W;
          const hy = (0.5 - 0.8) * H;
          const hMax = H / 2 - hy;
          disposables.push({ dispose: () => tex.dispose() });
          rigs = flock.map((bird, i) => {
            const geo = new PlaneGeometry(W, H, 36, 20);
            const pos = geo.getAttribute('position');
            const base = new Float32Array(pos.array as Float32Array);
            const mat = new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, alphaTest: 0.02 });
            disposables.push(geo, mat);
            const mesh = new Mesh(geo, mat);
            mesh.frustumCulled = false;
            const holder = new Group();
            holder.add(mesh);
            holder.visible = false;
            group.add(holder);
            let phase = i * 2.3;
            let time = i * 7;
            let face = i % 2 ? -1 : 1; // 1 = faces left like the photo, -1 = mirrored
            let faceTarget = face;
            return {
              holder,
              bird,
              step: (dt: number) => {
                const amp = Math.min(1, Math.max(0, (bird.flap - 0.28) / 0.85));
                phase += dt * (3.2 + amp * 3.4) * (0.9 + bird.speedMul * 0.1) * (calm ? 0.5 : 1);
                time += dt;
                // flap: the wing portion above the shoulder swings through the stroke, tips lagging behind
                for (let v = 0; v < pos.count; v++) {
                  const x0 = base[v * 3];
                  const y0 = base[v * 3 + 1];
                  const h = y0 - hy;
                  if (h <= 0) continue;
                  const k = Math.min(1, h / hMax);
                  const w = k * k * (3 - 2 * k);
                  const s = Math.max(-0.18, Math.cos(phase - 1.15 * k));
                  const f = 1 - amp * (1 - s) * w; // 1 = held up like the photo
                  const soar = 0.015 * Math.sin(time * 0.9 + k * 2) * (1 - amp);
                  pos.setXYZ(v, hx + (x0 - hx) * (1 - 0.16 * amp * (1 - s) * w), hy + h * f + soar, 0);
                }
                pos.needsUpdate = true;
                // turn to face the direction of travel; the flip passes through edge-on, like a real turn
                const vx = bird.vel.x;
                if (Math.abs(vx) > 0.3) faceTarget = vx > 0 ? -1 : 1;
                face += (faceTarget - face) * Math.min(1, dt * 2.6);
                holder.scale.x = Math.abs(face) < 0.06 ? 0.06 * Math.sign(face || 1) : face;
                const sign = -Math.sign(face || 1);
                const pitch = Math.atan2(bird.vel.y, Math.max(0.4, Math.abs(vx)));
                holder.rotation.z = sign * pitch * 0.55;
                holder.rotation.x = bird.roll * 0.3;
                holder.rotation.y = sign * 0.25 * Math.sin(time * 0.4 + i);
                // distance haze: far birds soften into the violet
                const d = Math.abs(bird.pos.z);
                const haze = Math.min(0.55, Math.max(0, (d - 6) / 14));
                mat.color.setRGB(1 - haze * 0.25, 1 - haze * 0.4, 1 - haze * 0.05);
                mat.opacity = 1 - haze * 0.35;
              },
            };
          });
        } else if (loaded.kind === 'procedural') {
          kit = buildEagleKit();
          const k = kit;
          disposables.push({ dispose: () => k.dispose() });
          rigs = flock.map((bird, i) => {
            const eagle: Eagle = createEagle(k, (i % 3 === 1 ? 0.03 : 0) + (i % 2) * 0.015);
            const holder = new Group();
            eagle.root.scale.setScalar(bird.scale);
            holder.add(eagle.root);
            holder.visible = false;
            group.add(holder);
            let phase = i * 2.1;
            let time = i * 5;
            return {
              holder,
              bird,
              step: (dt: number) => {
                const amp = Math.min(1, Math.max(0, (bird.flap - 0.28) / 0.85));
                // wingbeat rate rises with effort, so the bird glides, then labours, then glides again
                phase += dt * (4.2 + amp * 4.2) * (0.9 + bird.speedMul * 0.1) * (calm ? 0.5 : 1);
                time += dt;
                eagle.update(phase, amp, time, bird.roll, Math.max(-1, Math.min(1, bird.vel.y)));
              },
            };
          });
        } else {
          const model = loaded.scene;
          const clip = loaded.clip;
          const box = new Box3().setFromObject(model);
          const size = box.getSize(new Vector3());
          const centre = box.getCenter(new Vector3());
          const norm = CONFIG.primarySpan / (Math.max(size.x, size.z) || 1);
          rigs = flock.map((bird, i) => {
            const holder = new Group();
            const inner = cloneSkinned(model) as Object3D;
            inner.position.set(-centre.x, -centre.y, -centre.z);
            const wrap = new Group();
            wrap.add(inner);
            wrap.scale.setScalar(norm * bird.scale);
            wrap.rotation.y = MODEL_YAW;
            holder.add(wrap);
            holder.visible = false;
            group.add(holder);
            inner.traverse((o) => {
              const m = o as Mesh;
              if (m.isMesh) m.frustumCulled = false;
            });
            let mixer: AnimationMixer | null = null;
            if (clip) {
              mixer = new AnimationMixer(inner);
              const action = mixer.clipAction(clip);
              action.play();
              action.time = (i * 0.37) % clip.duration;
            }
            return { holder, bird, step: (dt: number) => mixer?.update(dt * bird.flap * bird.speedMul * (calm ? 0.5 : 1)) };
          });
        }

        const state = newFlockState();
        const t0 = performance.now();
        let fpsAcc = 0;
        let fpsN = 0;
        let checked = 0;

        frame = (now: number) => {
          if (stopped || hidden) return;
          raf = requestAnimationFrame(frame);
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;

          // damped inputs: the flock reacts a moment after the pointer
          const k = 1 - Math.exp(-1.6 * dt);
          inputs.mx += (rawX - inputs.mx) * k;
          inputs.my += (rawY - inputs.my) * k;
          const sv = (window.scrollY - lastScroll) / Math.max(dt, 0.001);
          lastScroll = window.scrollY;
          scrollVelRaw += (sv - scrollVelRaw) * (1 - Math.exp(-4 * dt));
          inputs.scrollVel = scrollVelRaw;

          stepFlock(flock, state, dt, aspect, inputs);

          // gentle camera parallax
          if (!calm) {
            camera.position.x += (inputs.mx * 0.25 - camera.position.x) * k;
            camera.position.y += (inputs.my * 0.15 - camera.position.y) * k;
          }
          camera.lookAt(0, 0, -8);

          for (const r of rigs) {
            const b = r.bird;
            r.holder.position.set(b.pos.x, b.pos.y, b.pos.z);
            if (loaded.kind !== 'photo') {
              r.holder.lookAt(b.pos.x + b.fwd.x, b.pos.y + b.fwd.y, b.pos.z + b.fwd.z);
              r.holder.rotateZ(b.roll);
            }
            r.holder.visible = true;
            r.step(dt);
          }
          renderer.render(scene, camera);

          // soft entrance, and adaptive quality
          const age = (now - t0) / 1000;
          canvas.style.opacity = String(Math.min(1, age / 3));
          fpsAcc += dt;
          fpsN++;
          if (age > 3 && age - checked > 3 && checked < 9) {
            checked = age;
            const fps = fpsN / fpsAcc;
            fpsAcc = 0;
            fpsN = 0;
            if (fps < 32 && pixelRatio > 1) {
              pixelRatio = 1;
              renderer.setPixelRatio(1);
              resize();
            } else if (fps < 24) {
              rigs.slice(3).forEach((r) => { r.holder.visible = false; r.bird.scale = 0; });
              if (fps < 14) {
                stopped = true; // too slow: step aside and leave the site untouched
                canvas.style.display = 'none';
              }
            }
          }
        };
        last = performance.now();
        raf = requestAnimationFrame(frame);
      })
      .catch((err) => {
        console.warn('[eagles] could not load any 3D bird model; the site continues without the flock.', err);
        canvas.style.display = 'none';
      });

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      disposables.forEach((d) => d.dispose());
      scene.traverse((o) => {
        const m = o as Mesh;
        if (m.isMesh) m.geometry?.dispose();
      });
      renderer.dispose();
    };
  }, []);

  return <canvas ref={host} className="eagles" aria-hidden="true" />;
}
