import { Link } from 'react-router-dom';
import { siteConfig } from '../data/siteConfig';
import { ProductVisual } from './ProductVisual';
import { GoldLine, Handwriting, Reveal } from './Motion';

export function Campaign() {
  return (
    <section className="campaign" aria-labelledby="campaign-title">
      <div className="campaign__inner">
        <div className="campaign__copy">
          <Reveal as="h2" className="display display--xl">
            <span id="campaign-title">YOUR LEGACY IS STILL BEING WRITTEN.</span>
          </Reveal>
          <GoldLine className="campaign__line" />
          <Reveal as="p" className="lede" delay={0.12}>
            Choose the fragrance that represents who you are becoming.
          </Reveal>
          <Handwriting className="campaign__hand" underline delay={0.3}>
            The journey continues...
          </Handwriting>
          <Reveal delay={0.25} className="campaign__cta">
            <Link to="/#finder" className="btn btn--gold">
              FIND YOUR FRAGRANCE
            </Link>
            <Link to="/#collection" className="btn btn--outline">
              EXPLORE ALL 25
            </Link>
          </Reveal>
        </div>
        <div className="campaign__visual">
          <ProductVisual src={siteConfig.heroImage} alt="25 Fragrance campaign" label="Campaign photograph goes here" />
        </div>
      </div>
    </section>
  );
}
