import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, it, expect, vi } from 'vitest';
import { StoreProvider, useStore } from './store';
import { checkout, seed } from './pos';
import { STORAGE_KEY } from './persistence';
function Harness() {
  const { state, setState, storageError } = useStore();
  return <><span data-testid="stock">{state.products[0]?.stock}</span><span data-testid="history">{state.txs.length}</span><p role="alert">{storageError}</p><button onClick={() => { const r = checkout(state, [{ uid: 'a', productId: 'minyak', pkgId: 'pouch', qty: 5 }], 0, 110000); if (r.ok) setState(r.state); }}>Pay</button></>;
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });
it('failed persistence does not commit stock or transaction in UI', async () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed())); render(<StoreProvider><Harness /></StoreProvider>);
  await screen.findByText('Pay'); vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  fireEvent.click(screen.getByText('Pay')); expect(screen.getByTestId('stock').textContent).toBe('24'); expect(screen.getByTestId('history').textContent).toBe('0'); expect(screen.getByRole('alert').textContent).toContain('belum disimpan');
});
it('loads existing history, safely persists and reads checkout back after remount', async () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed())); const view = render(<StoreProvider><Harness /></StoreProvider>);
  await screen.findByText('Pay'); fireEvent.click(screen.getByText('Pay')); await waitFor(() => expect(screen.getByTestId('stock').textContent).toBe('19'));
  view.unmount(); render(<StoreProvider><Harness /></StoreProvider>); await waitFor(() => expect(screen.getByTestId('stock').textContent).toBe('19')); expect(screen.getByTestId('history').textContent).toBe('1');
});
