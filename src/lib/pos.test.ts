import { describe, expect, it } from "vitest";
import { addPurchase, checkout, priceCart, seed, parseIntStrict } from "./pos";

const line = (qty: number, pkgId = "pouch") => ({ uid: Math.random() + "", productId: "minyak", pkgId, qty });

describe("SembakoPOS", () => {
  it("5 pouch = Rp105.000, bayar 110.000 kembali 5.000, stok 19", () => {
    const r = checkout(seed(), [line(5)], 0, 110000);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tx.total).toBe(105000);
    expect(r.tx.change).toBe(5000);
    expect(r.state.products.find((p) => p.id === "minyak")!.stock).toBe(19);
  });
  it("grosir 19.500 mulai 12 pouch walau ditambah terpisah", () => {
    const items = priceCart(seed().products, [line(7), line(5)]);
    expect(items).toHaveLength(1);
    expect(items[0].unitPrice).toBe(19500);
    expect(items[0].subtotal).toBe(234000);
    expect(priceCart(seed().products, [line(11)])[0].unitPrice).toBe(21000);
  });
  it("tolak jika stok kurang dan stok tidak berubah", () => {
    const s = seed();
    const r = checkout(s, [line(20), line(1, "karton")], 0, 10_000_000);
    expect(r.ok).toBe(false);
    expect(s.products[0].stock).toBe(24);
  });
  it("uang kurang gagal", () => {
    expect(checkout(seed(), [line(5)], 0, 100000).ok).toBe(false);
  });
  it("kulakan 1 karton menambah 12 pouch", () => {
    const r = addPurchase(seed(), "minyak", "karton", 1, 222000, "");
    expect(r.ok && r.state.products[0].stock).toBe(36);
  });
  it("validasi angka ketat", () => {
    expect(parseIntStrict("12a")).toBeNull();
    expect(parseIntStrict("-3")).toBeNull();
    expect(parseIntStrict("110.000")).toBe(110000);
  });
});
