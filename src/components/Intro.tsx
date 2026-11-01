import { useEffect } from 'react';
import { motion } from 'motion/react';
import { EASE } from './Motion';

/** Brief brand reveal. Auto-dismisses after ~2.8s; click, Skip, or Escape bypasses it. */
export function Intro({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(onDone, 2900);
    const onKey = (e: KeyboardEvent) => (e.key === 'Escape' || e.key === 'Enter') && onDone();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [onDone]);

  const letters = 'FRAGRANCE'.split('');
  return (
    <motion.div
      className="intro"
      role="dialog"
      aria-label="F Fragrance — Wear your ambition"
      initial={{ clipPath: 'inset(0 0 0% 0)' }}
      exit={{ clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 0.9, ease: EASE }}
      onClick={onDone}
    >
      <div className="intro__brand" aria-hidden="true">
        <motion.span
          className="intro__num"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: EASE }}
        >
          F
        </motion.span>
        <span className="intro__word">
          {letters.map((l, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.5 + i * 0.05 }}
            >
              {l}
            </motion.span>
          ))}
        </span>
      </div>
      <motion.p
        className="intro__slogan"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 1.3 }}
      >
        WEAR YOUR <em>AMBITION.</em>
      </motion.p>
      <motion.span
        className="intro__rule"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.1, ease: EASE, delay: 1.1 }}
      />
      <button
        type="button"
        className="intro__skip"
        onClick={(e) => {
          e.stopPropagation();
          onDone();
        }}
      >
        Skip
      </button>
    </motion.div>
  );
}
