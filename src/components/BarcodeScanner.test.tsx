import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BarcodeScanner } from './BarcodeScanner';
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function cameraSetup(getUserMedia: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('isSecureContext', true);
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
}
it('denied camera permission shows a recoverable message without selecting product', async () => {
  const onCode = vi.fn(); cameraSetup(vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')));
  render(<BarcodeScanner onCode={onCode} onClose={vi.fn()} />);
  await screen.findByText(/Izin kamera ditolak/); expect(onCode).not.toHaveBeenCalled(); expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeEnabled();
});
it('native detection reports code once and stops every camera track', async () => {
  const stop = vi.fn(), onCode = vi.fn(); cameraSetup(vi.fn().mockResolvedValue({ getTracks: () => [{ stop }, { stop }] }));
  class Detector { static getSupportedFormats = async () => ['ean_13']; detect = async () => [{ rawValue: '0012345678905' }]; }
  vi.stubGlobal('BarcodeDetector', Detector);
  render(<BarcodeScanner onCode={onCode} onClose={vi.fn()} />);
  await waitFor(() => expect(onCode).toHaveBeenCalledWith('0012345678905'));
  expect(onCode).toHaveBeenCalledTimes(1); expect(stop).toHaveBeenCalledTimes(2);
});
it('closing while camera permission is pending stops the eventual stream', async () => {
  const stop = vi.fn(), onCode = vi.fn(); let resolve: ((stream: unknown) => void) | undefined;
  cameraSetup(vi.fn(() => new Promise(r => { resolve = r; })));
  const onClose = vi.fn(); const view = render(<BarcodeScanner onCode={onCode} onClose={onClose} />);
  fireEvent.click(screen.getAllByRole('button', { name: 'Tutup kamera' })[0] ?? screen.getByText('Tutup kamera'));
  expect(onClose).toHaveBeenCalledOnce(); view.unmount(); if (!resolve) throw Error('camera not requested'); resolve({ getTracks: () => [{ stop }] });
  await waitFor(() => expect(stop).toHaveBeenCalledOnce()); expect(onCode).not.toHaveBeenCalled();
});
