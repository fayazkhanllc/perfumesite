import { useEffect, useRef } from 'react';
import {
  AnimationMixer,
  Box3,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  type AnimationClip,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { CONFIG, makeFlock, newFlockState, stepFlock, type Inputs } from './flight';

/**
 * ASSET CONTRACT
 *  - Real model (preferred): /models/eagle.glb — a rigged, animated eagle with a flight clip
 *    (any clip name works; the first clip is played and its speed is blended between glide and flap).
 *  - Until that file exists the renderer loads /models/stand-in-stork.glb, a free low-poly
 *    animated bird from the three.js examples. It is NOT an eagle and is only a temporary stand-in.
 */
const EAGLE_URL = '/models/eagle.glb';
const STAND_IN_URL = '/models/stand-in-stork.glb';
/** Rotates the model so its beak points along +Z. Change this for a different model. */
const MODEL_YAW = 0;

type Loaded = { scene: Object3D; clip: AnimationClip | null; standIn: boolean };

async function loadModel(): Promise<Loaded> {
  const loader = new GLTFLoader();
  try {
    const head = await fetch(EAGLE_URL, { method: 'HEAD' });
    const type = head.headers.get('content-type') ?? '';
    if (head.ok && !type.includes('html')) {
      const g = await loader.loadAsync(EAGLE_URL);
      return { scene: g.scene, clip: g.animations[0] ?? null, standIn: false };
    }
  } catch {
    /* fall through to the stand-in */
  }
  console.warn(
    `[eagles] ${EAGLE_URL} not found. Add a rigged, animated eagle GLB there (with at least one flight clip). Using the temporary stand-in bird ${STAND_IN_URL}.`,
  );
  const g = await loader.loadAsync(STAND_IN_URL);
  return { scene: g.scene, clip: g.animations[0] ?? null, standIn: true };
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
    scene.add(new HemisphereLight(new Color('#e6d4ff'), new Color('#3a1b78'), 1.15));
    const key = new DirectionalLight(new Color('#ffe2b0'), 2.6);
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
      .then(({ scene: model, clip, standIn }) => {
        if (stopped) return;
        canvas.dataset.model = standIn ? 'stand-in' : 'eagle';
        // Normalise: centre, and scale so the wingspan is CONFIG.primarySpan world units.
        const box = new Box3().setFromObject(model);
        const size = box.getSize(new Vector3());
        const centre = box.getCenter(new Vector3());
        const span = Math.max(size.x, size.z) || 1;
        const norm = CONFIG.primarySpan / span;

        // The stand-in ships without normals; without them it renders as a black silhouette.
        model.traverse((o) => {
          const m = o as Mesh;
          if (m.isMesh && !m.geometry.getAttribute('normal')) m.geometry.computeVertexNormals();
        });

        const flock = makeFlock(coarse ? CONFIG.supportMobile : CONFIG.supportDesktop);
        const mats: MeshStandardMaterial[] = [];
        const rigs = flock.map((bird, i) => {
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
            if (!m.isMesh) return;
            const src = m.material as MeshStandardMaterial;
            // Warm brown wash over the model's own colours; shared look, slight per-bird variation.
            const mat = new MeshStandardMaterial({
              vertexColors: false,
              map: src.map ?? null,
              color: new Color().setHSL(0.075 + (i % 3) * 0.008, 0.45, 0.24 + (i % 2) * 0.04),
              roughness: 0.72,
              side: DoubleSide,
              metalness: 0,
            });
            m.material = mat;
            m.frustumCulled = false;
            mats.push(mat);
          });
          disposables.push(...mats);

          let mixer: AnimationMixer | null = null;
          if (clip) {
            mixer = new AnimationMixer(inner);
            const action = mixer.clipAction(clip);
            action.play();
            action.time = (i * 0.37) % clip.duration; // out of sync
          }
          return { holder, mixer, bird };
        });

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
            r.holder.lookAt(b.pos.x + b.fwd.x, b.pos.y + b.fwd.y, b.pos.z + b.fwd.z);
            r.holder.rotateZ(b.roll);
            r.holder.visible = true;
            if (r.mixer) r.mixer.update(dt * b.flap * b.speedMul * (calm ? 0.5 : 1));
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
              rigs.slice(3).forEach((r) => (r.holder.visible = false, (r.bird.scale = 0)));
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
