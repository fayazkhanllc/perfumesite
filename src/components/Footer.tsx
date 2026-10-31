import { Link } from 'react-router-dom';
import { siteConfig } from '../data/siteConfig';

const SOCIAL_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  youtube: 'YouTube',
  x: 'X',
};

export function Footer() {
  const social = Object.entries(siteConfig.social).filter(([, url]) => !!url) as Array<[string, string]>;
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <p className="footer__logo">
            <span>25</span> FRAGRANCE
          </p>
          <p className="footer__slogan">WEAR YOUR AMBITION.</p>
          <p className="footer__line">Every ambition has a fragrance.</p>
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
      <p className="footer__legal">© {new Date().getFullYear()} 25 Fragrance. All rights reserved.</p>
    </footer>
  );
}
