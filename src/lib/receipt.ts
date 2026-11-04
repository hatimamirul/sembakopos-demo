import { formatDate, formatNum, type Tx } from './pos';
import { defaultProfile, defaultReceipt, type ShopProfile, type ReceiptSettings } from './settings';
import { isSafeImage } from './image';
export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
export function receiptMarkup(tx: Tx, profile: ShopProfile = defaultProfile, settings: ReceiptSettings = defaultReceipt) {
  const e = escapeHtml, v = settings.visible;
  const amounts = [...tx.items.flatMap(i => [i.unitPrice, i.subtotal]), tx.subtotal, -tx.discount, tx.total, tx.paid, tx.change];
  const amountWidth = Math.max(1, ...amounts.map(n => formatNum(Math.round(n)).length));
  const rowFont = ((settings.paper === '80' ? 72 : 50) * 72 / 25.4) / ((5 + 2 * (amountWidth + 2.2)) * 0.6);
  const money = (amount: number) => `<span class="receipt-money"><span class="receipt-currency">Rp</span><span class="receipt-amount">${e(formatNum(Math.round(amount)))}</span></span>`;
  const row = (label: string, amount: number, strong = false, count = '') => `<div class="receipt-summary-row${strong ? ' receipt-total' : ''}"><span>${e(count)}</span><span class="receipt-label">${e(label)}<span>:</span></span>${money(amount)}</div>`;
  return `<article class="thermal-receipt" style="--receipt-row-font:${rowFont.toFixed(2)}pt;--receipt-amount-width:${amountWidth}ch"><header class="receipt-header">${v.logo && isSafeImage(profile.logo) ? `<img class="receipt-logo" src="${profile.logo}" alt="Logo toko">` : ''}<h1>${e(profile.name || 'SembakoPOS')}</h1>${profile.address ? `<p>${e(profile.address)}</p>` : ''}${v.phone && profile.phone ? `<p>Telp: ${e(profile.phone)}</p>` : ''}${v.whatsapp && profile.whatsapp ? `<p>WA: ${e(profile.whatsapp)}</p>` : ''}${profile.note ? `<p>${e(profile.note)}</p>` : ''}</header>${v.items ? `<section class="receipt-items">${tx.items.map(i => `<div class="receipt-item"><div class="receipt-item-name">${e(i.name)}</div><div class="receipt-item-detail"><span class="receipt-quantity">${e(formatNum(i.qty))} ${e(i.pkgName)}${i.wholesale ? ' (grosir)' : ''}</span>${money(i.unitPrice)}${money(i.subtotal)}</div></div>`).join('')}</section>` : ''}<section class="receipt-summary">${v.total ? `${tx.discount ? row('Subtotal', tx.subtotal) + row('Diskon', -tx.discount) : ''}${row('Total', tx.total, true, v.items ? tx.items.length + ' Item' : '')}` : ''}${v.paid ? row('Tunai', tx.paid) : ''}${v.change ? row('Kembali', tx.change) : ''}</section>${v.date ? `<div class="receipt-date">${e(formatDate(tx.date))}</div>` : ''}${v.footer ? `<footer class="receipt-footer">${e(settings.footerText)}</footer>` : ''}</article>`;
}
export function receiptCss(settings: ReceiptSettings) {
  const paper = settings.paper === '80' ? 80 : 58;
  const font = settings.fontSize === 'small' ? 9 : settings.fontSize === 'large' ? 12 : 10;
  const align = settings.align === 'left' ? 'left' : 'center';
  return `:root{--receipt-ink:#000;--receipt-paper:#fff}*{box-sizing:border-box}html,body{margin:0;padding:0;background:var(--receipt-paper);color:var(--receipt-ink)}.thermal-receipt{width:${paper - 6}mm;max-width:100%;margin:3mm auto;font:${font}pt/1.3 'Courier New',monospace;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.receipt-header{text-align:${align};margin-bottom:4mm}h1{font-size:1em;font-weight:normal;margin:0}p{white-space:pre-wrap;margin:0}.receipt-logo{display:block;max-width:20mm;max-height:18mm;margin:0 ${align === 'center' ? 'auto' : '0'} 2mm}.receipt-items,.receipt-summary{border-top:.6mm double var(--receipt-ink);padding-top:1.5mm}.receipt-item{margin-bottom:1mm;break-inside:avoid}.receipt-item-name{text-transform:uppercase}.receipt-item-detail{display:grid;grid-template-columns:minmax(0,1fr) repeat(2,calc(var(--receipt-amount-width) + 2.2ch));column-gap:1mm;align-items:baseline;font-size:min(1em,var(--receipt-row-font))}.receipt-quantity{min-width:0;padding-left:1ch}.receipt-money{display:grid;grid-template-columns:2ch minmax(0,1fr);column-gap:.2ch;align-items:baseline;min-width:0}.receipt-currency{text-align:left;white-space:nowrap}.receipt-amount{text-align:right;white-space:nowrap}.receipt-summary{margin-top:1mm}.receipt-summary-row{display:grid;grid-template-columns:minmax(0,1fr) repeat(2,calc(var(--receipt-amount-width) + 2.2ch));column-gap:1mm;align-items:baseline;font-size:min(1em,var(--receipt-row-font))}.receipt-label{display:flex;justify-content:space-between;padding-right:1ch}.receipt-total{font-weight:bold}.receipt-date{text-align:right;margin-top:4mm;font-size:.9em}.receipt-footer{text-align:${align};white-space:pre-wrap;margin-top:4mm}@page{size:${paper}mm auto;margin:0}@media print{html,body{width:${paper}mm}.thermal-receipt{margin:3mm;break-inside:avoid}}`;
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
