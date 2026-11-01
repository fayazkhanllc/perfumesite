import { useEffect, useRef } from 'react';

type P = { x: number; y: number; z: number; v: number; ph: number };

/**
 * Golden dust at several depths. Near particles are larger, brighter and move more with
 * the pointer, which gives the hero real parallax depth. Pauses when off-screen.
 * Renders nothing for reduced motion.
 */
export function DepthDust({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || reduce) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let parts: P[] = [];

    // seeded so the field is the same on every load
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 700 ? 34 : 64;
      seed = 7;
      parts = Array.from({ length: count }, () => ({
        x: rnd() * w,
        y: rnd() * h,
        z: 0.15 + rnd() * 0.85,
        v: 4 + rnd() * 12,
        ph: rnd() * Math.PI * 2,
      }));
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = canvas.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };

    let last = performance.now();
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) {
        last = now;
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.v * p.z * dt;
        p.ph += dt * (0.6 + p.z);
        if (p.y < -10) {
          p.y = h + 10;
          p.x = rnd() * w;
        }
        const x = p.x + Math.sin(p.ph) * 14 * p.z - cx * 46 * p.z;
        const y = p.y - cy * 30 * p.z;
        const r = 0.6 + p.z * 2.4;
        const a = (0.18 + p.z * 0.6) * (0.65 + 0.35 * Math.sin(p.ph * 2.1));
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
        g.addColorStop(0, `rgba(255, 244, 214, ${a})`);
        g.addColorStop(0.35, `rgba(232, 214, 165, ${a * 0.55})`);
        g.addColorStop(1, 'rgba(232, 214, 165, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(canvas);
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduce]);

  if (reduce) return null;
  return <canvas ref={ref} className="hero__dust" aria-hidden="true" />;
}
