import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function BarcodeScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Mengaktifkan kamera…');
  const [retry, setRetry] = useState(0), [failed, setFailed] = useState(false);
  useEffect(() => {
    let stopped = false, stream: MediaStream | undefined, timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => { stopped = true; if (timer) clearTimeout(timer); stream?.getTracks().forEach(t => t.stop()); if (video.current) video.current.srcObject = null; };
    const start = async () => {
      setFailed(false); setStatus('Mengaktifkan kamera…');
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Kamera membutuhkan HTTPS dan browser yang mendukung kamera. Gunakan input barcode manual.');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        const element = video.current; if (!element) { stop(); return; }
        element.srcObject = stream; await element.play();
        type Detector = { detect: (video: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
        type DetectorCtor = { new(options: { formats: string[] }): Detector; getSupportedFormats: () => Promise<string[]> };
        const native = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
        let detector: Detector | undefined;
        if (native) { try { const formats = await native.getSupportedFormats(); detector = new native({ formats: formats.filter(f => ['ean_13','ean_8','upc_a','upc_e','code_128','code_39','itf','codabar'].includes(f)) }); } catch { /* use ZXing */ } }
        const reader = detector ? undefined : new (await import('@zxing/browser')).BrowserMultiFormatReader();
        if (stopped) return;
        setStatus('Arahkan barcode ke kamera.');
        const scan = async () => {
          if (stopped) return;
          try {
            const code = detector ? (await detector.detect(element))[0]?.rawValue : reader?.decodeFromCanvas((() => { const canvas = document.createElement('canvas'); canvas.width = element.videoWidth; canvas.height = element.videoHeight; canvas.getContext('2d')?.drawImage(element, 0, 0); return canvas; })()).getText();
            if (code) { stop(); onCode(code); return; }
          } catch { /* no code in this frame */ }
          if (!stopped) timer = setTimeout(() => void scan(), 180);
        };
        void scan();
      } catch (e) {
        stop(); setFailed(true);
        const name = e instanceof Error ? e.name : '';
        setStatus(name === 'NotAllowedError' ? 'Izin kamera ditolak. Izinkan kamera pada pengaturan situs Chrome, atau gunakan input manual.' : name === 'NotFoundError' ? 'Kamera tidak ditemukan. Gunakan input manual atau scanner USB/Bluetooth.' : e instanceof Error && e.message.startsWith('Kamera membutuhkan') ? e.message : 'Kamera gagal dibuka atau sedang dipakai aplikasi lain. Tutup aplikasi kamera lalu coba lagi.');
      }
    };
    void start(); return stop;
  }, [retry, onCode]);
  return <div className="fixed inset-0 bg-foreground/40 z-50 grid place-items-center p-3" role="dialog" aria-modal="true" aria-labelledby="scanner-title"><div className="card p-4 max-w-lg w-full space-y-3">
    <div className="flex items-center justify-between"><h2 id="scanner-title" className="text-lg font-bold">Scan barcode</h2><Button variant="ghost" size="icon" aria-label="Tutup kamera" onClick={onClose}><X /></Button></div>
    <video ref={video} muted playsInline autoPlay className="w-full aspect-video object-cover rounded-md bg-muted" />
    <p role="status" className={failed ? 'text-destructive text-sm' : 'text-muted-foreground text-sm'}>{status}</p>
    <div className="flex gap-2">{failed && <Button onClick={() => setRetry(r => r + 1)}><Camera />Coba lagi</Button>}<Button variant="secondary" onClick={onClose}>Tutup kamera</Button></div>
  </div></div>;
}
