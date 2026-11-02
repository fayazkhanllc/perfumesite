import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useMeta } from '../hooks/useMeta';
import { usePrefersReducedMotion } from '../hooks/useReducedMotion';
import { siteConfig } from '../data/siteConfig';
import { Intro } from '../components/Intro';
import { Hero } from '../components/Hero';
import { Philosophy } from '../components/Philosophy';
import { Collection } from '../components/Collection';
import { FeaturedImagination } from '../components/FeaturedImagination';
import { Carousel3D } from '../components/Carousel3D';
import { Timeline } from '../components/Timeline';
import { Finder } from '../components/Finder';
import { BrandStory } from '../components/BrandStory';
import { Campaign } from '../components/Campaign';
import { Marquee } from '../components/Marquee';

const EagleScene = lazy(() => import('../components/eagles/EagleScene'));
const EagleSoundToggle = lazy(() => import('../components/eagles/EagleSoundToggle'));

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
    title: 'F Fragrance — Wear Your Ambition',
    description:
      'Twenty-five men’s fragrances, each one a chapter from imagination to legacy. Find the scent that speaks your language.',
    path: '/',
    image: siteConfig.heroImage,
  });
  const reduce = usePrefersReducedMotion();
  const [intro, setIntro] = useState(() => !reduce && !introAlreadySeen() && !window.location.hash);

  // Load the 3D flock only after the page is interactive, so it never blocks first render.
  const [flock, setFlock] = useState(false);
  useEffect(() => {
    if (intro) return;
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: object) => number }).requestIdleCallback;
    const id = idle ? idle(() => setFlock(true), { timeout: 2500 }) : window.setTimeout(() => setFlock(true), 1200);
    return () => {
      if (!idle) window.clearTimeout(id);
    };
  }, [intro]);

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
      {flock && (
        <Suspense fallback={null}>
          <EagleScene />
          <EagleSoundToggle />
        </Suspense>
      )}
      <main id="main">
        <Hero ready={!intro} />
        <Carousel3D />
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
