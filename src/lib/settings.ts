export type ShopProfile = { name: string; address: string; phone: string; whatsapp: string; note: string; logo: string };
export const defaultProfile: ShopProfile = { name: 'SembakoPOS', address: '', phone: '', whatsapp: '', note: '', logo: '' };
export const receiptElements = ['logo', 'phone', 'whatsapp', 'transaction', 'date', 'items', 'total', 'paid', 'change', 'footer'] as const;
export type ReceiptElement = typeof receiptElements[number];
export type ReceiptSettings = { paper: '58' | '80'; align: 'left' | 'center'; fontSize: 'small' | 'medium' | 'large'; footerText: string; visible: Record<ReceiptElement, boolean> };
export const defaultReceipt: ReceiptSettings = { paper: '58', align: 'center', fontSize: 'medium', footerText: 'Terima kasih!', visible: { logo: true, phone: true, whatsapp: true, transaction: true, date: true, items: true, total: true, paid: true, change: true, footer: true } };
