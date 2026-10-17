import { useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductImage } from './ProductImage';
import { compressImage } from '@/lib/image';
export function ImageUpload({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const file = useRef<HTMLInputElement>(null), camera = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const select = async (input: HTMLInputElement) => {
    const chosen = input.files?.[0]; if (!chosen) return;
    setBusy(true); setError('');
    try { onChange(await compressImage(chosen)); } catch (e) { setError(e instanceof Error ? e.message : 'Foto gagal diolah.'); }
    finally { setBusy(false); input.value = ''; }
  };
  return <div className="space-y-2"><span className="label">{label} (opsional)</span><div className="flex flex-wrap items-center gap-2">
    <ProductImage src={value} name={label} className="size-20" />
    <input ref={file} aria-label={`Unggah ${label}`} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => void select(e.currentTarget)} />
    <input ref={camera} aria-label={`Kamera ${label}`} className="hidden" type="file" accept="image/*" capture="environment" onChange={e => void select(e.currentTarget)} />
    <Button variant="secondary" disabled={busy} onClick={() => file.current?.click()}><ImagePlus />{busy ? 'Mengolah…' : value ? 'Ganti foto' : 'Pilih foto'}</Button>
    <Button variant="outline" disabled={busy} onClick={() => camera.current?.click()}><Camera />Kamera</Button>
    {value && <Button variant="ghost" title="Hapus foto" aria-label={`Hapus ${label}`} disabled={busy} onClick={() => onChange('')}><Trash2 /></Button>}
  </div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div>;
}
