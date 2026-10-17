import type { Product } from './pos';
export function findByBarcode(products: Product[], code: string): Product | undefined {
  const normalized = code.trim();
  return normalized ? products.find(p => p.barcode?.trim() === normalized) : undefined;
}
export function barcodeConflict(products: Product[], code: string, editingId: string | null): boolean {
  return !!code.trim() && products.some(p => p.id !== editingId && p.barcode?.trim() === code.trim());
}
