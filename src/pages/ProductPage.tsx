import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { PRODUCTS, getProduct, getStage, productPath } from '../data/products';
import { absoluteUrl, formatPrice, siteConfig } from '../data/siteConfig';
import { CART_MAX_QTY } from '../context/CartContext';
import { useMeta } from '../hooks/useMeta';
import { AddToBagButton, ProductCard } from '../components/ProductCard';
import { ProductVisual } from '../components/ProductVisual';
import { EASE, GoldLine, Handwriting } from '../components/Motion';
import { NotFound } from './NotFound';

export function ProductPage() {
  const { slug } = useParams();
  const product = getProduct(slug);
  if (!product) return <NotFound what="fragrance" />;
  return <Detail key={product.slug} slug={product.slug} />;
}

function Detail({ slug }: { slug: string }) {
  const product = getProduct(slug)!;
  const reduce = useReducedMotion();
  const [qty, setQty] = useState(1);
  const stage = getStage(product.stage);
  const idx = PRODUCTS.findIndex((p) => p.id === product.id);
  const prev = PRODUCTS[(idx - 1 + PRODUCTS.length) % PRODUCTS.length];
  const next = PRODUCTS[(idx + 1) % PRODUCTS.length];
  const related = PRODUCTS.filter((p) => p.stage === product.stage && p.id !== product.id)
    .concat(PRODUCTS.filter((p) => p.stage !== product.stage))
    .slice(0, 3);

  const description =
    product.description ?? `${product.name} is chapter ${product.number} of 25 in ${stage.label.toLowerCase()} — ${product.concept.toLowerCase()}`;

  useMeta({
    title: `${product.name} — Fragrance ${product.number} — 25 Fragrance`,
    description,
    path: productPath(product),
    image: product.image,
  });

  // Structured data: offers are only emitted when a real price and availability exist.
  useEffect(() => {
    const ld: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${product.name} — 25 Fragrance`,
      sku: `25F-${product.number}`,
      brand: { '@type': 'Brand', name: '25 Fragrance' },
      description,
    };
    const url = absoluteUrl(productPath(product));
    if (url) ld.url = url;
    if (product.image) ld.image = absoluteUrl(product.image) ?? product.image;
    if (typeof product.price === 'number' && product.availability) {
      ld.offers = {
        '@type': 'Offer',
        price: product.price.toFixed(2),
        priceCurrency: siteConfig.currency,
        availability: product.availability === 'in_stock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        ...(url ? { url } : {}),
      };
    }
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'ld-product';
    el.text = JSON.stringify(ld);
    document.head.appendChild(el);
    return () => el.remove();
  }, [product, description]);

  const availability =
    product.availability === 'in_stock' ? 'In stock' : product.availability === 'out_of_stock' ? 'Sold out' : 'Availability to be confirmed';

  return (
    <main id="main" className="pdp">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to="/shop">Shop</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="pdp__grid">
        <motion.div
          className="pdp__media"
          initial={reduce ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: EASE }}
        >
          <ProductVisual product={product} eager />
          <span className="pdp__bignum" aria-hidden="true">
            {product.number}
          </span>
          {product.gallery && product.gallery.length > 0 && (
            <ul className="pdp__gallery">
              {product.gallery.map((src, i) => (
                <li key={src}>
                  <ProductVisual src={src} alt={`${product.name} — additional photograph ${i + 1}`} />
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        <motion.div
          className="pdp__info"
          initial={reduce ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.1 }}
        >
          <p className="label label--gold">
            {product.number} / {stage.label}
          </p>
          <h1 className="display display--xl">{product.name}</h1>
          <GoldLine className="pdp__line" />
          <p className="pdp__concept">{product.concept}</p>
          <Handwriting immediate delay={0.6} underline>
            {stage.annotation}
          </Handwriting>

          <p className="pdp__price">{typeof product.price === 'number' ? formatPrice(product.price) : 'Price to be confirmed'}</p>
          <p className={`pdp__avail ${product.availability === 'in_stock' ? 'is-in' : ''}`}>{availability}</p>

          <div className="pdp__buy">
            <div className="qty qty--lg" role="group" aria-label="Quantity">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">
                −
              </button>
              <output aria-live="polite">{qty}</output>
              <button type="button" onClick={() => setQty((q) => Math.min(CART_MAX_QTY, q + 1))} disabled={qty >= CART_MAX_QTY} aria-label="Increase quantity">
                +
              </button>
            </div>
            <AddToBagButton product={product} qty={qty} className="btn btn--gold btn--grow" label="Add to bag" />
          </div>

          <section className="pdp__section" aria-labelledby="pdp-about">
            <h2 id="pdp-about" className="pdp__h">
              About this fragrance
            </h2>
            <p>{description}</p>
          </section>

          {(product.size || product.concentration || (product.notes && product.notes.length > 0)) && (
            <section className="pdp__section" aria-labelledby="pdp-spec">
              <h2 id="pdp-spec" className="pdp__h">
                Details
              </h2>
              <dl className="pdp__spec">
                {product.size && (
                  <>
                    <dt>Size</dt>
                    <dd>{product.size}</dd>
                  </>
                )}
                {product.concentration && (
                  <>
                    <dt>Concentration</dt>
                    <dd>{product.concentration}</dd>
                  </>
                )}
                {product.notes && product.notes.length > 0 && (
                  <>
                    <dt>Notes</dt>
                    <dd>{product.notes.join(', ')}</dd>
                  </>
                )}
              </dl>
            </section>
          )}

          <section className="pdp__section" aria-labelledby="pdp-ship">
            <h2 id="pdp-ship" className="pdp__h">
              Shipping
            </h2>
            <p>
              Shipping options and delivery times have not been published yet. See{' '}
              <Link to="/info/shipping">shipping &amp; delivery</Link> for updates.
            </p>
          </section>
        </motion.div>
      </div>

      <nav className="pager" aria-label="Previous and next fragrance">
        <Link to={productPath(prev)} className="pager__link pager__link--prev">
          <span className="pager__dir">Previous</span>
          <span className="pager__name">
            {prev.number} {prev.name}
          </span>
        </Link>
        <Link to={productPath(next)} className="pager__link pager__link--next">
          <span className="pager__dir">Next</span>
          <span className="pager__name">
            {next.number} {next.name}
          </span>
        </Link>
      </nav>

      <section className="related" aria-labelledby="related-title">
        <h2 id="related-title" className="display display--md">
          Continue the journey
        </h2>
        <div className="grid grid--related">
          {related.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>
    </main>
  );
}
