import { useMeta } from '../hooks/useMeta';
import { Collection } from '../components/Collection';
import { Handwriting, Reveal } from '../components/Motion';

export function Shop() {
  useMeta({
    title: 'Shop all 25 fragrances — F Fragrance',
    description: 'Browse the complete F Fragrance men’s collection, from Imagination to Immortal, and filter by chapter.',
    path: '/shop',
  });
  return (
    <main id="main" className="page">
      <header className="page__head">
        <Reveal as="h1" className="display display--xl">
          SHOP ALL 25
        </Reveal>
        <Reveal as="p" className="lede" delay={0.1}>
          Every ambition has a fragrance.
        </Reveal>
        <Handwriting delay={0.3} underline>
          Which chapter is yours?
        </Handwriting>
      </header>
      <Collection heading={false} />
    </main>
  );
}
