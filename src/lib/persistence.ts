import { seed, type State } from './pos';
import { defaultProfile, defaultReceipt, receiptElements, type ShopProfile, type ReceiptSettings } from './settings';
export const STORAGE_KEY = 'sembakopos-demo-v1';
const record = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
export function migrateState(value: unknown): State {
  const v = record(value);
  if (!Array.isArray(v.products) || !Array.isArray(v.txs) || !Array.isArray(v.purchases) || !Array.isArray(v.opnames)) throw new Error('Data tersimpan tidak dapat dibaca. Data asli tidak diubah.');
  const profile = record(v.profile), receipt = record(v.receipt), visible = record(receipt.visible);
  const normalizedProfile = { ...defaultProfile };
  for (const key of Object.keys(defaultProfile) as (keyof ShopProfile)[]) if (typeof profile[key] === 'string') normalizedProfile[key] = profile[key];
  const normalizedReceipt: ReceiptSettings = { ...defaultReceipt, visible: { ...defaultReceipt.visible } };
  if (receipt.paper === '58' || receipt.paper === '80') normalizedReceipt.paper = receipt.paper;
  if (receipt.align === 'left' || receipt.align === 'center') normalizedReceipt.align = receipt.align;
  if (receipt.fontSize === 'small' || receipt.fontSize === 'medium' || receipt.fontSize === 'large') normalizedReceipt.fontSize = receipt.fontSize;
  if (typeof receipt.footerText === 'string') normalizedReceipt.footerText = receipt.footerText;
  for (const key of receiptElements) if (typeof visible[key] === 'boolean') normalizedReceipt.visible[key] = visible[key];
  return { ...v, products: v.products.map((p) => {
    const product = record(p);
    if (typeof product.id !== 'string' || typeof product.name !== 'string' || !Array.isArray(product.packages) || typeof product.stock !== 'number') throw new Error('Data barang tidak dapat dibaca. Data asli tidak diubah.');
    return { ...product, barcode: typeof product.barcode === 'string' ? product.barcode : '', image: typeof product.image === 'string' ? product.image : '' };
  }), profile: normalizedProfile, receipt: normalizedReceipt } as State;
}
export function loadState(storage: Pick<Storage, 'getItem'>): State {
  const raw = storage.getItem(STORAGE_KEY);
  return raw === null ? { ...seed(), profile: { ...defaultProfile }, receipt: { ...defaultReceipt, visible: { ...defaultReceipt.visible } } } : migrateState(JSON.parse(raw));
}
export function persistState(storage: Pick<Storage, 'setItem'>, state: State): { ok: true } | { ok: false; error: string } {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return { ok: true }; }
  catch { return { ok: false, error: 'Data belum disimpan: penyimpanan browser penuh atau diblokir. Kurangi foto/logo lalu coba lagi. Data dan transaksi sebelumnya tetap aman.' }; }
}
