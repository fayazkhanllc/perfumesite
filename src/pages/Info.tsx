import { Link, useParams } from 'react-router-dom';
import { useMeta } from '../hooks/useMeta';
import { siteConfig } from '../data/siteConfig';
import { NotFound } from './NotFound';

/**
 * Policy and help pages. The real text (shipping rates, return terms, legal copy)
 * has not been supplied, so each page says so instead of inventing it.
 * Replace `body` with the real copy when it is ready.
 */
const PAGES: Record<string, { title: string; body?: string[] }> = {
  contact: { title: 'Contact' },
  faqs: { title: 'FAQs' },
  shipping: { title: 'Shipping & delivery' },
  returns: { title: 'Returns & exchanges' },
  privacy: { title: 'Privacy policy' },
  terms: { title: 'Terms & conditions' },
};

export function Info() {
  const { slug = '' } = useParams();
  const page = PAGES[slug];
  useMeta({
    title: `${page?.title ?? 'Page'} — F Fragrance`,
    description: `${page?.title ?? 'Information'} for F Fragrance.`,
    path: `/info/${slug}`,
  });
  if (!page) return <NotFound />;
  return (
    <main id="main" className="page page--info">
      <h1 className="display display--lg">{page.title}</h1>
      {page.body ? (
        page.body.map((p, i) => <p className="lede" key={i}>{p}</p>)
      ) : (
        <>
          <p className="lede">This page has not been written yet. The official {page.title.toLowerCase()} details will be published here before launch.</p>
          {slug === 'contact' && siteConfig.contactEmail && (
            <p className="lede">
              Email <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
            </p>
          )}
        </>
      )}
      <Link to="/shop" className="btn btn--outline">
        Back to the collection
      </Link>
    </main>
  );
}
