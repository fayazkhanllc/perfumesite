import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { productPath, type Product } from '../data/products';
import { formatPrice } from '../data/siteConfig';
import { useCart } from '../context/CartContext';
import { ProductVisual } from './ProductVisual';
import { EASE } from './Motion';
import { Tilt3D } from './Tilt3D';

export function AddToBagButton({
  product,
  qty = 1,
  className = 'btn btn--ghost',
  label = 'Add to bag',
}: {
  product: Product;
  qty?: number;
  className?: string;
  label?: string;
}) {
  const { add } = useCart();
  const [done, setDone] = useState(false);
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const unavailable = product.availability === 'out_of_stock';
  return (
    <button
      type="button"
      className={className}
      disabled={unavailable}
      onClick={() => {
        add(product.id, qty);
        setDone(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setDone(false), 1400);
      }}
    >
      <span aria-live="polite">{unavailable ? 'Sold out' : done ? 'Added to bag' : label}</span>
    </button>
  );
}

export function ProductCard({ product, index = 0, wide = false }: { product: Product; index?: number; wide?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      layout={reduce ? false : 'position'}
      className={`card ${wide ? 'card--wide' : ''}`}
      initial={reduce ? false : { opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
      viewport={{ once: true, margin: '-6% 0px' }}
      transition={{ duration: 0.8, ease: EASE, delay: (index % 3) * 0.08 }}
    >
      <Tilt3D className="card__tilt">
      <Link to={productPath(product)} className="card__media" aria-label={`View ${product.name}`} tabIndex={-1}>
        <ProductVisual product={product} wide={wide} />
        <span className="card__num" aria-hidden="true">
          {product.number}
        </span>
      </Link>
      </Tilt3D>
      <div className="card__body">
        <h3 className="card__name">
          <Link to={productPath(product)}>{product.name}</Link>
        </h3>
        <p className="card__concept">{product.concept}</p>
        {typeof product.price === 'number' && <p className="card__price">{formatPrice(product.price)}</p>}
        <div className="card__actions">
          <Link to={productPath(product)} className="btn btn--text">
            View fragrance
          </Link>
          <AddToBagButton product={product} />
        </div>
      </div>
    </motion.article>
  );
}
