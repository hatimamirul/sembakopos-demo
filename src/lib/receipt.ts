import { formatDate, formatNum, formatRp, type Tx } from './pos';
import { defaultProfile, defaultReceipt, type ShopProfile, type ReceiptSettings } from './settings';
import { isSafeImage } from './image';
export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
export function receiptMarkup(tx: Tx, profile: ShopProfile = defaultProfile, settings: ReceiptSettings = defaultReceipt) {
  const e = escapeHtml, v = settings.visible;
  const row = (label: string, amount: number, strong = false) => `<div class="receipt-row${strong ? ' receipt-total' : ''}"><span>${e(label)}</span><span>${e(formatRp(amount))}</span></div>`;
  return `<article class="thermal-receipt"><header class="receipt-header">${v.logo && isSafeImage(profile.logo) ? `<img class="receipt-logo" src="${profile.logo}" alt="Logo toko">` : ''}<h1>${e(profile.name || 'SembakoPOS')}</h1>${profile.address ? `<p>${e(profile.address)}</p>` : ''}${v.phone && profile.phone ? `<p>HP: ${e(profile.phone)}</p>` : ''}${v.whatsapp && profile.whatsapp ? `<p>WA: ${e(profile.whatsapp)}</p>` : ''}${profile.note ? `<p>${e(profile.note)}</p>` : ''}<p class="receipt-demo">STRUK DEMO — bukan bukti pembayaran resmi</p>${v.transaction ? `<p>${e(tx.id)}</p>` : ''}${v.date ? `<p>${e(formatDate(tx.date))}</p>` : ''}</header>${v.items ? `<section class="receipt-items">${tx.items.map(i => `<div class="receipt-item"><div>${e(i.name)} · ${e(i.pkgName)}</div><div class="receipt-row"><span>${e(formatNum(i.qty))} × ${e(formatRp(i.unitPrice))}${i.wholesale ? ' (grosir)' : ''}</span><span>${e(formatRp(i.subtotal))}</span></div></div>`).join('')}</section>` : ''}<section class="receipt-summary">${v.total ? `${row('Subtotal', tx.subtotal)}${tx.discount ? row('Diskon', -tx.discount) : ''}${row('Total', tx.total, true)}` : ''}${v.paid ? row('Tunai', tx.paid) : ''}${v.change ? row('Kembalian', tx.change) : ''}</section>${v.footer ? `<footer class="receipt-footer">${e(settings.footerText)}</footer>` : ''}</article>`;
}
export function receiptCss(settings: ReceiptSettings) {
  const paper = settings.paper === '80' ? 80 : 58;
  const font = settings.fontSize === 'small' ? 9 : settings.fontSize === 'large' ? 12 : 10;
  const align = settings.align === 'left' ? 'left' : 'center';
  return `:root{--receipt-ink:#000;--receipt-paper:#fff}*{box-sizing:border-box}html,body{margin:0;padding:0;background:var(--receipt-paper);color:var(--receipt-ink)}.thermal-receipt{width:${paper - 6}mm;max-width:100%;margin:3mm auto;font: ${font}pt/1.35 monospace;overflow-wrap:anywhere}.receipt-header{text-align:${align}}h1{font-size:1.35em;margin:0 0 2mm}p{white-space:pre-wrap;margin:1mm 0}.receipt-logo{display:block;max-width:20mm;max-height:18mm;margin:0 ${align === 'center' ? 'auto' : '0'} 2mm}.receipt-demo{font-size:.8em}.receipt-items,.receipt-summary,.receipt-footer{border-top:.25mm dashed var(--receipt-ink);margin-top:2mm;padding-top:2mm}.receipt-row{display:flex;justify-content:space-between;gap:2mm}.receipt-row>span:last-child{text-align:right;flex-shrink:0}.receipt-item{margin-bottom:2mm}.receipt-total{font-weight:bold;font-size:1.15em}.receipt-footer{text-align:${align};white-space:pre-wrap}@page{size:${paper}mm auto;margin:0}@media print{html,body{width:${paper}mm}.thermal-receipt{margin:3mm;break-inside:avoid}}`;
}
export function receiptDocument(tx: Tx, profile: ShopProfile = defaultProfile, settings: ReceiptSettings = defaultReceipt) {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Struk ${escapeHtml(tx.id)}</title><style>${receiptCss(settings)}</style></head><body>${receiptMarkup(tx, profile, settings)}</body></html>`;
}
export function printReceipt(tx: Tx, profile: ShopProfile = defaultProfile, settings: ReceiptSettings = defaultReceipt) {
  const w = window.open('', '_blank', 'width=440,height=720');
  if (!w) { alert('Pop-up diblokir browser. Izinkan pop-up untuk mencetak struk.'); return; }
  w.document.write(receiptDocument(tx, profile, settings)); w.document.close();
  const print = async () => {
    await Promise.all(Array.from(w.document.images).map(img => img.decode().catch(() => undefined)));
    w.focus(); w.print();
  };
  if (w.document.readyState === 'complete') void print(); else w.addEventListener('load', () => void print(), { once: true });
}
export const sampleReceipt: Tx = { id: 'CONTOH-001', date: '2026-10-17T05:00:00Z', items: [{ productId: 'minyak', name: 'Minyak Goreng Pouch 1 L', pkgName: 'Pouch', qty: 5, unitPrice: 21000, wholesale: false, subtotal: 105000, cost: 92500, baseQty: 5 }], subtotal: 105000, discount: 0, total: 105000, paid: 110000, change: 5000 };
