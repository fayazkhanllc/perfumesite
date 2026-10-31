import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../data/siteConfig';
import { GoldLine, Handwriting, Reveal } from './Motion';

const SOCIAL_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  youtube: 'YouTube',
  x: 'X',
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'invalid' | 'sending' | 'done' | 'error' | 'preview'>('idle');
  const action = siteConfig.newsletterAction;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) return setState('invalid');
    if (!action) return setState('preview');
    setState('sending');
    try {
      const res = await fetch(action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState('done');
      setEmail('');
    } catch {
      setState('error');
    }
  };

  const message: Record<typeof state, string> = {
    idle: '',
    invalid: 'Enter a valid email address.',
    sending: 'Sending…',
    done: 'You are on the list. Welcome to the journey.',
    error: 'Something went wrong. Please try again in a moment.',
    preview: 'Preview only: sign-ups are not connected yet, so nothing was saved.',
  };

  return (
    <form className="newsletter" onSubmit={submit} noValidate>
      <label htmlFor="newsletter-email" className="newsletter__label">
        Be first to know about new chapters
      </label>
      <div className="newsletter__row">
        <input
          id="newsletter-email"
          className="newsletter__input"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Your email address"
          value={email}
          aria-invalid={state === 'invalid'}
          aria-describedby="newsletter-msg"
          onChange={(e) => {
            setEmail(e.target.value);
            if (state !== 'idle') setState('idle');
          }}
        />
        <button type="submit" className="newsletter__btn" disabled={state === 'sending'}>
          Join
        </button>
      </div>
      <p id="newsletter-msg" className={`newsletter__msg newsletter__msg--${state}`} role="status" aria-live="polite">
        {message[state]}
      </p>
      {!action && state === 'idle' && <p className="newsletter__note">Sign-up is a preview until a mailing service is connected.</p>}
    </form>
  );
}

export function Footer() {
  const social = Object.entries(siteConfig.social).filter(([, url]) => !!url) as Array<[string, string]>;
  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="footer__lead">
        <div className="footer__lead-copy">
          <Reveal as="p" className="footer__eyebrow">
            WEAR YOUR AMBITION.
          </Reveal>
          <Handwriting className="footer__hand" underline delay={0.2}>
            Your next chapter awaits.
          </Handwriting>
        </div>
        <Newsletter />
      </div>

      <GoldLine className="footer__rule" />

      <div className="footer__inner">
        <div className="footer__brand">
          <p className="footer__logo">
            <span>25</span> FRAGRANCE
          </p>
          <p className="footer__blurb">Twenty-five men’s fragrances. Twenty-five chapters. One extraordinary journey.</p>
          {siteConfig.contactEmail && (
            <a className="footer__mail" href={`mailto:${siteConfig.contactEmail}`}>
              {siteConfig.contactEmail}
            </a>
          )}
          {social.length > 0 && (
            <ul className="footer__social" aria-label="Social media">
              {social.map(([k, url]) => (
                <li key={k}>
                  <a href={url} rel="noopener noreferrer" target="_blank">
                    {SOCIAL_LABEL[k] ?? k}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav className="footer__cols" aria-label="Footer">
          <div>
            <h2 className="footer__h">Explore</h2>
            <ul>
              <li><Link to="/shop">Shop all</Link></li>
              <li><Link to="/#finder">Discover your fragrance</Link></li>
              <li><Link to="/story">Our story</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="footer__h">Help</h2>
            <ul>
              <li><Link to="/info/contact">Contact</Link></li>
              <li><Link to="/info/faqs">FAQs</Link></li>
              <li><Link to="/info/shipping">Shipping &amp; delivery</Link></li>
              <li><Link to="/info/returns">Returns &amp; exchanges</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="footer__h">Legal</h2>
            <ul>
              <li><Link to="/info/privacy">Privacy policy</Link></li>
              <li><Link to="/info/terms">Terms &amp; conditions</Link></li>
            </ul>
          </div>
        </nav>
      </div>

      <p className="footer__wordmark" aria-hidden="true">
        <span>25</span> FRAGRANCE
      </p>

      <div className="footer__bar">
        <p className="footer__legal">© {new Date().getFullYear()} 25 Fragrance. All rights reserved.</p>
        <p className="footer__line">Every ambition has a fragrance.</p>
        <button type="button" className="footer__top" onClick={toTop}>
          Back to top <span aria-hidden="true">↑</span>
        </button>
      </div>
    </footer>
  );
}
