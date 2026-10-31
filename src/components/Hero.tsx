import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { siteConfig } from '../data/siteConfig';
import { ProductVisual } from './ProductVisual';
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
    <section className="hero" ref={ref} aria-labelledby="hero-title">
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
          <div className="hero__float">
            <ProductVisual
              src={siteConfig.heroImage}
              alt="A 25 Fragrance bottle"
              eager
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
        </motion.div>
      </div>
    </section>
  );
}
