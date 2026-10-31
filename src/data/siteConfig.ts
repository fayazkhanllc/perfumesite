/**
 * Site-wide settings. Everything here is intentionally empty until real values exist.
 * Nothing in the UI invents a value that is left null.
 */
export const siteConfig = {
  /** Production domain, e.g. "https://25fragrance.com". Enables canonical URLs and absolute OG URLs. */
  siteUrl: '' as string,
  /** Used only to format prices that are set in products.ts. */
  currency: 'USD',
  currencyLocale: 'en-US',
  /** Official hero photograph, e.g. "/images/hero.jpg". When null a replaceable placeholder is shown. */
  heroImage: null as string | null,
  /** Real checkout URL (hosted checkout, Shopify, Stripe, etc.). When null the Checkout button stays disabled. */
  checkoutUrl: null as string | null,
  /** Official contact email. When null no contact address is shown. */
  contactEmail: null as string | null,
  /**
   * Newsletter form endpoint (Mailchimp, Klaviyo, Formspree, etc.). When null the footer form
   * is shown as a clearly labelled preview and stores nothing.
   */
  newsletterAction: null as string | null,
  /** Official social profiles. Only filled entries are rendered in the footer. */
  social: {} as Partial<Record<'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'x', string>>,
};

export function formatPrice(value: number): string {
  return new Intl.NumberFormat(siteConfig.currencyLocale, {
    style: 'currency',
    currency: siteConfig.currency,
  }).format(value);
}

export function absoluteUrl(path: string): string | null {
  return siteConfig.siteUrl ? `${siteConfig.siteUrl.replace(/\/$/, '')}${path}` : null;
}
