import { Link } from 'react-router-dom';
import { PRODUCTS, productPath } from '../data/products';

/**
 * Slow ticker of all 25 fragrance names. Every name is a real link; the duplicated
 * second pass is hidden from assistive tech and the tab order.
 */
export function Marquee({ reverse = false }: { reverse?: boolean }) {
  const pass = (hidden: boolean) => (
    <ul className="marquee__pass" aria-hidden={hidden || undefined}>
      {PRODUCTS.map((p) => (
        <li key={p.id}>
          <Link to={productPath(p)} tabIndex={hidden ? -1 : undefined}>
            <span className="marquee__num">{p.number}</span>
            {p.name}
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <nav className={`marquee ${reverse ? 'marquee--reverse' : ''}`} aria-label="All 25 fragrances">
      <div className="marquee__track">
        {pass(false)}
        {pass(true)}
      </div>
    </nav>
  );
}
