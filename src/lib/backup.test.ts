import { describe, expect, it } from 'vitest';
import { createBackup, readBackup } from './backup';
import { checkout, seed } from './pos';
import { defaultProfile, defaultReceipt } from './settings';

describe('cadangan data SembakoPOS', () => {
  it('menjaga transaksi, stok, kemasan, foto, barcode, dan pengaturan', () => {
    const initial = seed();
    const p = initial.products[0]; if (!p) throw new Error('Produk contoh hilang');
    p.barcode = '0012345678905'; p.image = 'data:image/png;base64,YQ==';
    const result = checkout(initial, [{ uid: 'a', productId: p.id, pkgId: 'pouch', qty: 5 }], 0, 110000);
    if (!result.ok) throw new Error(result.error);
    const state = { ...result.state, profile: { ...defaultProfile, name: 'Warung Uji' }, receipt: { ...defaultReceipt, paper: '80' as const } };
    const parsed = readBackup(createBackup(state, '2026-10-17T00:00:00.000Z'));
    expect(parsed.txs).toEqual(state.txs);
    expect(parsed.products[0]?.stock).toBe(19);
    expect(parsed.products[0]?.packages).toEqual(state.products[0]?.packages);
    expect(parsed.products[0]?.barcode).toBe('0012345678905');
    expect(parsed.products[0]?.image).toBe(p.image);
    expect(parsed.profile?.name).toBe('Warung Uji');
    expect(parsed.receipt?.paper).toBe('80');
  });
  it('menolak berkas tidak valid dan struktur transaksi rusak', () => {
    expect(() => readBackup('{invalid')).toThrow();
    expect(() => readBackup(JSON.stringify({ format: 'lain', version: 1, state: seed() }))).toThrow();
    expect(() => readBackup(JSON.stringify({ format: 'sembakopos-backup-v1', version: 1, state: { ...seed(), products: [{ id: 'x', name: 'Rusak', packages: [], stock: -1 }] } }))).toThrow();
    expect(() => readBackup(JSON.stringify({ format: 'sembakopos-backup-v1', version: 1, state: { ...seed(), txs: [{ id: 'x', total: 1, items: null }] } }))).toThrow();
  });
});
