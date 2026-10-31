import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll } from 'motion/react';
import { PRODUCTS, STAGES, productPath } from '../data/products';
import { EASE, Handwriting, Reveal } from './Motion';

export function Timeline() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] });

  return (
    <section className="journey" aria-labelledby="journey-title">
      <div className="journey__inner">
        <header className="journey__head">
          <Reveal as="h2" className="display display--lg">
            <span id="journey-title">THE 25-CHAPTER JOURNEY</span>
          </Reveal>
          <Reveal as="p" className="lede" delay={0.1}>
            25 fragrances. 25 chapters. One extraordinary journey.
          </Reveal>
        </header>

        <div className="journey__track" ref={ref}>
          <div className="journey__rail" aria-hidden="true">
            <motion.span className="journey__rail-fill" style={{ scaleY: reduce ? 1 : scrollYProgress }} />
          </div>

          {STAGES.map((stage) => {
            const items = PRODUCTS.filter((p) => p.stage === stage.id);
            return (
              <article className="act" key={stage.id} aria-labelledby={`act-${stage.id}`}>
                <header className="act__head">
                  <span className="act__dot" aria-hidden="true" />
                  <p className="act__act">{stage.act}</p>
                  <h3 className="act__title" id={`act-${stage.id}`}>
                    {stage.label}
                  </h3>
                  <Handwriting className="act__hand" delay={0.2}>
                    {stage.annotation}
                  </Handwriting>
                </header>
                <ul className="act__list">
                  {items.map((p, i) => (
                    <motion.li
                      key={p.id}
                      initial={reduce ? false : { opacity: 0, x: 24 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-6% 0px' }}
                      transition={{ duration: 0.7, ease: EASE, delay: i * 0.05 }}
                    >
                      <Link to={productPath(p)} className="chapter">
                        <span className="chapter__num">{p.number}</span>
                        <span className="chapter__name">{p.name}</span>
                        <span className="chapter__concept">{p.concept}</span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
