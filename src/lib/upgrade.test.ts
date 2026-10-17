import { describe, it, expect, vi } from 'vitest';
import { seed, checkout, addPurchase, addOpname, priceCart } from './pos';
import { findByBarcode, barcodeConflict } from './barcode';
import { loadState, migrateState, persistState, STORAGE_KEY } from './persistence';
import { defaultProfile, defaultReceipt } from './settings';
import { receiptDocument, printReceipt, sampleReceipt } from './receipt';
import { isSafeImage, compressImage } from './image';
const line = (qty: number) => ({ uid: 'test', productId: 'minyak', pkgId: 'pouch', qty });
describe('Upgrade SembakoPOS', () => {
  it('migrates all histories and prices without changing old stored bytes', () => {
    let state = seed(); const sale = checkout(state, [line(5)], 0, 110000); if (!sale.ok) throw Error('checkout'); state = sale.state;
    const purchase = addPurchase(state, 'minyak', 'karton', 1, 222000, 'Pemasok'); if (!purchase.ok) throw Error('purchase');
    state = addOpname(purchase.state, 'minyak', 30, 'hitung fisik');
    const raw = JSON.stringify(state), storage = { getItem: vi.fn(() => raw) };
    const migrated = loadState(storage);
    expect(migrated.txs).toEqual(state.txs); expect(migrated.purchases).toEqual(state.purchases); expect(migrated.opnames).toEqual(state.opnames);
    expect(migrated.products[0]?.stock).toBe(30); expect(migrated.products[0]?.packages).toEqual(state.products[0]?.packages);
    expect(storage.getItem(STORAGE_KEY)).toBe(raw); expect(migrated.profile).toEqual(defaultProfile); expect(migrated.receipt).toEqual(defaultReceipt);
  });
  it('preserves photos, zero-prefixed barcode and optional profile/settings on reload', () => {
    const state = { ...seed(), profile: { ...defaultProfile, name: 'Toko Uji', logo: 'data:image/png;base64,YQ==' }, receipt: { ...defaultReceipt, paper: '80' as const, visible: { ...defaultReceipt.visible, phone: false } } };
    const first = state.products[0]; if (!first) throw Error('product'); first.barcode = '0012345678905'; first.image = 'data:image/webp;base64,YQ==';
    let raw = ''; expect(persistState({ setItem: (_k, v) => { raw = v; } }, state).ok).toBe(true);
    const loaded = loadState({ getItem: () => raw }); expect(loaded.products[0]?.barcode).toBe('0012345678905'); expect(loaded.products[0]?.image).toBe(first.image); expect(loaded.profile?.name).toBe('Toko Uji'); expect(loaded.receipt?.paper).toBe('80'); expect(loaded.receipt?.visible.phone).toBe(false);
  });
  it('quota failure leaves existing data intact', () => {
    const old = JSON.stringify(seed()); const storage = { getItem: () => old, setItem: () => { throw new DOMException('full', 'QuotaExceededError'); } };
    expect(persistState(storage, { ...seed(), profile: defaultProfile }).ok).toBe(false); expect(storage.getItem()).toBe(old);
  });
  it('rejects corrupted data without silently replacing it', () => {
    expect(() => loadState({ getItem: () => '{bad' })).toThrow(); expect(() => migrateState({ products: [] })).toThrow();
  });
  it('maps barcode strings exactly and preserves leading zeroes', () => {
    const products = seed().products.map((p, i) => ({ ...p, barcode: i === 0 ? '0012345678905' : '' }));
    expect(findByBarcode(products, ' 0012345678905 ')?.id).toBe('minyak'); expect(findByBarcode(products, '12345678905')).toBeUndefined(); expect(findByBarcode(products, '')).toBeUndefined(); expect(findByBarcode(products, 'unknown')).toBeUndefined();
  });
  it('rejects duplicates but allows current product and empty barcode', () => {
    const products = seed().products.map(p => ({ ...p, barcode: p.id === 'minyak' ? '00123' : '' }));
    expect(barcodeConflict(products, '00123', 'beras')).toBe(true); expect(barcodeConflict(products, '00123', 'minyak')).toBe(false); expect(barcodeConflict(products, '', null)).toBe(false);
  });
  it('12 pouch keep pouch packaging at 19500 each, even across additions', () => {
    const items = priceCart(seed().products, [line(7), line(5)]);
    expect(items[0]?.qty).toBe(12); expect(items[0]?.pkgName).toBe('Pouch'); expect(items[0]?.unitPrice).toBe(19500); expect(items[0]?.subtotal).toBe(234000);
  });
  it('5 pouch total 105000, cash 110000 change 5000, stock 24 to 19', () => {
    const before = seed(); const result = checkout(before, [line(5)], 0, 110000);
    expect(result.ok).toBe(true); if (!result.ok) return; expect(result.tx.total).toBe(105000); expect(result.tx.change).toBe(5000); expect(result.state.products[0]?.stock).toBe(19); expect(before.products[0]?.stock).toBe(24);
  });
  it('failed checkout leaves all state intact', () => {
    const state = seed(), original = JSON.stringify(state);
    expect(checkout(state, [line(25)], 0, 1000000).ok).toBe(false); expect(checkout(state, [line(5)], 0, 100000).ok).toBe(false); expect(JSON.stringify(state)).toBe(original);
  });
  it('58/80mm receipt documents honor settings and escape user text', () => {
    const profile = { ...defaultProfile, name: '<script>alert(1)</script>', phone: 'SECRET_PHONE', address: '<img src=x onerror=alert(1)>' };
    const settings = { ...defaultReceipt, paper: '80' as const, visible: { ...defaultReceipt.visible, phone: false, items: false }, footerText: '<b>Terima kasih</b>' };
    const doc = receiptDocument(sampleReceipt, profile, settings), dom = new DOMParser().parseFromString(doc, 'text/html');
    expect(dom.querySelector('script')).toBeNull(); expect(dom.querySelector('h1')?.textContent).toBe(profile.name); expect(dom.body.textContent).not.toContain('SECRET_PHONE'); expect(dom.querySelector('.receipt-items')).toBeNull(); expect(dom.querySelector('style')?.textContent).toContain('size:80mm auto'); expect(receiptDocument(sampleReceipt)).toContain('size:58mm auto'); expect(dom.querySelector('footer')?.textContent).toBe(settings.footerText);
  });
  it('popup-blocked printing reports failure', () => {
    vi.spyOn(window, 'open').mockReturnValue(null); const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    printReceipt(sampleReceipt); expect(alert).toHaveBeenCalledOnce(); vi.restoreAllMocks();
  });
  it('rejects executable images and unsupported uploads', async () => {
    expect(isSafeImage('data:image/svg+xml;base64,YQ==')).toBe(false); expect(isSafeImage('javascript:alert(1)')).toBe(false); expect(isSafeImage('data:image/webp;base64,YQ==')).toBe(true);
    await expect(compressImage(new File(['x'], 'photo.heic', { type: 'image/heic' }))).rejects.toThrow();
  });
});
