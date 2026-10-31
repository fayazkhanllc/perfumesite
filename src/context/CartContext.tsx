import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getProductById, type Product } from '../data/products';

interface Line {
  id: number;
  qty: number;
}

export interface DetailedLine {
  product: Product;
  qty: number;
}

interface CartValue {
  lines: DetailedLine[];
  count: number;
  /** null when at least one item has no price yet. */
  subtotal: number | null;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (id: number, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
}

const STORAGE_KEY = '25fragrance.bag.v1';
const MAX_QTY = 10;
const CartContext = createContext<CartValue | null>(null);

function load(): Line[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l): l is Line => typeof l?.id === 'number' && typeof l?.qty === 'number' && !!getProductById(l.id))
      .map((l) => ({ id: l.id, qty: Math.min(MAX_QTY, Math.max(1, Math.floor(l.qty))) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<Line[]>(load);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    } catch {
      /* storage unavailable — bag still works for this visit */
    }
  }, [raw]);

  const add = useCallback((id: number, qty = 1) => {
    setRaw((cur) => {
      const found = cur.find((l) => l.id === id);
      if (found) return cur.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l));
      return [...cur, { id, qty: Math.min(MAX_QTY, qty) }];
    });
  }, []);

  const setQty = useCallback((id: number, qty: number) => {
    setRaw((cur) =>
      qty < 1 ? cur.filter((l) => l.id !== id) : cur.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)),
    );
  }, []);

  const remove = useCallback((id: number) => setRaw((cur) => cur.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setRaw([]), []);

  const value = useMemo<CartValue>(() => {
    const lines: DetailedLine[] = raw.flatMap((l) => {
      const product = getProductById(l.id);
      return product ? [{ product, qty: l.qty }] : [];
    });
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const allPriced = lines.every((l) => typeof l.product.price === 'number');
    const subtotal = allPriced ? lines.reduce((sum, l) => sum + (l.product.price ?? 0) * l.qty, 0) : null;
    return {
      lines,
      count,
      subtotal,
      isOpen,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      add,
      setQty,
      remove,
      clear,
    };
  }, [raw, isOpen, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}

export const CART_MAX_QTY = MAX_QTY;
