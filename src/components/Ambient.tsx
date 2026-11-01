import { useEffect, useRef } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

/** Gold scroll-progress line and a soft light that follows a mouse. Mouse and motion-safe only. */
export function Ambient() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = glow.current;
    if (!fine || calm || !el) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.translate = `${e.clientX}px ${e.clientY}px`;
        el.classList.toggle('is-link', !!(e.target as HTMLElement | null)?.closest?.('a,button,[role="button"],input'));
      });
    };
    const leave = () => (el.style.opacity = '0');
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <>
      <motion.div className="progress" style={{ scaleX }} aria-hidden="true" />
      <div ref={glow} className="cursorlight" aria-hidden="true" />
    </>
  );
}
