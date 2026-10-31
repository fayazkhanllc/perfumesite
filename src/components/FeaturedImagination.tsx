import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { getProduct, productPath } from '../data/products';
import { ProductVisual } from './ProductVisual';
import { GoldLine, Handwriting, Reveal } from './Motion';

export function FeaturedImagination() {
  const product = getProduct('imagination')!;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [60, -60]);
  const light = useTransform(scrollYProgress, [0, 0.5, 1], reduce ? [0.6, 0.6, 0.6] : [0.2, 0.9, 0.3]);

  return (
    <section className="featured" ref={ref} aria-labelledby="featured-title">
      <div className="featured__inner">
        <motion.div className="featured__visual" style={{ y }}>
          <motion.span className="featured__light" style={{ opacity: light }} aria-hidden="true" />
          <ProductVisual product={product} />
        </motion.div>

        <div className="featured__copy">
          <Reveal as="p" className="label label--gold">
            01 / THE BEGINNING
          </Reveal>
          <Reveal as="h2" className="display display--xl" delay={0.1}>
            <span id="featured-title">IMAGINATION</span>
          </Reveal>
          <GoldLine className="featured__line" />
          <Reveal as="p" className="featured__concept" delay={0.15}>
            THE DREAM
          </Reveal>
          <Reveal as="p" className="lede" delay={0.2}>
            “Every extraordinary journey begins with a vision that exists before the world can see it.”
          </Reveal>
          <Handwriting className="featured__hand" underline delay={0.3}>
            It starts in your mind.
          </Handwriting>
          <Reveal delay={0.3}>
            <Link to={productPath(product)} className="btn btn--gold">
              DISCOVER IMAGINATION
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
