import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { FINDER_OPTIONS, getProduct, productPath } from '../data/products';
import { EASE, Reveal } from './Motion';

export function Finder() {
  const reduce = useReducedMotion();
  const [choice, setChoice] = useState<string | null>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const firstOption = useRef<HTMLButtonElement>(null);
  const selected = FINDER_OPTIONS.find((o) => o.id === choice);
  const picks = selected ? selected.picks.flatMap((s) => getProduct(s) ?? []) : [];

  useEffect(() => {
    if (selected) resultsHeading.current?.focus({ preventScroll: true });
  }, [selected]);

  const restart = () => {
    setChoice(null);
    window.setTimeout(() => firstOption.current?.focus({ preventScroll: true }), 50);
  };

  return (
    <section id="finder" className="finder" aria-labelledby="finder-title">
      <div className="finder__inner">
        <header className="finder__head">
          <Reveal as="h2" className="display display--lg">
            <span id="finder-title">WHICH CHAPTER ARE YOU IN?</span>
          </Reveal>
          <Reveal as="p" className="lede" delay={0.1}>
            Every journey is different. Find the fragrance that represents yours.
          </Reveal>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          {!selected ? (
            <motion.div
              key="options"
              role="radiogroup"
              aria-label="Choose the chapter you are in"
              className="finder__options"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {FINDER_OPTIONS.map((o, i) => (
                <button
                  key={o.id}
                  ref={i === 0 ? firstOption : undefined}
                  type="button"
                  role="radio"
                  aria-checked={choice === o.id}
                  className="finder__option"
                  onClick={() => setChoice(o.id)}
                >
                  <span className="finder__idx" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="finder__label">{o.label}</span>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              className="finder__results"
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <p className="finder__chosen">{selected.label}</p>
              <h3 className="finder__rec" tabIndex={-1} ref={resultsHeading}>
                Your chapter{picks.length > 1 ? 's' : ''}
              </h3>
              <ul className="finder__picks">
                {picks.map((p, i) => (
                  <motion.li
                    key={p.id}
                    initial={reduce ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: EASE, delay: 0.15 + i * 0.1 }}
                  >
                    <Link to={productPath(p)} className="pick">
                      <span className="pick__num">{p.number}</span>
                      <span className="pick__name">{p.name}</span>
                      <span className="pick__concept">{p.concept}</span>
                      <span className="pick__go">View fragrance</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <button type="button" className="btn btn--outline" onClick={restart}>
                Start again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
