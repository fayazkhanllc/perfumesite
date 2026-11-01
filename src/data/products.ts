export type StageId = 'beginning' | 'battle' | 'ascent' | 'empire' | 'beyond';

export interface Stage {
  id: StageId;
  act: string;
  label: string;
  annotation: string;
}

export const STAGES: Stage[] = [
  { id: 'beginning', act: 'ACT I', label: 'THE BEGINNING', annotation: 'The dream.' },
  { id: 'battle', act: 'ACT II', label: 'THE BATTLE', annotation: 'Keep going.' },
  { id: 'ascent', act: 'ACT III', label: 'THE ASCENT', annotation: 'Your next chapter.' },
  { id: 'empire', act: 'ACT IV', label: 'THE EMPIRE', annotation: 'Made for ambition.' },
  { id: 'beyond', act: 'ACT V', label: 'BEYOND LIMITS', annotation: 'Become unforgettable.' },
];

export type Availability = 'in_stock' | 'out_of_stock';

/** Optional, real-world details. Leave a field out until the real value is known. */
export interface ProductDetails {
  /** Path or URL to the official product photograph, e.g. "/images/products/imagination.jpg". */
  image?: string;
  /** True for transparent bottle cut-outs: shown on a violet stage instead of cropped as a photo. */
  cutout?: boolean;
  /** Additional official photographs. */
  gallery?: string[];
  /** Price in the currency set in siteConfig. */
  price?: number;
  availability?: Availability;
  /** Official marketing description. */
  description?: string;
  /** Verified fragrance notes only. */
  notes?: string[];
  /** e.g. "100 ml" */
  size?: string;
  /** e.g. "Eau de Parfum" */
  concentration?: string;
}

export interface Product extends ProductDetails {
  id: number;
  number: string;
  slug: string;
  name: string;
  concept: string;
  stage: StageId;
}

const RAW: Array<[string, string, StageId]> = [
  ['IMAGINATION', 'The dream.', 'beginning'],
  ['VISION', 'Seeing what others cannot.', 'beginning'],
  ['MANIFEST', 'Turning thought into reality.', 'beginning'],
  ['STRUGGLE', 'The difficult beginning.', 'battle'],
  ['GRIT', 'Refusing to quit.', 'battle'],
  ['RISE', 'Getting back up.', 'battle'],
  ['HUSTLE', 'Relentless action.', 'battle'],
  ['DISCIPLINE', 'Doing what must be done.', 'battle'],
  ['FOCUS', 'Eliminating distractions.', 'battle'],
  ['FEARLESS', 'Moving despite fear.', 'battle'],
  ['ASCEND', 'Reaching the next level.', 'ascent'],
  ['POWER', 'Confidence and presence.', 'ascent'],
  ['DOMINATE', 'Taking your position.', 'ascent'],
  ['INFLUENCE', 'Making an impact.', 'ascent'],
  ['FORTUNE', 'Creating wealth.', 'ascent'],
  ['MILLION', 'The first major milestone.', 'ascent'],
  ['EMPIRE', 'Building something bigger.', 'empire'],
  ['DYNASTY', 'Building beyond one generation.', 'empire'],
  ['CROWN', 'The reward of achievement.', 'empire'],
  ['LEGACY', 'Leaving something behind.', 'empire'],
  ['FREEDOM', 'Owning your time and choices.', 'beyond'],
  ['LIMITLESS', 'No self-imposed ceiling.', 'beyond'],
  ['ETERNAL', 'Built to last.', 'beyond'],
  ['ICON', 'Becoming unforgettable.', 'beyond'],
  ['IMMORTAL', 'The ultimate chapter.', 'beyond'],
];

/**
 * Real product data goes here, keyed by slug (lowercase name). Example:
 *
 *   imagination: {
 *     image: '/images/products/imagination.jpg',
 *     price: 120,
 *     availability: 'in_stock',
 *     size: '100 ml',
 *     concentration: 'Eau de Parfum',
 *     notes: ['…verified notes…'],
 *   },
 */
/** Current price for every fragrance, in the currency set in siteConfig. Override per product in PRODUCT_DETAILS. */
export const DEFAULT_PRICE = 2499;

export const PRODUCT_DETAILS: Record<string, ProductDetails> = {};

export const PRODUCTS: Product[] = RAW.map(([name, concept, stage], i) => {
  const slug = name.toLowerCase();
  return {
    id: i + 1,
    number: String(i + 1).padStart(2, '0'),
    slug,
    name,
    concept,
    stage,
    image: `/images/products/${slug}.webp`,
    cutout: true,
    price: DEFAULT_PRICE,
    ...(PRODUCT_DETAILS[slug] ?? {}),
  };
});

export const getProduct = (slug: string | undefined) => PRODUCTS.find((p) => p.slug === slug);
export const getProductById = (id: number) => PRODUCTS.find((p) => p.id === id);
export const getStage = (id: StageId) => STAGES.find((s) => s.id === id)!;
export const productsInStage = (id: StageId) => PRODUCTS.filter((p) => p.stage === id);
export const productPath = (p: Product) => `/product/${p.slug}`;

/** Fragrance finder: storytelling recommendations only — not claims about notes. */
export interface FinderOption {
  id: string;
  label: string;
  picks: string[];
}

export const FINDER_OPTIONS: FinderOption[] = [
  { id: 'dream', label: 'I AM BUILDING MY DREAM.', picks: ['imagination', 'vision', 'manifest'] },
  { id: 'struggle', label: 'I AM FIGHTING THROUGH THE STRUGGLE.', picks: ['struggle', 'grit', 'rise'] },
  { id: 'discipline', label: 'I AM COMMITTED TO DISCIPLINE.', picks: ['discipline', 'focus', 'hustle'] },
  { id: 'rise', label: 'I AM READY TO RISE.', picks: ['ascend', 'power', 'fearless'] },
  { id: 'empire', label: 'I AM BUILDING MY EMPIRE.', picks: ['fortune', 'million', 'empire', 'dynasty'] },
  { id: 'legacy', label: 'I AM CREATING MY LEGACY.', picks: ['crown', 'legacy', 'eternal', 'immortal'] },
];

export const FILTERS: Array<{ id: 'all' | StageId; label: string }> = [
  { id: 'all', label: 'ALL FRAGRANCES' },
  ...STAGES.map((s) => ({ id: s.id, label: s.label })),
];
