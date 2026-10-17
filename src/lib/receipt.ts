import { formatDate, formatNum, formatRp, type Tx } from './pos';
import { defaultProfile, defaultReceipt, type ShopProfile, type ReceiptSettings } from './settings';
import { isSafeImage } from './image';
export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
/** Jangan cetak nama kemasan dua kali bila sudah tercantum dalam nama produk. */
function needsPackagingLabel(productName: string, packageName: string): boolean {
  const normalize = (value: string) =>
    value.toLocaleLowerCase('id-ID').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const packageText = normalize(packageName);
  return !!packageText && !(` ${normalize(productName)} `.includes(` ${packageText} `));
}

export function receiptMarkup(tx: Tx, profile: ShopProfile = defaultProfile, settings: ReceiptSettings = defaultReceipt) {
  const e = escapeHtml, v = settings.visible;
  const row = (label: string, amount: number, strong = false) => `<div class="receipt-row${strong ? ' receipt-total' : ''}"><span>${e(label)}</span><span>${e(formatRp(amount))}</span></div>`;
  return `<article class="thermal-receipt"><header class="receipt-header">${v.logo && isSafeImage(profile.logo) ? `<img class="receipt-logo" src="${profile.logo}" alt="Logo toko">` : ''}<h1>${e(profile.name || 'SembakoPOS')}</h1>${profile.address ? `<p>${e(profile.address)}</p>` : ''}${v.phone && profile.phone ? `<p>HP: ${e(profile.phone)}</p>` : ''}${v.whatsapp && profile.whatsapp ? `<p>WA: ${e(profile.whatsapp)}</p>` : ''}${profile.note ? `<p>${e(profile.note)}</p>` : ''}<p class="receipt-demo">STRUK DEMO · TIDAK RESMI</p>${v.transaction ? `<p>${e(tx.id)}</p>` : ''}${v.date ? `<p>${e(formatDate(tx.date))}</p>` : ''}</header>${v.items ? `<section class="receipt-items">${tx.items.map(i => `<div class="receipt-item"><div class="receipt-item-name">${e(i.name)}</div>${needsPackagingLabel(i.name, i.pkgName) ? `<div class="receipt-item-package">Kemasan: ${e(i.pkgName)}</div>` : ''}<div class="receipt-row receipt-item-prices"><span>${e(formatNum(i.qty))} × ${e(formatRp(i.unitPrice))}${i.wholesale ? ' (grosir)' : ''}</span><span>${e(formatRp(i.subtotal))}</span></div></div>`).join('')}</section>` : ''}<section class="receipt-summary">${v.total ? `${row('Subtotal', tx.subtotal)}${tx.discount ? row('Diskon', -tx.discount) : ''}${row('TOTAL', tx.total, true)}` : ''}${v.paid ? row('Tunai', tx.paid) : ''}${v.change ? row('Kembalian', tx.change) : ''}</section>${v.footer ? `<footer class="receipt-footer">${e(settings.footerText)}</footer>` : ''}</article>`;
}
export function receiptCss(settings: ReceiptSettings) {
  const paper = settings.paper === '80' ? 80 : 58;
  const font = settings.fontSize === 'small' ? 9 : settings.fontSize === 'large' ? 12 : 10;
  const align = settings.align === 'left' ? 'left' : 'center';
  return `
:root { color-scheme: light; --receipt-ink: #111; --receipt-paper: #fff; }
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--receipt-paper); color: var(--receipt-ink); }
body { width: ${paper}mm; max-width: 100%; }
.thermal-receipt {
  width: ${paper}mm;
  max-width: 100%;
  margin: 0 auto;
  padding: 2.5mm 3mm 3mm;
  font: ${font}pt/1.3 Arial, Helvetica, sans-serif;
  letter-spacing: normal;
  font-variant-numeric: tabular-nums;
  overflow-wrap: break-word;
  word-break: normal;
  background: var(--receipt-paper);
}
.receipt-header { text-align: ${align}; }
.receipt-header h1 { font-size: 1.26em; line-height: 1.2; margin: 0 0 1mm; font-weight: 750; }
.receipt-header p { white-space: pre-wrap; margin: .55mm 0; font-size: .9em; line-height: 1.3; }
.receipt-logo { display: block; max-width: 20mm; max-height: 16mm; margin: 0 ${align === 'center' ? 'auto' : '0'} 1.5mm; }
.receipt-header .receipt-demo { font-size: .76em; font-weight: 600; margin: .65mm 0 1mm; letter-spacing: normal; }
.receipt-items, .receipt-summary, .receipt-footer {
  border-top: .22mm dashed #555;
  margin-top: 1.7mm;
  padding-top: 1.6mm;
}
.receipt-item { margin: 0 0 1.6mm; break-inside: avoid; page-break-inside: avoid; }
.receipt-item:last-child { margin-bottom: 0; }
.receipt-item-name { font-weight: 700; line-height: 1.25; }
.receipt-item-package { font-size: .85em; line-height: 1.2; margin: .45mm 0; }
.receipt-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  align-items: baseline;
  column-gap: 1.5mm;
}
.receipt-row > span:first-child { min-width: 0; }
.receipt-row > span:last-child {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.receipt-item-prices { font-size: .93em; margin-top: .6mm; }
.receipt-summary .receipt-row { margin-bottom: .6mm; }
.receipt-total {
  font-weight: 800;
  font-size: 1.13em;
  border-top: .2mm solid #555;
  padding-top: 1.1mm;
  margin-top: 1.1mm;
  margin-bottom: 1.2mm !important;
}
.receipt-footer { text-align: ${align}; white-space: pre-wrap; font-size: .9em; }
@page { size: auto; margin: 0; }
@media print {
  html, body { width: ${paper}mm !important; max-width: ${paper}mm !important; overflow: visible; }
  .thermal-receipt { width: 100%; max-width: none; padding: 2.5mm 3mm 3mm; margin: 0 auto; break-inside: auto; }
}
`;
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
