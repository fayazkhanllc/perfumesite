import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { siteConfig } from '../data/siteConfig';
import { ProductVisual } from './ProductVisual';
import { JourneyButton } from './Journey';
import { DepthDust } from './DepthDust';
import { EASE } from './Motion';

const LINES = ['Your scent.', 'Your story.', 'Your legacy.'];

/** Dried-flower sprigs: a thin stem with small gold buds. Fixed values, identical on every load. */
const SPRIGS = Array.from({ length: 9 }, (_, i) => {
  const lean = (i % 2 ? 1 : -1) * (6 + ((i * 7) % 14));
  const h = 110 + ((i * 37) % 90);
  return {
    x: 8 + i * 11 + ((i * 5) % 6),
    h,
    lean,
    delay: -((i * 1.7) % 7),
    buds: Array.from({ length: 6 }, (_, b) => ({
      t: 0.35 + b * 0.11,
      off: ((b * 53 + i * 29) % 15) - 7,
      r: 1.6 + ((b * 3 + i) % 3) * 0.7,
    })),
  };
});

function Sprigs() {
  return (
    <svg className="cine__sprigs" viewBox="0 0 120 260" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      {SPRIGS.map((s, i) => (
        <g key={i} className="cine__sprig" style={{ animationDelay: `${s.delay}s`, transformOrigin: `${s.x}px 260px` }}>
          <path d={`M${s.x} 260 Q ${s.x + s.lean * 0.4} ${260 - s.h * 0.5}, ${s.x + s.lean} ${260 - s.h}`} />
          {s.buds.map((b, k) => (
            <circle key={k} cx={s.x + s.lean * b.t + b.off} cy={260 - s.h * b.t - 6} r={b.r} />
          ))}
        </g>
      ))}
    </svg>
  );
}

function Stone({ side }: { side: 'l' | 'r' }) {
  return (
    <svg className={`cine__stone cine__stone--${side}`} viewBox="0 0 600 900" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id={`rock-${side}`} x="-10%" y="-6%" width="120%" height="112%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.02" numOctaves="5" seed={side === 'l' ? 4 : 11} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="46" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" seed={side === 'l' ? 9 : 3} result="h" />
          <feDiffuseLighting in="h" surfaceScale="8" diffuseConstant="1.15" lightingColor="#f0dcff" result="l">
            <feDistantLight azimuth="0" elevation="26" />
          </feDiffuseLighting>
          <feComposite in="l" in2="d" operator="in" result="lit" />
          <feComponentTransfer in="lit">
            <feFuncR type="linear" slope="0.2" />
            <feFuncG type="linear" slope="0.12" />
            <feFuncB type="linear" slope="0.34" />
          </feComponentTransfer>
        </filter>
      </defs>
      <path
        filter={`url(#rock-${side})`}
        fill="#2a1260"
        d="M0 900 L0 90 C70 40 170 70 225 140 C285 215 240 300 300 385 C352 455 305 560 350 645 C382 710 338 810 372 900 Z"
      />
    </svg>
  );
}

export function Hero({ ready }: { ready: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 90]);
  const fade = useTransform(scrollYProgress, [0, 0.8], reduce ? [1, 1] : [1, 0.2]);
  const show = ready || !!reduce;

  return (
    <section
      className="cine"
      ref={ref}
      aria-labelledby="hero-title"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== 'mouse' || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        ref.current.style.setProperty('--mx', String(((e.clientX - r.left) / r.width - 0.5) * 2));
        ref.current.style.setProperty('--my', String(((e.clientY - r.top) / r.height - 0.5) * 2));
      }}
      onPointerLeave={() => {
        ref.current?.style.setProperty('--mx', '0');
        ref.current?.style.setProperty('--my', '0');
      }}
    >
      <motion.div className="cine__world" style={{ y, opacity: fade }}>
        <div className="cine__sky" aria-hidden="true" />
        <span className="cine__glow" aria-hidden="true" />
        <span className="cine__beam" aria-hidden="true" />
        <Stone side="l" />
        <Stone side="r" />
        <DepthDust reduce={!!reduce} />

        <motion.div
          className="cine__bottle"
          initial={reduce ? false : { opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: show ? 1 : 0, y: show ? 0 : 40, scale: show ? 1 : 0.97 }}
          transition={{ duration: 1.6, ease: EASE, delay: 0.3 }}
        >
          <div className="cine__float">
            <ProductVisual
              src={siteConfig.heroImage}
              alt="F Fragrance MANIFEST, eau de parfum, 100 ml bottle"
              eager
              bare
              label="Hero photograph goes here"
            />
          </div>
        </motion.div>

        <div className="cine__flora cine__flora--l">
          <Sprigs />
        </div>
        <div className="cine__flora cine__flora--r">
          <Sprigs />
        </div>
        <span className="cine__floor" aria-hidden="true" />
      </motion.div>

      <div className="cine__ui">
        <motion.h1
          id="hero-title"
          className="cine__title"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: show ? 1 : 0, y: show ? 0 : 24 }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.9 }}
        >
          {LINES.map((l, i) => (
            <span key={l} className={i === 2 ? 'cine__gold' : undefined}>
              {l}
            </span>
          ))}
        </motion.h1>

        <motion.div
          className="cine__cta"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: show ? 1 : 0, y: show ? 0 : 16 }}
          transition={{ duration: 0.9, ease: EASE, delay: 1.3 }}
        >
          <Link to="/#collection" className="cine__pill">
            <i aria-hidden="true">↓</i>
            <span>Explore the collection</span>
          </Link>
        </motion.div>

        <motion.div
          className="cine__aside"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: show ? 1 : 0, y: show ? 0 : 16 }}
          transition={{ duration: 0.9, ease: EASE, delay: 1.5 }}
        >
          <p>Twenty-five fragrances. Twenty-five expressions of ambition. Discover the scent that speaks your language.</p>
          <div className="cine__links">
            <JourneyButton className="cine__link" />
            <Link to="/story" className="cine__link">
              OUR STORY
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
