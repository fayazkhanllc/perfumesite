import { STORY } from '../data/story';
import { GoldLine, Handwriting, Reveal } from './Motion';

export function BrandStory({ id = 'story', as = 'h2' }: { id?: string; as?: 'h1' | 'h2' }) {
  const Heading = as;
  return (
    <section id={id} className="story" aria-labelledby={`${id}-title`}>
      <div className="story__inner">
        <GoldLine className="story__line" />
        <Heading className="display display--lg story__title" id={`${id}-title`}>
          {STORY.headline}
        </Heading>
        <div className="story__body">
          {STORY.paragraphs.map((p, i) => (
            <Reveal key={i} as="p" className={i === STORY.paragraphs.length - 1 ? 'story__closing' : 'story__p'} delay={i * 0.08}>
              {p}
            </Reveal>
          ))}
          <Handwriting className="story__hand" tone="gold" underline delay={0.2}>
            {STORY.handwriting}
          </Handwriting>
        </div>
      </div>
    </section>
  );
}
