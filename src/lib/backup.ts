import { migrateState } from './persistence';
import type { State } from './pos';

const FORMAT = 'sembakopos-backup-v1';
const object = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const nonnegative = (v: unknown): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const text = (v: unknown): v is string => typeof v === 'string';

/** Cadangan lokal saja; jangan unggah berkas transaksi ke repository publik. */
export function createBackup(state: State, exportedAt = new Date().toISOString()): string {
  return JSON.stringify({ format: FORMAT, version: 1, exportedAt, state }, null, 2);
}

/** Baca dan validasi sebelum meminta konfirmasi; tidak menyentuh localStorage. */
export function readBackup(json: string): State {
  let document: unknown;
  try { document = JSON.parse(json); }
  catch { throw new Error('Berkas bukan JSON yang valid. Data sebelumnya tidak diubah.'); }
  if (!object(document) || document.format !== FORMAT || document.version !== 1) {
    throw new Error('Format cadangan tidak cocok dengan SembakoPOS. Data sebelumnya tidak diubah.');
  }

  const state = migrateState(document.state);
  const validProduct = state.products.every(p =>
    object(p) && text(p.id) && text(p.name) && text(p.baseUnit) &&
    nonnegative(p.cost) && nonnegative(p.stock) && Array.isArray(p.packages) &&
    p.packages.length > 0 && p.packages.every(pkg =>
      object(pkg) && text(pkg.id) && text(pkg.name) &&
      nonnegative(pkg.factor) && pkg.factor > 0 &&
      nonnegative(pkg.retail) && nonnegative(pkg.wholesale) &&
      nonnegative(pkg.wholesaleMin)) &&
    (p.barcode === undefined || text(p.barcode)) &&
    (p.image === undefined || text(p.image))
  );
  const validTxs = state.txs.every(tx =>
    object(tx) && text(tx.id) && text(tx.date) &&
    nonnegative(tx.subtotal) && nonnegative(tx.discount) &&
    nonnegative(tx.total) && nonnegative(tx.paid) && nonnegative(tx.change) &&
    Array.isArray(tx.items) && tx.items.every(item =>
      object(item) && text(item.productId) && text(item.name) &&
      text(item.pkgName) && nonnegative(item.qty) && nonnegative(item.unitPrice) &&
      nonnegative(item.subtotal) && nonnegative(item.baseQty) && nonnegative(item.cost))
  );
  const validPurchases = state.purchases.every(p =>
    object(p) && text(p.id) && text(p.date) && text(p.productId) &&
    text(p.name) && text(p.pkgName) && text(p.supplier) &&
    nonnegative(p.qty) && nonnegative(p.addedBase) && nonnegative(p.costPerPkg)
  );
  const validOpnames = state.opnames.every(o =>
    object(o) && text(o.id) && text(o.date) && text(o.productId) &&
    text(o.name) && nonnegative(o.before) && nonnegative(o.after) &&
    typeof o.diff === 'number' && Number.isSafeInteger(o.diff) && text(o.note)
  );
  if (!validProduct || !validTxs || !validPurchases || !validOpnames) {
    throw new Error('Isi cadangan tidak lengkap atau rusak. Data sebelumnya tidak diubah.');
  }
  return state;
}
