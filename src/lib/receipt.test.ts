import { expect, it } from 'vitest';
import { checkout, seed } from './pos';
import { receiptDocument, sampleReceipt } from './receipt';
import { defaultReceipt } from './settings';
import { migrateState } from './persistence';

it('keeps cashier and customer with the saved transaction for reprints', () => {
  const result = checkout(seed(), [{ uid: 'test', productId: 'minyak', pkgId: 'pouch', qty: 1 }], 0, 21000, { cashierName: '  Ani  ', customerName: '  Budi  ' });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const saved = migrateState(JSON.parse(JSON.stringify(result.state))).txs[0];
  expect(saved.cashierName).toBe('Ani');
  expect(saved.customerName).toBe('Budi');
  const dom = new DOMParser().parseFromString(receiptDocument(saved), 'text/html');
  expect(dom.querySelector('.receipt-parties')?.textContent).toContain('Kasir: Ani');
  expect(dom.querySelector('.receipt-customer')?.textContent).toContain('Pemesan: Budi');
  expect(dom.querySelector('.receipt-time')).not.toBeNull();
});

it('escapes receipt names, supports old transactions and footer paragraphs', () => {
  const settings = { ...defaultReceipt, footerText: 'Terima kasih\n\nBarang yang dibeli tidak dapat dikembalikan.', visible: { ...defaultReceipt.visible, date: false } };
  const dom = new DOMParser().parseFromString(receiptDocument({ ...sampleReceipt, cashierName: '<script>bad</script>' }, undefined, settings), 'text/html');
  expect(dom.querySelector('script')).toBeNull();
  expect(dom.querySelector('.receipt-parties')?.textContent).toContain('Kasir: <script>bad</script>');
  expect(dom.querySelector('.receipt-customer')?.textContent).toContain('Pemesan: -');
  expect(dom.querySelector('.receipt-time')).toBeNull();
  expect(dom.querySelectorAll('.receipt-footer p')).toHaveLength(2);
});
