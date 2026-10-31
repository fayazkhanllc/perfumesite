// Writes dist/sitemap.xml and adds a Sitemap line to dist/robots.txt.
// Needs a real domain: run with SITE_URL=https://your-domain.com npm run build
import { writeFileSync, appendFileSync, existsSync } from 'node:fs';

const site = (process.env.SITE_URL || '').replace(/\/$/, '');
if (!site) {
  console.log('[sitemap] SITE_URL not set — skipping sitemap.xml (set it once the domain is known).');
  process.exit(0);
}

const names = [
  'IMAGINATION','VISION','MANIFEST','STRUGGLE','GRIT','RISE','HUSTLE','DISCIPLINE','FOCUS','FEARLESS',
  'ASCEND','POWER','DOMINATE','INFLUENCE','FORTUNE','MILLION','EMPIRE','DYNASTY','CROWN','LEGACY',
  'FREEDOM','LIMITLESS','ETERNAL','ICON','IMMORTAL',
];
const paths = ['/', '/shop', '/story', ...names.map((n) => `/product/${n.toLowerCase()}`)];
const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  paths.map((p) => `  <url><loc>${site}${p}</loc></url>`).join('\n') +
  `\n</urlset>\n`;
writeFileSync('dist/sitemap.xml', xml);
if (existsSync('dist/robots.txt')) appendFileSync('dist/robots.txt', `\nSitemap: ${site}/sitemap.xml\n`);
console.log(`[sitemap] wrote ${paths.length} URLs`);
