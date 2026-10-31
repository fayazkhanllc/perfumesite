import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useSpring, useReducedMotion } from 'motion/react';
import { PRODUCTS, productPath } from '../data/products';
import { useCart } from '../context/CartContext';
import { EASE } from './Motion';

const NAV = [
  { to: '/shop', label: 'SHOP' },
  { to: '/story', label: 'OUR STORY' },
  { to: '/#finder', label: 'FIND YOUR FRAGRANCE' },
];

function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const term = q.trim().toLowerCase();
  const results = term
    ? PRODUCTS.filter((p) => {
        const digits = term.replace(/\D/g, '');
        return (
          p.name.toLowerCase().includes(term) ||
          p.concept.toLowerCase().includes(term) ||
          (digits !== '' && (p.number === digits.padStart(2, '0') || String(p.id) === digits))
        );
      })
    : [];

  const go = (slug: string) => {
    onClose();
    navigate(`/product/${slug}`);
  };

  return (
    <motion.div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Search fragrances"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="search"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -16, opacity: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (results[0]) go(results[0].slug);
          }}
        >
          <label htmlFor="site-search" className="search__label">
            Search by name or number
          </label>
          <input
            id="site-search"
            ref={input}
            className="search__input"
            type="search"
            autoComplete="off"
            placeholder="Try “Legacy” or “20”"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
        <div className="search__results" aria-live="polite">
          {term === '' && <p className="search__hint">Type a fragrance name or a number from 1 to 25.</p>}
          {term !== '' && results.length === 0 && (
            <p className="search__hint">
              No fragrance matches “{q.trim()}”. Check the spelling, or{' '}
              <Link to="/shop" onClick={onClose}>
                browse all 25
              </Link>
              .
            </p>
          )}
          <ul>
            {results.map((p) => (
              <li key={p.id}>
                <Link to={productPath(p)} onClick={onClose} className="search__item">
                  <span className="search__num">{p.number}</span>
                  <span className="search__name">{p.name}</span>
                  <span className="search__concept">{p.concept}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <button type="button" className="overlay__close" onClick={onClose} aria-label="Close search">
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

export function Header() {
  const { pathname } = useLocation();
  const { count, openCart } = useCart();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  const isHome = pathname === '/';
  const solid = scrolled || !isHome || menu;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => setMenu(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  return (
    <header className={`header ${solid ? 'header--solid' : ''}`}>
      <motion.div className="header__progress" style={{ scaleX: reduce ? scrollYProgress : progress }} aria-hidden="true" />
      <div className="header__inner">
        <Link to="/" className="logo" aria-label="25 Fragrance — home">
          <span className="logo__num">25</span>
          <span className="logo__word">FRAGRANCE</span>
        </Link>

        <nav className="nav" aria-label="Primary">
          {NAV.map((n) =>
            n.to.includes('#') ? (
              <Link key={n.to} to={n.to} className="nav__link">
                {n.label}
              </Link>
            ) : (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}>
                {n.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="header__tools">
          <button type="button" className="icon-btn" onClick={() => setSearch(true)} aria-label="Search fragrances">
            <SearchIcon />
          </button>
          <button type="button" className="icon-btn icon-btn--bag" onClick={openCart} aria-label={`Shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`}>
            <BagIcon />
            <AnimatePresence initial={false} mode="popLayout">
              {count > 0 && (
                <motion.span
                  key={count}
                  className="bag-count"
                  initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button
            type="button"
            className={`burger ${menu ? 'is-open' : ''}`}
            aria-expanded={menu}
            aria-controls="mobile-menu"
            aria-label={menu ? 'Close menu' : 'Open menu'}
            onClick={() => setMenu((m) => !m)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menu && (
          <motion.div
            id="mobile-menu"
            className="mobile-menu"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <nav aria-label="Mobile">
              <ul>
                {[{ to: '/shop', label: 'Shop all 25' }, ...NAV.slice(1)].map((n, i) => (
                  <motion.li
                    key={n.to}
                    initial={reduce ? false : { opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: EASE, delay: 0.15 + i * 0.07 }}
                  >
                    <Link to={n.to}>{n.label === 'SHOP' ? 'Shop all 25' : n.label.charAt(0) + n.label.slice(1).toLowerCase()}</Link>
                  </motion.li>
                ))}
                <motion.li
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: EASE, delay: 0.4 }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenu(false);
                      setSearch(true);
                    }}
                  >
                    Search
                  </button>
                </motion.li>
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{search && <SearchOverlay onClose={() => setSearch(false)} />}</AnimatePresence>
    </header>
  );
}
