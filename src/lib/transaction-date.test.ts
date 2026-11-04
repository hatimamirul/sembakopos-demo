import { expect, it, vi } from 'vitest';
import { checkout, seed } from './pos';
import { migrateState } from './persistence';
const cart = [{ uid: 'date-test', productId: 'minyak', pkgId: 'pouch', qty: 1 }];

it('uses checkout time automatically', () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date('2026-11-04T12:00:00Z'));
    const result = checkout(seed(), cart, 0, 21000);
    expect(result.ok && result.tx.date).toBe('2026-11-04T12:00:00.000Z');
  } finally { vi.useRealTimers(); }
});

it('saves a manually selected date through storage and rejects invalid dates', () => {
  const result = checkout(seed(), cart, 0, 21000, { date: '2026-11-03T19:15:00+07:00' });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.tx.date).toBe('2026-11-03T12:15:00.000Z');
  expect(migrateState(JSON.parse(JSON.stringify(result.state))).txs[0].date).toBe(result.tx.date);
  expect(checkout(seed(), cart, 0, 21000, { date: '' }).ok).toBe(false);
  expect(checkout(seed(), cart, 0, 21000, { date: 'invalid' }).ok).toBe(false);
});
