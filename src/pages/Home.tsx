import { useCallback, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useMeta } from '../hooks/useMeta';
import { usePrefersReducedMotion } from '../hooks/useReducedMotion';
import { siteConfig } from '../data/siteConfig';
import { Intro } from '../components/Intro';
import { Hero } from '../components/Hero';
import { Philosophy } from '../components/Philosophy';
import { Collection } from '../components/Collection';
import { FeaturedImagination } from '../components/FeaturedImagination';
import { Timeline } from '../components/Timeline';
import { Finder } from '../components/Finder';
import { BrandStory } from '../components/BrandStory';
import { Campaign } from '../components/Campaign';
import { Marquee } from '../components/Marquee';

const SEEN = '25fragrance.intro.seen';

function introAlreadySeen(): boolean {
  try {
    return sessionStorage.getItem(SEEN) === '1';
  } catch {
    return false;
  }
}

export function Home() {
  useMeta({
    title: '25 Fragrance — Wear Your Ambition',
    description:
      'Twenty-five men’s fragrances, each one a chapter from imagination to legacy. Find the scent that speaks your language.',
    path: '/',
    image: siteConfig.heroImage,
  });
  const reduce = usePrefersReducedMotion();
  const [intro, setIntro] = useState(() => !reduce && !introAlreadySeen() && !window.location.hash);

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(SEEN, '1');
    } catch {
      /* ignore */
    }
    setIntro(false);
  }, []);

  return (
    <>
      <AnimatePresence>{intro && <Intro onDone={finish} />}</AnimatePresence>
      <main id="main">
        <Hero ready={!intro} />
        <Marquee />
        <Philosophy />
        <Collection />
        <FeaturedImagination />
        <Timeline />
        <Finder />
        <Marquee reverse />
        <BrandStory />
        <Campaign />
      </main>
    </>
  );
}
