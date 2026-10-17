// Logika inti SembakoPOS (demo, murni tanpa efek samping agar mudah dites).
export type Pkg = {
  id: string;
  name: string; // nama kemasan, mis. "Pouch", "Karton"
  factor: number; // isi dalam satuan dasar
  retail: number; // harga ecer per kemasan
  wholesale: number; // harga grosir per kemasan (0 = tidak ada)
  wholesaleMin: number; // ambang grosir (jumlah kemasan)
};
import type { ShopProfile, ReceiptSettings } from './settings';

export type Product = {
  id: string;
  name: string;
  baseUnit: string;
  cost: number; // harga modal per satuan dasar
  stock: number; // stok dalam satuan dasar
  packages: Pkg[];
  image?: string;
  barcode?: string;
};
export type CartLine = { uid: string; productId: string; pkgId: string; qty: number };
export type TxItem = {
  productId: string;
  name: string;
  pkgName: string;
  qty: number;
  unitPrice: number;
  wholesale: boolean;
  subtotal: number;
  cost: number;
  baseQty: number;
};
export type Tx = {
  id: string;
  date: string;
  items: TxItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  change: number;
};
export type Purchase = {
  id: string;
  date: string;
  productId: string;
  name: string;
  pkgName: string;
  qty: number;
  addedBase: number;
  costPerPkg: number;
  supplier: string;
};
export type Opname = {
  id: string;
  date: string;
  productId: string;
  name: string;
  before: number;
  after: number;
  diff: number;
  note: string;
};
export type State = { products: Product[]; txs: Tx[]; purchases: Purchase[]; opnames: Opname[]; profile?: ShopProfile; receipt?: ReceiptSettings };

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function seed(): State {
  return {
    products: [
      {
        id: "minyak",
        name: "Minyak Goreng Pouch 1 L",
        baseUnit: "pouch",
        cost: 18500,
        stock: 24,
        packages: [
          { id: "pouch", name: "Pouch", factor: 1, retail: 21000, wholesale: 19500, wholesaleMin: 12 },
          { id: "karton", name: "Karton (12 pouch)", factor: 12, retail: 234000, wholesale: 0, wholesaleMin: 0 },
        ],
      },
      {
        id: "beras",
        name: "Beras Medium",
        baseUnit: "kg",
        cost: 12000,
        stock: 150,
        packages: [
          { id: "kg", name: "Kg", factor: 1, retail: 13500, wholesale: 13000, wholesaleMin: 10 },
          { id: "karung", name: "Karung 25 kg", factor: 25, retail: 320000, wholesale: 0, wholesaleMin: 0 },
        ],
      },
      {
        id: "gula",
        name: "Gula Pasir",
        baseUnit: "kg",
        cost: 15500,
        stock: 120,
        packages: [
          { id: "kg", name: "Kg", factor: 1, retail: 17500, wholesale: 17000, wholesaleMin: 10 },
          { id: "karung", name: "Karung 50 kg", factor: 50, retail: 830000, wholesale: 0, wholesaleMin: 0 },
        ],
      },
      {
        id: "bumbu",
        name: "Bumbu Instan Sachet",
        baseUnit: "sachet",
        cost: 2200,
        stock: 100,
        packages: [
          { id: "sachet", name: "Sachet", factor: 1, retail: 3000, wholesale: 2700, wholesaleMin: 10 },
          { id: "dus", name: "Dus (20 sachet)", factor: 20, retail: 52000, wholesale: 0, wholesaleMin: 0 },
        ],
      },
    ],
    txs: [],
    purchases: [],
    opnames: [],
  };
}

const rp = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
export const formatRp = (n: number) => rp.format(Math.round(n));
export const formatNum = (n: number) => new Intl.NumberFormat("id-ID").format(n);
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

/** Validasi angka bulat >= min. Mengembalikan null jika tidak valid. */
export function parseIntStrict(v: string, min = 0): number | null {
  const s = v.trim().replace(/\./g, "");
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isSafeInteger(n) || n < min) return null;
  return n;
}

export function unitPriceFor(pkg: Pkg, totalQty: number) {
  const ws = pkg.wholesale > 0 && pkg.wholesaleMin > 0 && totalQty >= pkg.wholesaleMin;
  return { price: ws ? pkg.wholesale : pkg.retail, wholesale: ws };
}

/** Gabungkan baris keranjang per produk+kemasan lalu hitung harga dari TOTAL kuantitas. */
export function priceCart(products: Product[], cart: CartLine[]): TxItem[] {
  const groups = new Map<string, { productId: string; pkgId: string; qty: number }>();
  for (const l of cart) {
    const k = `${l.productId}|${l.pkgId}`;
    const g = groups.get(k);
    if (g) g.qty += l.qty;
    else groups.set(k, { productId: l.productId, pkgId: l.pkgId, qty: l.qty });
  }
  const items: TxItem[] = [];
  for (const g of groups.values()) {
    const p = products.find((x) => x.id === g.productId);
    const pkg = p?.packages.find((x) => x.id === g.pkgId);
    if (!p || !pkg || g.qty <= 0) continue;
    const { price, wholesale } = unitPriceFor(pkg, g.qty);
    items.push({
      productId: p.id,
      name: p.name,
      pkgName: pkg.name,
      qty: g.qty,
      unitPrice: price,
      wholesale,
      subtotal: price * g.qty,
      baseQty: g.qty * pkg.factor,
      cost: p.cost * g.qty * pkg.factor,
    });
  }
  return items;
}

/** Kebutuhan stok per produk (satuan dasar) dibanding stok tersedia. */
export function stockProblems(products: Product[], cart: CartLine[]): string[] {
  const need = new Map<string, number>();
  for (const it of priceCart(products, cart)) need.set(it.productId, (need.get(it.productId) ?? 0) + it.baseQty);
  const errs: string[] = [];
  for (const [id, n] of need) {
    const p = products.find((x) => x.id === id);
    if (!p) continue;
    if (n > p.stock) errs.push(`Stok ${p.name} tidak cukup: butuh ${formatNum(n)} ${p.baseUnit}, tersedia ${formatNum(p.stock)} ${p.baseUnit}.`);
  }
  return errs;
}

export type CheckoutResult = { ok: true; state: State; tx: Tx } | { ok: false; error: string };

export function checkout(state: State, cart: CartLine[], discount: number, paid: number): CheckoutResult {
  const items = priceCart(state.products, cart);
  if (items.length === 0) return { ok: false, error: "Keranjang masih kosong." };
  if (!Number.isInteger(discount) || discount < 0) return { ok: false, error: "Diskon tidak valid." };
  if (!Number.isInteger(paid) || paid < 0) return { ok: false, error: "Jumlah bayar tidak valid." };
  const errs = stockProblems(state.products, cart);
  if (errs.length) return { ok: false, error: errs.join(" ") };
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  if (discount > subtotal) return { ok: false, error: "Diskon melebihi subtotal." };
  const total = subtotal - discount;
  if (paid < total) return { ok: false, error: `Uang kurang ${formatRp(total - paid)}.` };
  const tx: Tx = { id: "TRX-" + uid().toUpperCase(), date: new Date().toISOString(), items, subtotal, discount, total, paid, change: paid - total };
  const products = state.products.map((p) => {
    const used = items.filter((i) => i.productId === p.id).reduce((s, i) => s + i.baseQty, 0);
    return used ? { ...p, stock: p.stock - used } : p;
  });
  return { ok: true, tx, state: { ...state, products, txs: [tx, ...state.txs] } };
}

export function addPurchase(state: State, productId: string, pkgId: string, qty: number, costPerPkg: number, supplier: string): { ok: true; state: State } | { ok: false; error: string } {
  const p = state.products.find((x) => x.id === productId);
  const pkg = p?.packages.find((x) => x.id === pkgId);
  if (!p || !pkg) return { ok: false, error: "Pilih barang dan kemasan." };
  if (!Number.isInteger(qty) || qty < 1) return { ok: false, error: "Jumlah minimal 1." };
  if (!Number.isInteger(costPerPkg) || costPerPkg < 1) return { ok: false, error: "Harga beli tidak valid." };
  const added = qty * pkg.factor;
  // Harga modal: rata-rata tertimbang
  const newCost = Math.round((p.cost * p.stock + costPerPkg * qty) / (p.stock + added));
  const rec: Purchase = { id: uid(), date: new Date().toISOString(), productId, name: p.name, pkgName: pkg.name, qty, addedBase: added, costPerPkg, supplier };
  return {
    ok: true,
    state: {
      ...state,
      products: state.products.map((x) => (x.id === p.id ? { ...x, stock: x.stock + added, cost: newCost } : x)),
      purchases: [rec, ...state.purchases],
    },
  };
}

export function addOpname(state: State, productId: string, after: number, note: string): State {
  const p = state.products.find((x) => x.id === productId);
  if (!p) return state;
  const rec: Opname = { id: uid(), date: new Date().toISOString(), productId, name: p.name, before: p.stock, after, diff: after - p.stock, note };
  return {
    ...state,
    products: state.products.map((x) => (x.id === productId ? { ...x, stock: after } : x)),
    opnames: [rec, ...state.opnames],
  };
}
