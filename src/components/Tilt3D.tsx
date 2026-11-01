import { useRef, type CSSProperties, type ReactNode } from 'react';

/**
 * Pointer-driven 3D tilt with a moving light glare. Mouse only: touch and pen skip it,
 * and the CSS ignores it for reduced motion.
 */
export function Tilt3D({
  children,
  className = '',
  max = 9,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const set = (rx: number, ry: number, gx: number, gy: number, on: number) => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', `${rx}deg`);
    el.style.setProperty('--ry', `${ry}deg`);
    el.style.setProperty('--gx', `${gx}%`);
    el.style.setProperty('--gy', `${gy}%`);
    el.style.setProperty('--on', String(on));
  };

  return (
    <div
      ref={ref}
      className={`tilt ${className}`}
      style={{ '--rx': '0deg', '--ry': '0deg', '--gx': '50%', '--gy': '50%', '--on': 0 } as CSSProperties}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || !ref.current) return;
        const { clientX, clientY } = e;
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
          const r = ref.current!.getBoundingClientRect();
          const px = (clientX - r.left) / r.width;
          const py = (clientY - r.top) / r.height;
          set((0.5 - py) * max * 2, (px - 0.5) * max * 2, px * 100, py * 100, 1);
        });
      }}
      onPointerLeave={() => {
        cancelAnimationFrame(frame.current);
        set(0, 0, 50, 50, 0);
      }}
    >
      <div className="tilt__inner">
        {children}
        <span className="tilt__glare" aria-hidden="true" />
      </div>
    </div>
  );
}
