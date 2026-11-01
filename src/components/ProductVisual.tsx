import type { Product } from '../data/products';

/**
 * Shows the official photograph when one is configured. Otherwise renders a clearly
 * replaceable placeholder — it never draws or invents bottle packaging.
 */
export function ProductVisual({
  product,
  src,
  alt,
  wide = false,
  eager = false,
  label,
}: {
  product?: Product;
  src?: string | null;
  alt?: string;
  wide?: boolean;
  eager?: boolean;
  label?: string;
}) {
  const image = src ?? product?.image;
  const ratio = wide ? 'visual--wide' : '';
  if (image) {
    return (
      <div className={`visual ${ratio}`}>
        <img
          src={image}
          alt={alt ?? (product ? `F Fragrance ${product.name}, fragrance ${product.number}` : 'F Fragrance')}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          width={wide ? 1200 : 800}
          height={wide ? 750 : 1000}
        />
      </div>
    );
  }
  return (
    <div
      className={`visual visual--placeholder ${ratio}`}
      role="img"
      aria-label={
        product
          ? `Placeholder for the official photograph of ${product.name}, fragrance ${product.number}`
          : 'Placeholder for official product photography'
      }
    >
      <span className="visual__glow" aria-hidden="true" />
      <svg className="visual__arch" viewBox="0 0 100 125" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <path d="M14 122 V52 C14 24 30 8 50 8 S86 24 86 52 V122" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <path d="M22 122 V54 C22 30 34 16 50 16 S78 30 78 54 V122" fill="none" stroke="currentColor" strokeWidth="0.25" opacity="0.6" />
      </svg>
      <span className="visual__num" aria-hidden="true">
        {product ? product.number : 'F'}
      </span>
      <span className="visual__note">{label ?? 'Official photograph goes here'}</span>
    </div>
  );
}
