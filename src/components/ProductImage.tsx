import { ImageIcon } from 'lucide-react';
import { isSafeImage } from '@/lib/image';
export function ProductImage({ src, name, className = '' }: { src?: string; name: string; className?: string }) {
  return <div className={`overflow-hidden rounded-md bg-muted flex items-center justify-center shrink-0 ${className}`}>
    {isSafeImage(src) ? <img src={src} alt={name} className="w-full h-full object-contain" /> : <ImageIcon aria-label="Belum ada foto" className="size-7 text-muted-foreground" />}
  </div>;
}
