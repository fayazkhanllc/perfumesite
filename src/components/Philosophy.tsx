import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { EASE, GoldLine, Handwriting, Reveal } from './Motion';

const WORDS: Array<{ word: string; tone: 'white' | 'gold'; note?: string }> = [
  { word: 'IMAGINATION', tone: 'white', note: 'The dream.' },
  { word: 'STRUGGLE', tone: 'white' },
  { word: 'DISCIPLINE', tone: 'gold', note: 'Keep going.' },
  { word: 'RISE', tone: 'white' },
  { word: 'EMPIRE', tone: 'white' },
  { word: 'LEGACY', tone: 'gold', note: 'Write your own legacy.' },
];

export function Philosophy() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  // Royal violet melts into a deeper violet as the section is read.
  const bg = useTransform(scrollYProgress, [0, 0.35, 1], ['#4a1d96', '#3b1478', '#2a0d57']);

  return (
    <motion.section ref={ref} className="philosophy" style={reduce ? { background: '#3b1478' } : { background: bg }} aria-labelledby="philosophy-title">
      <div className="philosophy__inner">
        <header className="philosophy__head">
          <Reveal as="h2" className="display display--md" >
            <span id="philosophy-title">EVERY GREAT STORY STARTS SOMEWHERE.</span>
          </Reveal>
          <Reveal as="p" className="lede" delay={0.15}>
            First, there is a dream. Then comes the struggle. Through discipline, ambition, and persistence, the dream begins to take shape.
          </Reveal>
        </header>

        <ol className="stages">
          {WORDS.map(({ word, tone, note }, i) => (
            <li className="stages__item" key={word}>
              <GoldLine className="stages__line" />
              <div className="stages__row">
                <motion.span
                  className={`stages__word stages__word--${tone}`}
                  initial={reduce ? false : { opacity: 0, x: i % 2 ? 60 : -60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-12% 0px' }}
                  transition={{ duration: 1.1, ease: EASE }}
                >
                  {word}
                </motion.span>
                {note && (
                  <span className="stages__note">
                    <Handwriting delay={0.5}>{note}</Handwriting>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </motion.section>
  );
}
