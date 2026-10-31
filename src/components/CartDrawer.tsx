import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useCart, CART_MAX_QTY } from '../context/CartContext';
import { formatPrice, siteConfig } from '../data/siteConfig';
import { productPath } from '../data/products';
import { EASE } from './Motion';

export function CartDrawer() {
  const { isOpen, closeCart, lines, count, subtotal, setQty, remove } = useCart();
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    opener.current = document.activeElement;
    closeBtn.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCart();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, [isOpen, closeCart]);

  const priced = subtotal !== null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="overlay overlay--drawer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onMouseDown={(e) => e.target === e.currentTarget && closeCart()}
        >
          <motion.aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <header className="drawer__head">
              <h2>
                Your bag <span>({count})</span>
              </h2>
              <button ref={closeBtn} type="button" className="icon-btn" onClick={closeCart} aria-label="Close bag">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                  <path d="M5 5l14 14M19 5 5 19" />
                </svg>
              </button>
            </header>

            {lines.length === 0 ? (
              <div className="drawer__empty">
                <p className="drawer__empty-title">Your bag is empty.</p>
                <p>Twenty-five chapters are waiting. Pick the one you are living now.</p>
                <Link to="/shop" className="btn btn--gold" onClick={closeCart}>
                  Explore all 25
                </Link>
              </div>
            ) : (
              <>
                <ul className="drawer__lines">
                  <AnimatePresence initial={false}>
                    {lines.map(({ product, qty }) => (
                      <motion.li
                        key={product.id}
                        layout
                        className="line"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                      >
                        <div className="line__inner">
                          <span className="line__num" aria-hidden="true">
                            {product.number}
                          </span>
                          <div className="line__info">
                            <Link to={productPath(product)} onClick={closeCart} className="line__name">
                              {product.name}
                            </Link>
                            <span className="line__concept">{product.concept}</span>
                            <span className="line__price">
                              {typeof product.price === 'number' ? formatPrice(product.price) : 'Price to be confirmed'}
                            </span>
                          </div>
                          <div className="qty" role="group" aria-label={`Quantity for ${product.name}`}>
                            <button type="button" onClick={() => setQty(product.id, qty - 1)} aria-label={`Decrease quantity of ${product.name}`}>
                              −
                            </button>
                            <output aria-live="polite">{qty}</output>
                            <button
                              type="button"
                              onClick={() => setQty(product.id, qty + 1)}
                              disabled={qty >= CART_MAX_QTY}
                              aria-label={`Increase quantity of ${product.name}`}
                            >
                              +
                            </button>
                          </div>
                          <button type="button" className="line__remove" onClick={() => remove(product.id)}>
                            Remove<span className="sr-only"> {product.name}</span>
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <footer className="drawer__foot">
                  <div className="drawer__subtotal">
                    <span>Subtotal</span>
                    <strong>{priced ? formatPrice(subtotal!) : 'To be confirmed'}</strong>
                  </div>
                  <p className="drawer__note">
                    {priced
                      ? 'Shipping and taxes are confirmed at checkout.'
                      : 'Prices are not published yet, so a subtotal cannot be calculated.'}
                  </p>
                  {siteConfig.checkoutUrl ? (
                    <a className="btn btn--gold btn--block" href={siteConfig.checkoutUrl}>
                      Checkout
                    </a>
                  ) : (
                    <>
                      <button type="button" className="btn btn--gold btn--block" disabled>
                        Checkout
                      </button>
                      <p className="drawer__note drawer__note--warn">
                        Checkout is not connected yet. Your bag is saved on this device and will be here when it opens.
                      </p>
                    </>
                  )}
                </footer>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
