import { Link } from 'react-router-dom';
import { useMeta } from '../hooks/useMeta';

export function NotFound({ what = 'page' }: { what?: string }) {
  useMeta({ title: 'Not found — 25 Fragrance', description: 'This page could not be found.', path: '/404' });
  return (
    <main id="main" className="page page--centered">
      <h1 className="display display--lg">This {what} does not exist.</h1>
      <p className="lede">The link may be old or mistyped. Browse the collection to find your chapter.</p>
      <div className="row">
        <Link to="/shop" className="btn btn--gold">
          Explore all 25
        </Link>
        <Link to="/" className="btn btn--outline">
          Back to home
        </Link>
      </div>
    </main>
  );
}
