import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FILTERS, PRODUCTS, type StageId } from '../data/products';
import { ProductCard } from './ProductCard';
import { CountUp, Handwriting, Reveal } from './Motion';

export function Collection({ heading = true }: { heading?: boolean }) {
  const [filter, setFilter] = useState<'all' | StageId>('all');
  const items = filter === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.stage === filter);
  const active = FILTERS.find((f) => f.id === filter)!;

  return (
    <section id="collection" className="collection" aria-labelledby="collection-title">
      <div className="collection__inner">
        {heading && (
          <header className="collection__head">
            <Reveal as="h2" className="display display--lg">
              <span id="collection-title">25 SCENTS. 25 MINDSETS.</span>
            </Reveal>
            <Reveal as="p" className="lede" delay={0.12}>
              From the first dream to an unforgettable legacy, discover a fragrance for every chapter of your journey.
            </Reveal>
            <Handwriting className="collection__hand" delay={0.4} underline>
              Which chapter is yours?
            </Handwriting>
            <ul className="facts">
              <li>
                <strong><CountUp to={25} /></strong>
                <span>Fragrances</span>
              </li>
              <li>
                <strong><CountUp to={5} duration={1.2} /></strong>
                <span>Acts</span>
              </li>
              <li>
                <strong><CountUp to={1} duration={0.8} /></strong>
                <span>Journey</span>
              </li>
            </ul>
          </header>
        )}

        <div className="filters" role="group" aria-label="Filter fragrances by chapter">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`filters__btn ${filter === f.id ? 'is-active' : ''}`}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="filters__count" aria-live="polite">
          Showing {items.length} of {PRODUCTS.length} — {active.label.charAt(0) + active.label.slice(1).toLowerCase()}
        </p>

        <motion.div className="grid" layout="position">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} wide={i % 5 === 0} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
