import { Link } from 'react-router-dom';
import { useMeta } from '../hooks/useMeta';
import { BrandStory } from '../components/BrandStory';
import { Reveal } from '../components/Motion';

export function Story() {
  useMeta({
    title: 'Our story — F Fragrance',
    description: 'F Fragrance gives every chapter of a man’s journey a name: twenty-five fragrances, twenty-five mindsets, one journey of becoming.',
    path: '/story',
  });
  return (
    <main id="main" className="page page--story">
      <BrandStory id="our-story" as="h1" />
      <Reveal className="story__after">
        <Link to="/shop" className="btn btn--gold">
          EXPLORE ALL 25
        </Link>
        <Link to="/#finder" className="btn btn--outline">
          FIND YOUR FRAGRANCE
        </Link>
      </Reveal>
    </main>
  );
}
