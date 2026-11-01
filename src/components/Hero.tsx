import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { siteConfig } from '../data/siteConfig';
import { ProductVisual } from './ProductVisual';
import { DepthDust } from './DepthDust';
import { EASE, Handwriting } from './Motion';

const LINES = ['YOUR STORY.', 'YOUR SCENT.', 'YOUR LEGACY.'];

export function Hero({ ready }: { ready: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 70]);
  const glowX = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-6%', '8%']);

  const show = ready || !!reduce;
  return (
    <section
      className="hero"
      ref={ref}
      aria-labelledby="hero-title"
      onPointerMove={(e) => {
        // Gentle depth that follows a mouse. Skipped for touch/pen and reduced motion.
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
      <div className="hero__sky" aria-hidden="true">
        <span className="hero__rays" />
        <span className="hero__mist hero__mist--a" />
        <span className="hero__mist hero__mist--b" />
        <DepthDust reduce={!!reduce} />
      </div>
      <span className="hero__ghost" aria-hidden="true">
        F
      </span>
      <motion.span className="hero__light" style={{ x: glowX }} aria-hidden="true" />
      <div className="hero__inner">
        <div className="hero__copy">
          <motion.p
            className="label"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: show ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            THE ART OF AMBITION
          </motion.p>
          <h1 id="hero-title" className="hero__title">
            {LINES.map((line, i) => (
              <span className="hero__line" key={line}>
                <motion.span
                  className={i === 2 ? 'hero__line-inner hero__line-inner--gold' : 'hero__line-inner'}
                  initial={reduce ? false : { y: '110%' }}
                  animate={{ y: show ? '0%' : '110%' }}
                  transition={{ duration: 1.1, ease: EASE, delay: 0.25 + i * 0.18 }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            className="hero__text"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: show ? 1 : 0, y: show ? 0 : 16 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.95 }}
          >
            Twenty-five fragrances. Twenty-five expressions of ambition. Discover the scent that speaks your language.
          </motion.p>
          <motion.div
            className="hero__cta"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: show ? 1 : 0, y: show ? 0 : 16 }}
            transition={{ duration: 0.9, ease: EASE, delay: 1.1 }}
          >
            <Link to="/#collection" className="btn btn--gold">
              EXPLORE THE COLLECTION
            </Link>
            <Link to="/story" className="btn btn--outline">
              OUR STORY
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="hero__visual"
          style={{ y }}
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.96 }}
          transition={{ duration: 1.4, ease: EASE, delay: 0.4 }}
        >
          <div className="hero__stage">
          <span className="hero__halo" aria-hidden="true" />
          <svg className="hero__wisps" viewBox="0 0 200 300" aria-hidden="true">
            <defs>
              <linearGradient id="wisp-grad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#f3e6ff" stopOpacity="0.95" />
                <stop offset="1" stopColor="#e8d6a5" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className="wisp wisp--1" pathLength="1" d="M100 300 C 52 240, 150 200, 100 150 S 56 62, 112 0" />
            <path className="wisp wisp--2" pathLength="1" d="M92 300 C 140 250, 40 190, 96 140 S 150 50, 90 0" />
            <path className="wisp wisp--3" pathLength="1" d="M110 300 C 80 250, 130 170, 108 120 S 70 40, 120 0" />
          </svg>
          <div className="hero__float">
            <ProductVisual
              src={siteConfig.heroImage}
              alt="F Fragrance MANIFEST, eau de parfum, 100 ml bottle"
              eager
              bare
              label="Hero photograph goes here"
            />
          </div>
          <span className="hero__note">
            {show && (
              <Handwriting immediate delay={1.5} underline>
                Write your own story.
              </Handwriting>
            )}
          </span>
          </div>
        </motion.div>
      </div>
      <Link to="/#collection" className="hero__scroll" aria-label="Scroll to the collection">
        <span>SCROLL</span>
        <i aria-hidden="true" />
      </Link>
    </section>
  );
}
