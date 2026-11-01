import { animate, motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Number that counts up the first time it scrolls into view. */
export function CountUp({ to, duration = 1.8 }: { to: number; duration?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [n, setN] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => controls.stop();
  }, [inView, reduce, to, duration]);
  return (
    <span ref={ref} aria-label={String(to)}>
      <span aria-hidden="true">{n}</span>
    </span>
  );
}

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Handwritten phrase that is "written" left to right when it scrolls into view. */
export function Handwriting({
  children,
  tone = 'gold',
  delay = 0,
  underline = false,
  immediate = false,
  className = '',
}: {
  children: ReactNode;
  tone?: 'gold' | 'violet' | 'white';
  delay?: number;
  underline?: boolean;
  /** Animate on mount instead of on scroll (used inside the hero). */
  immediate?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const trigger = immediate ? { animate: { clipPath: 'inset(-20% 0% -20% 0%)' } } : { whileInView: { clipPath: 'inset(-20% 0% -20% 0%)' }, viewport: { once: true, margin: '-10% 0px' } };
  return (
    <span className={`hand hand--${tone} ${className}`}>
      <motion.span
        className="hand__text"
        initial={reduce ? false : { clipPath: 'inset(-20% 100% -20% 0%)' }}
        transition={{ duration: 1.5, ease: [0.45, 0, 0.2, 1], delay }}
        {...(reduce ? {} : trigger)}
      >
        {children}
      </motion.span>
      {underline && (
        <svg className="hand__underline" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
          <motion.path
            d="M2 8 C 40 2, 80 11, 120 6 S 180 4, 198 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            {...(immediate ? { animate: { pathLength: 1 } } : { whileInView: { pathLength: 1 }, viewport: { once: true } })}
            transition={{ duration: 1, ease: EASE, delay: delay + 1.1 }}
          />
        </svg>
      )}
    </span>
  );
}

/** Scroll-triggered entrance. Used for editorial text blocks, not for every element. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className = '',
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'span';
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y, rotateX: 14, transformPerspective: 900 }}
      style={{ transformOrigin: '50% 100%' }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

/** Fine gold line that draws itself when it scrolls into view. */
export function GoldLine({ className = '', vertical = false }: { className?: string; vertical?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <svg
      className={`goldline ${vertical ? 'goldline--v' : ''} ${className}`}
      viewBox={vertical ? '0 0 2 100' : '0 0 100 2'}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <motion.path
        d={vertical ? 'M1 0 V100' : 'M0 1 H100'}
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: '-5% 0px' }}
        transition={{ duration: 1.4, ease: EASE }}
      />
    </svg>
  );
}
