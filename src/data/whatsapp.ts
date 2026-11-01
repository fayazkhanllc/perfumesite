import type { Product } from './products';
import { formatPrice, siteConfig } from './siteConfig';

export interface WhatsAppLine {
  product: Product;
  qty: number;
}

/** Builds a wa.me link with the order already written out. Returns null when no number is configured. */
export function whatsappOrderUrl(lines: WhatsAppLine[]): string | null {
  const number = siteConfig.whatsappNumber?.replace(/\D/g, '');
  if (!number || lines.length === 0) return null;
  const priced = lines.every((l) => typeof l.product.price === 'number');
  const rows = lines.map(({ product, qty }) => {
    const price = typeof product.price === 'number' ? ` — ${formatPrice(product.price * qty)}` : '';
    return `• ${product.number} ${product.name} × ${qty}${price}`;
  });
  const total = priced
    ? `\nTotal: ${formatPrice(lines.reduce((sum, l) => sum + (l.product.price as number) * l.qty, 0))}`
    : '';
  const text = `Hello F Fragrance, I would like to order:\n${rows.join('\n')}${total}\n\nPlease confirm availability, delivery and payment details.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
