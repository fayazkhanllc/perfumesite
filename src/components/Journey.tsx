import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { PRODUCTS, STAGES, productPath } from '../data/products';
import { formatPrice } from '../data/siteConfig';
import { ProductVisual } from './ProductVisual';
import { AddToBagButton } from './ProductCard';
import { EASE, Handwriting } from './Motion';

const SCENES = STAGES.length + 1; // welcome + five acts
const HUES = ['262 70% 22%', '282 62% 20%', '248 68% 24%', '300 50% 19%', '236 66% 20%'];

/** Full-screen guided walk through the five acts. Opens from a button; closes with Esc. */
export function JourneyButton({ className = 'btn btn--outline' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} aria-haspopup="dialog">
        BEGIN THE JOURNEY
      </button>
      <AnimatePresence>{open && <Journey onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

function Journey({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion();
  const [scene, setScene] = useState(0);
  const [dir, setDir] = useState(1);
  const [pick, setPick] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const lock = useRef(0);
  const swipe = useRef<number | null>(null);

  const go = useCallback((d: number) => {
    setScene((s) => {
      const n = Math.min(SCENES - 1, Math.max(0, s + d));
      if (n !== s) {
        setDir(d > 0 ? 1 : -1);
        setPick(0);
      }
      return n;
    });
  }, []);
  const jump = (n: number) => {
    setDir(n > scene ? 1 : -1);
    setPick(0);
    setScene(n);
  };

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    root.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, []);

  const stage = scene > 0 ? STAGES[scene - 1] : null;
  const bottles = stage ? PRODUCTS.filter((p) => p.stage === stage.id) : [];
  const chosen = bottles[pick];

  return (
    <motion.div
      ref={root}
      className="journey3d"
      role="dialog"
      aria-modal="true"
      aria-label="Guided fragrance journey"
      tabIndex={-1}
      style={{ ['--hue' as string]: HUES[Math.max(0, scene - 1)] }}
      initial={reduce ? false : { opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.6, ease: EASE }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
        else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(1);
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(-1);
      }}
      onWheel={(e) => {
        const now = Date.now();
        if (Math.abs(e.deltaY) < 30 || now - lock.current < 900) return;
        lock.current = now;
        go(e.deltaY > 0 ? 1 : -1);
      }}
      onPointerDown={(e) => {
        swipe.current = e.clientX;
      }}
      onPointerUp={(e) => {
        if (swipe.current == null) return;
        const dx = e.clientX - swipe.current;
        swipe.current = null;
        if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="journey3d__bg" aria-hidden="true" />
      <header className="journey3d__top">
        <span className="journey3d__brand">F FRAGRANCE</span>
        <button type="button" className="journey3d__close" onClick={onClose} aria-label="Close the journey">
          ✕
        </button>
      </header>

      <div className="journey3d__scene" aria-live="polite">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={scene}
            className="journey3d__panel"
            custom={dir}
            initial={reduce ? false : { opacity: 0, x: dir * 90, rotateY: dir * -14 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: dir * -90, rotateY: dir * 14 }}
            transition={{ duration: 0.65, ease: EASE }}
          >
            {!stage ? (
              <div className="journey3d__welcome">
                <p className="label label--gold">A GUIDED EXPERIENCE</p>
                <h2 className="display display--xl">WEAR YOUR AMBITION.</h2>
                <Handwriting immediate delay={0.4} underline>
                  Five acts. Twenty-five chapters. Find yours.
                </Handwriting>
                <button type="button" className="btn btn--gold" onClick={() => go(1)}>
                  ENTER ACT I
                </button>
                <p className="journey3d__hint">Arrow keys, scroll or swipe to move</p>
              </div>
            ) : (
              <div className="journey3d__act">
                <div className="journey3d__copy">
                  <p className="label label--gold">
                    {stage.act} · {bottles.length} FRAGRANCES
                  </p>
                  <h2 className="display display--lg">{stage.label}</h2>
                  <Handwriting immediate delay={0.3} underline>
                    {stage.annotation}
                  </Handwriting>
                  {chosen && (
                    <div className="journey3d__pick">
                      <p className="journey3d__no">{chosen.number} / 25</p>
                      <h3>{chosen.name}</h3>
                      <p className="journey3d__concept">{chosen.concept}</p>
                      {typeof chosen.price === 'number' && <p>{formatPrice(chosen.price)}</p>}
                      <div className="journey3d__actions">
                        <AddToBagButton product={chosen} className="btn btn--gold" />
                        <Link to={productPath(chosen)} className="btn btn--outline" onClick={onClose}>
                          VIEW FRAGRANCE
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                <ul className="journey3d__row" aria-label={`${stage.label} fragrances`}>
                  {bottles.map((p, i) => (
                    <li key={p.id} className={i === pick ? 'is-on' : ''} style={{ ['--i' as string]: i - pick }}>
                      <button type="button" onClick={() => setPick(i)} aria-pressed={i === pick} aria-label={p.name}>
                        <ProductVisual product={p} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="journey3d__nav">
        <button type="button" className="ring__arrow" onClick={() => go(-1)} disabled={scene === 0} aria-label="Previous act">
          ←
        </button>
        <ol className="journey3d__dots">
          {Array.from({ length: SCENES }, (_, i) => (
            <li key={i}>
              <button
                type="button"
                className={i === scene ? 'is-on' : ''}
                onClick={() => jump(i)}
                aria-label={i === 0 ? 'Welcome' : STAGES[i - 1].act}
                aria-current={i === scene}
              />
            </li>
          ))}
        </ol>
        <button type="button" className="ring__arrow" onClick={() => go(1)} disabled={scene === SCENES - 1} aria-label="Next act">
          →
        </button>
      </footer>
    </motion.div>
  );
}
