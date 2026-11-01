import { useCallback, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { animate, useMotionValue, useMotionValueEvent, motion, useReducedMotion } from 'motion/react';
import { PRODUCTS, STAGES, productPath } from '../data/products';
import { formatPrice } from '../data/siteConfig';
import { ProductVisual } from './ProductVisual';
import { AddToBagButton } from './ProductCard';
import { Handwriting, Reveal } from './Motion';

const N = PRODUCTS.length;
const STEP = 360 / N;
const mod = (n: number) => ((n % N) + N) % N;

/** All 25 bottles on a ring you can drag, swipe, or step through with the arrows. */
export function Carousel3D() {
  const reduce = useReducedMotion();
  const rot = useMotionValue(0);
  const [active, setActive] = useState(0);
  const drag = useRef<{ x: number; start: number; moved: number; lastX: number; v: number } | null>(null);
  const target = useRef(0); // integer step the ring is settling on
  const [dragging, setDragging] = useState(false);

  useMotionValueEvent(rot, 'change', (v) => {
    const next = mod(Math.round(-v / STEP));
    setActive((cur) => (cur === next ? cur : next));
  });

  const goTo = useCallback(
    (k: number) => {
      target.current = k;
      animate(rot, -k * STEP, reduce ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 18, mass: 0.9 });
    },
    [rot, reduce],
  );
  const step = (d: number) => goTo(target.current + d);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      step(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      step(-1);
    }
  };

  const product = PRODUCTS[active];

  return (
    <section className="ring" aria-labelledby="ring-title">
      <div className="ring__head">
        <p className="label label--gold">THE 3D SHOWCASE</p>
        <Reveal as="h2" className="display display--lg">
          <span id="ring-title">TURN THE WHOLE COLLECTION.</span>
        </Reveal>
        <Handwriting className="ring__hand" delay={0.3} underline>
          Drag. Spin. Choose your chapter.
        </Handwriting>
      </div>

      <div
        className={`ring__stage ${dragging ? 'is-dragging' : ''}`}
        role="group"
        aria-roledescription="carousel"
        aria-label="Rotating showcase of all 25 fragrances. Use the left and right arrow keys."
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, start: rot.get(), moved: 0, lastX: e.clientX, v: 0 };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const dx = e.clientX - d.x;
          d.moved = Math.max(d.moved, Math.abs(dx));
          if (d.moved > 6 && !dragging) {
            setDragging(true);
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          }
          if (d.moved > 6) {
            d.v = e.clientX - d.lastX;
            d.lastX = e.clientX;
            rot.stop();
            rot.set(d.start + dx * 0.22);
          }
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          if (!d || d.moved <= 6) return;
          setDragging(false);
          goTo(Math.round(-(rot.get() + d.v * 0.9) / STEP));
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
          goTo(Math.round(-rot.get() / STEP));
        }}
        onClickCapture={(e) => {
          // a drag must not count as a click on a bottle
          if (dragging || (drag.current && drag.current.moved > 6)) e.stopPropagation();
        }}
      >
        <span className="ring__glow" aria-hidden="true" />
        <span className="ring__floor" aria-hidden="true" />
        <div className="ring__depth">
          <motion.div className="ring__ring" style={{ rotateY: rot }}>
            {PRODUCTS.map((p, i) => {
              const d = Math.min(mod(i - active), mod(active - i));
              const isActive = d === 0;
              return (
                <div
                  key={p.id}
                  className={`ring__item ${isActive ? 'is-active' : ''}`}
                  style={
                    {
                      '--a': `${i * STEP}deg`,
                      opacity: isActive ? 1 : Math.max(0.28, 1 - d * 0.1),
                    } as CSSProperties
                  }
                >
                  <button
                    type="button"
                    className="ring__bottle"
                    aria-label={isActive ? `${p.name}, selected` : `Bring ${p.name} to the front`}
                    tabIndex={-1}
                    onClick={() => {
                      const delta = mod(i - target.current);
                      goTo(target.current + (delta > N / 2 ? delta - N : delta));
                    }}
                  >
                    <ProductVisual product={p} />
                  </button>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>

      <div className="ring__controls">
        <button type="button" className="ring__arrow" onClick={() => step(-1)} aria-label="Previous fragrance">
          ←
        </button>
        <div className="ring__info" aria-live="polite">
          <p className="ring__count">
            {product.number} / {N} · {STAGES.find((s) => s.id === product.stage)?.label}
          </p>
          <h3 className="ring__name">{product.name}</h3>
          <p className="ring__concept">{product.concept}</p>
          {typeof product.price === 'number' && <p className="ring__price">{formatPrice(product.price)}</p>}
          <div className="ring__actions">
            <Link to={productPath(product)} className="btn btn--gold">
              VIEW FRAGRANCE
            </Link>
            <AddToBagButton product={product} className="btn btn--outline" />
          </div>
        </div>
        <button type="button" className="ring__arrow" onClick={() => step(1)} aria-label="Next fragrance">
          →
        </button>
      </div>
    </section>
  );
}
